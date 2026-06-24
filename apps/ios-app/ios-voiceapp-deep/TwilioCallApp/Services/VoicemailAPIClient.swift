//
//  VoicemailAPIClient.swift
//  TwilioCallApp
//

import Foundation

enum VoicemailAPIClientError: LocalizedError {
    case badURL
    case http(Int, String?)
    case decode

    var errorDescription: String? {
        switch self {
        case .badURL: return "Invalid voicemail API URL."
        case .http(let c, let detail):
            if let d = detail, !d.isEmpty { return "Voicemail server error (\(c)): \(d)" }
            return "Voicemail server error (\(c))."
        case .decode: return "Could not parse voicemails response."
        }
    }
}

struct VoicemailItem: Identifiable, Hashable {
    let id: String
    let recordingSid: String
    let callSid: String
    let from: String
    let to: String
    let createdAt: Date
    let durationSeconds: Int?
    let transcription: String
    let transcriptionStatus: String
    /// Twilio-style `source` when the API lists account recordings (e.g. `RecordVerb`, `Trunking`).
    let recordingSource: String?

    var hasTranscription: Bool {
        !transcription.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }

    var displayCaller: String {
        let f = from.trimmingCharacters(in: .whitespacesAndNewlines)
        if !f.isEmpty { return f }
        let s = recordingSource?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        if !s.isEmpty { return s }
        return "Recording"
    }

    /// Short label for Twilio `source` (e.g. RecordVerb) in list UI.
    var recordingKindCaption: String? {
        let s = recordingSource?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        guard !s.isEmpty else { return nil }
        switch s {
        case "RecordVerb", "Recording":
            return "Voicemail / dial-in"
        case "StartCallRecordingApi", "TwilioRecording":
            return "Call recording"
        case "Trunking":
            return "Trunk recording"
        case "Conference":
            return "Conference recording"
        case "OutboundAPI":
            return "Outbound API"
        case "DialVerb":
            return "Dial recording"
        default:
            return s.replacingOccurrences(
                of: "([a-z])([A-Z])",
                with: "$1 $2",
                options: .regularExpression
            )
        }
    }
}

enum VoicemailAPIClient {
    /// Only list entries this recent (rolling window from the device clock).
    private static let listWindowDays = 30

    private struct Envelope: Decodable {
        let voicemails: [Row]?
    }

    /// Supports our `token-server` shape (`recordingSid`, `createdAt`, …) and hosted Twilio-recording listings (`sid`, `dateCreated`, `durationSec`, `status`, `source`).
    private struct Row: Decodable {
        let recordingSid: String?
        let sid: String?
        let callSid: String?
        let from: String?
        let to: String?
        let createdAt: String?
        let dateCreated: String?
        let durationSeconds: Int?
        let durationSec: Int?
        let transcription: String?
        let transcriptionStatus: String?
        let status: String?
        let source: String?

        func toVoicemailItem(parseDate: (String) -> Date) -> VoicemailItem? {
            let rs = (recordingSid ?? sid)?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
            guard !rs.isEmpty else { return nil }
            let dateStr = (createdAt ?? dateCreated)?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
            let rawDur = durationSeconds ?? durationSec
            let dur: Int? = {
                guard let rawDur else { return nil }
                return rawDur >= 0 ? rawDur : nil
            }()
            let tStat = (transcriptionStatus ?? status ?? "")
                .trimmingCharacters(in: .whitespacesAndNewlines)
            return VoicemailItem(
                id: rs,
                recordingSid: rs,
                callSid: (callSid ?? "").trimmingCharacters(in: .whitespacesAndNewlines),
                from: (from ?? "").trimmingCharacters(in: .whitespacesAndNewlines),
                to: (to ?? "").trimmingCharacters(in: .whitespacesAndNewlines),
                createdAt: dateStr.isEmpty ? Date() : parseDate(dateStr),
                durationSeconds: dur,
                transcription: (transcription ?? "").trimmingCharacters(in: .whitespacesAndNewlines),
                transcriptionStatus: tStat,
                recordingSource: {
                    let x = source?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
                    return x.isEmpty ? nil : x
                }()
            )
        }
    }

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

    private static func parseDate(_ s: String) -> Date {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let d = f.date(from: s) { return d }
        f.formatOptions = [.withInternetDateTime]
        return f.date(from: s) ?? Date()
    }

    static func fetchVoicemails(baseURL: String, bearer: String?, firebaseIDToken: String?) async throws -> [VoicemailItem] {
        let trimmed = baseURL.trimmingCharacters(in: .whitespacesAndNewlines).trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        guard let url = URL(string: "\(trimmed)/api/voicemails") else { throw VoicemailAPIClientError.badURL }
        var req = URLRequest(url: url)
        req.httpMethod = "GET"
        setAuthorizationBearer(on: &req, rawBearer: bearer)
        setFirebaseIDToken(on: &req, token: firebaseIDToken)
        let (data, resp) = try await URLSession.shared.data(for: req)
        guard let http = resp as? HTTPURLResponse else { throw VoicemailAPIClientError.http(-1, nil) }
        if http.statusCode == 404 || http.statusCode == 405 {
            // Hosted server not deployed with voicemail routes yet — show empty list, not an error sheet.
            return []
        }
        guard (200 ..< 300).contains(http.statusCode) else {
            let raw = String(data: data, encoding: .utf8) ?? ""
            let msg = raw.contains("<!DOCTYPE") || raw.contains("<html") ? "Unexpected HTML response (check API path and deploy)." : raw
            throw VoicemailAPIClientError.http(http.statusCode, msg.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? nil : msg)
        }
        let dec = JSONDecoder()
        let rows: [Row]
        do {
            rows = try dec.decode(Envelope.self, from: data).voicemails ?? []
        } catch {
            throw VoicemailAPIClientError.decode
        }
        let items = rows.compactMap { $0.toVoicemailItem(parseDate: parseDate) }
        let sorted = items.sorted { $0.createdAt > $1.createdAt }
        let cutoff = Calendar.current.date(byAdding: .day, value: -Self.listWindowDays, to: Date()) ?? .distantPast
        return sorted.filter { $0.createdAt >= cutoff }
    }

    /// MP3 URL (`GET /api/voicemails/:recordingSid/media`); send `Authorization: Bearer` when `APP_BEARER_TOKEN` is set server-side.
    static func audioStreamURL(baseURL: String, recordingSid: String) -> URL? {
        let trimmed = baseURL.trimmingCharacters(in: .whitespacesAndNewlines).trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        let enc = recordingSid.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? recordingSid
        return URL(string: "\(trimmed)/api/voicemails/\(enc)/media")
    }
}
