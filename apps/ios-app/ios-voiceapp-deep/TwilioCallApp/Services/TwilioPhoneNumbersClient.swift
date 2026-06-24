//
//  TwilioPhoneNumbersClient.swift
//  TwilioCallApp
//

import Foundation

struct TwilioIncomingNumber: Identifiable, Hashable {
    let id: String
    let phoneNumber: String
    let friendlyName: String?
    let voice: Bool
    let sms: Bool
    let mms: Bool
}

enum TwilioPhoneNumbersClientError: LocalizedError {
    case badURL
    case http(Int, String?)
    case decode

    var errorDescription: String? {
        switch self {
        case .badURL: return "Invalid phone numbers API URL."
        case .http(let c, let d):
            if c == 401 {
                let hint = " In Settings → Messaging API bearer, paste the exact same secret as APP_BEARER_TOKEN on the server (paste the key only—the app adds “Bearer ” for you)."
                if let detail = d?.trimmingCharacters(in: .whitespacesAndNewlines), !detail.isEmpty {
                    return "Unauthorized (401): \(detail).\(hint)"
                }
                return "Unauthorized (401).\(hint)"
            }
            if let d, !d.isEmpty { return "Server error (\(c)): \(d)" }
            return "Server error (\(c))."
        case .decode: return "Could not parse phone numbers response."
        }
    }
}

enum TwilioPhoneNumbersClient {
    private struct CapabilitiesDTO: Decodable {
        let voice: Bool?
        let sms: Bool?
        let SMS: Bool?
        let mms: Bool?
        let MMS: Bool?

        var voiceOn: Bool { voice == true }
        var smsOn: Bool { sms == true || SMS == true }
        var mmsOn: Bool { mms == true || MMS == true }
    }

    private struct RowDTO: Decodable {
        let sid: String
        let phoneNumber: String
        let friendlyName: String?
        let capabilities: CapabilitiesDTO?
    }

    private struct Envelope: Decodable {
        let numbers: [RowDTO]
    }

    private struct ErrorBody: Decodable {
        let error: String?
    }

    private static func parseError(data: Data) -> String? {
        (try? JSONDecoder().decode(ErrorBody.self, from: data))?.error
    }

    private static func normalizeBearer(_ raw: String?) -> String? {
        guard var t = raw?.trimmingCharacters(in: .whitespacesAndNewlines), !t.isEmpty else { return nil }
        if (t.hasPrefix("\"") && t.hasSuffix("\"") && t.count > 1) || (t.hasPrefix("'") && t.hasSuffix("'") && t.count > 1) {
            t = String(t.dropFirst().dropLast()).trimmingCharacters(in: .whitespacesAndNewlines)
        }
        if t.lowercased().hasPrefix("bearer ") {
            t = String(t.dropFirst(7)).trimmingCharacters(in: .whitespacesAndNewlines)
        }
        return t.isEmpty ? nil : t
    }

    static func fetchIncomingPhoneNumbers(
        baseURL: String,
        bearer: String?,
        firebaseIDToken: String?
    ) async throws -> [TwilioIncomingNumber] {
        let trimmed = baseURL.trimmingCharacters(in: .whitespacesAndNewlines).trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        guard let url = URL(string: "\(trimmed)/api/twilio/phone-numbers") else { throw TwilioPhoneNumbersClientError.badURL }
        var req = URLRequest(url: url)
        req.httpMethod = "GET"
        if let token = normalizeBearer(bearer) {
            req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        if let idToken = firebaseIDToken?.trimmingCharacters(in: .whitespacesAndNewlines), !idToken.isEmpty {
            req.setValue(idToken, forHTTPHeaderField: "X-Firebase-ID-Token")
        }
        let (data, resp) = try await URLSession.shared.data(for: req)
        guard let http = resp as? HTTPURLResponse else { throw TwilioPhoneNumbersClientError.http(-1, nil) }
        guard (200 ..< 300).contains(http.statusCode) else {
            throw TwilioPhoneNumbersClientError.http(http.statusCode, parseError(data: data))
        }
        do {
            let rows = try JSONDecoder().decode(Envelope.self, from: data).numbers
            return rows.map { r in
                let c = r.capabilities
                return TwilioIncomingNumber(
                    id: r.sid,
                    phoneNumber: r.phoneNumber,
                    friendlyName: r.friendlyName,
                    voice: c?.voiceOn ?? false,
                    sms: c?.smsOn ?? false,
                    mms: c?.mmsOn ?? false
                )
            }
        } catch {
            throw TwilioPhoneNumbersClientError.decode
        }
    }
}
