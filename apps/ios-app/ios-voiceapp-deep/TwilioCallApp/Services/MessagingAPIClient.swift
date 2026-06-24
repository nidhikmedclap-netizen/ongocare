//
//  MessagingAPIClient.swift
//  TwilioCallApp
//

import Foundation

enum MessagingAPIClientError: LocalizedError {
    case badURL
    case http(Int, String?)
    case decode

    var errorDescription: String? {
        switch self {
        case .badURL: return "Invalid messaging API URL."
        case .http(let c, let detail):
            if c == 401 {
                let hint = " In Settings → Messaging API bearer, paste only your API key (same as curl). If you pasted “Bearer …”, remove the word Bearer—the app adds it."
                if let d = detail, !d.isEmpty { return "Unauthorized (401): \(d).\(hint)" }
                return "Unauthorized (401).\(hint)"
            }
            if let d = detail, !d.isEmpty { return "Messaging server error (\(c)): \(d)" }
            return "Messaging server error (\(c))."
        case .decode: return "Could not parse messages response."
        }
    }
}

enum MessagingAPIClient {
    struct LogRow: Decodable {
        let id: String
        let from: String
        let to: String
        let body: String
        let direction: String
        let at: String

        private enum CodingKeys: String, CodingKey {
            case id, messageSid, sid
            case from, to, body
            case direction
            case at, receivedAt
        }

        init(from decoder: Decoder) throws {
            let c = try decoder.container(keyedBy: CodingKeys.self)
            if let v = try c.decodeIfPresent(String.self, forKey: .id)?.trimmingCharacters(in: .whitespacesAndNewlines), !v.isEmpty {
                id = v
            } else if let v = try c.decodeIfPresent(String.self, forKey: .messageSid)?.trimmingCharacters(in: .whitespacesAndNewlines), !v.isEmpty {
                id = v
            } else if let v = try c.decodeIfPresent(String.self, forKey: .sid)?.trimmingCharacters(in: .whitespacesAndNewlines), !v.isEmpty {
                id = v
            } else {
                throw DecodingError.dataCorruptedError(
                    forKey: .id,
                    in: c,
                    debugDescription: "Expected id, messageSid, or sid."
                )
            }
            from = try c.decode(String.self, forKey: .from)
            to = try c.decode(String.self, forKey: .to)
            body = try c.decodeIfPresent(String.self, forKey: .body) ?? ""
            if let d = try c.decodeIfPresent(String.self, forKey: .direction)?.trimmingCharacters(in: .whitespacesAndNewlines), !d.isEmpty {
                direction = d
            } else {
                // Hosted APIs often omit direction; AppState infers from which side matches your lines.
                direction = "unknown"
            }
            if let a = try c.decodeIfPresent(String.self, forKey: .at)?.trimmingCharacters(in: .whitespacesAndNewlines), !a.isEmpty {
                at = a
            } else if let a = try c.decodeIfPresent(String.self, forKey: .receivedAt)?.trimmingCharacters(in: .whitespacesAndNewlines), !a.isEmpty {
                at = a
            } else {
                throw DecodingError.dataCorruptedError(
                    forKey: .at,
                    in: c,
                    debugDescription: "Expected at or receivedAt."
                )
            }
        }

        init(id: String, from: String, to: String, body: String, direction: String, at: String) {
            self.id = id
            self.from = from
            self.to = to
            self.body = body
            self.direction = direction
            self.at = at
        }

        var atDate: Date {
            let f = ISO8601DateFormatter()
            f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
            if let d = f.date(from: at) { return d }
            f.formatOptions = [.withInternetDateTime]
            return f.date(from: at) ?? Date()
        }

        /// Persists optimistic outbound rows to Firestore before the server log catches up; replaced by `unionSMSLogRows` when the API returns the real Twilio id.
        static func localOutboundPending(clientMessageId: UUID, from: String, to: String, body: String, at: Date = Date()) -> LogRow {
            let f = ISO8601DateFormatter()
            f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
            return LogRow(
                id: "local-\(clientMessageId.uuidString)",
                from: from,
                to: to,
                body: body,
                direction: "outbound",
                at: f.string(from: at)
            )
        }
    }

    /// Encodes `to` + `body`; includes `from` only when set (hosted API often infers From server-side).
    private struct SendBody: Encodable {
        let to: String
        let body: String
        let from: String?

        func encode(to encoder: Encoder) throws {
            var c = encoder.container(keyedBy: CodingKeys.self)
            try c.encode(to, forKey: .to)
            try c.encode(body, forKey: .body)
            if let from, !from.isEmpty {
                try c.encode(from, forKey: .from)
            }
        }

        enum CodingKeys: String, CodingKey {
            case to, body, from
        }
    }

    private struct ErrorBody: Decodable {
        let error: String?
        let message: String?
    }

    private static func parseServerError(data: Data) -> String? {
        guard let dec = try? JSONDecoder().decode(ErrorBody.self, from: data) else { return nil }
        if let e = dec.error?.trimmingCharacters(in: .whitespacesAndNewlines), !e.isEmpty { return e }
        if let m = dec.message?.trimmingCharacters(in: .whitespacesAndNewlines), !m.isEmpty { return m }
        return nil
    }

    /// Strips accidental `Bearer ` prefix and wrapping quotes so the header is never `Bearer Bearer …`.
    private static func normalizeBearerToken(_ raw: String?) -> String? {
        guard var t = raw?.trimmingCharacters(in: .whitespacesAndNewlines), !t.isEmpty else { return nil }
        if (t.hasPrefix("\"") && t.hasSuffix("\"") && t.count > 1) || (t.hasPrefix("'") && t.hasSuffix("'") && t.count > 1) {
            t = String(t.dropFirst().dropLast()).trimmingCharacters(in: .whitespacesAndNewlines)
        }
        if t.lowercased().hasPrefix("bearer ") {
            t = String(t.dropFirst(7)).trimmingCharacters(in: .whitespacesAndNewlines)
        }
        return t.isEmpty ? nil : t
    }

    private static func setAuthorizationBearer(on req: inout URLRequest, rawBearer: String?) {
        guard let token = normalizeBearerToken(rawBearer) else { return }
        req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
    }

    private static func setFirebaseIDToken(on req: inout URLRequest, token: String?) {
        guard let t = token?.trimmingCharacters(in: .whitespacesAndNewlines), !t.isEmpty else { return }
        req.setValue(t, forHTTPHeaderField: "X-Firebase-ID-Token")
    }

    /// Hosted API uses `GET /api/sms/inbound` (and `POST /api/sms/send`). Supports `{ messages }`, `{ inbound }`, `{ data }`, or a JSON array.
    private static func decodeMessageRows(from data: Data) throws -> [LogRow] {
        let dec = JSONDecoder()
        if let rows = try? dec.decode([LogRow].self, from: data) {
            return rows
        }
        struct Envelope: Decodable {
            let messages: [LogRow]?
            let inbound: [LogRow]?
            let data: [LogRow]?
        }
        let env = try dec.decode(Envelope.self, from: data)
        if let m = env.messages { return m }
        if let i = env.inbound { return i }
        if let d = env.data { return d }
        return []
    }

    static func sendSms(
        baseURL: String,
        to: String,
        from: String?,
        body: String,
        bearer: String?,
        firebaseIDToken: String?
    ) async throws {
        let trimmed = baseURL.trimmingCharacters(in: .whitespacesAndNewlines).trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        guard let url = URL(string: "\(trimmed)/api/sms/send") else { throw MessagingAPIClientError.badURL }
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        setAuthorizationBearer(on: &req, rawBearer: bearer)
        setFirebaseIDToken(on: &req, token: firebaseIDToken)
        req.httpBody = try JSONEncoder().encode(SendBody(to: to, body: body, from: from))
        let (data, resp) = try await URLSession.shared.data(for: req)
        guard let http = resp as? HTTPURLResponse else { throw MessagingAPIClientError.http(-1, nil) }
        guard (200 ..< 300).contains(http.statusCode) else {
            throw MessagingAPIClientError.http(http.statusCode, parseServerError(data: data))
        }
    }

    static func fetchMessages(baseURL: String, bearer: String?, firebaseIDToken: String?) async throws -> [LogRow] {
        let trimmed = baseURL.trimmingCharacters(in: .whitespacesAndNewlines).trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        guard let url = URL(string: "\(trimmed)/api/sms/inbound") else { throw MessagingAPIClientError.badURL }
        var req = URLRequest(url: url)
        req.httpMethod = "GET"
        setAuthorizationBearer(on: &req, rawBearer: bearer)
        setFirebaseIDToken(on: &req, token: firebaseIDToken)
        let (data, resp) = try await URLSession.shared.data(for: req)
        guard let http = resp as? HTTPURLResponse else { throw MessagingAPIClientError.http(-1, nil) }
        guard (200 ..< 300).contains(http.statusCode) else {
            throw MessagingAPIClientError.http(http.statusCode, parseServerError(data: data))
        }
        do {
            return try decodeMessageRows(from: data)
        } catch {
            throw MessagingAPIClientError.decode
        }
    }
}
