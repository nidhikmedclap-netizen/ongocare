//
//  AccessTokenClient.swift
//  TwilioCallApp
//

import Foundation

struct VoiceCredentials: Sendable {
    let token: String
    let identity: String
}

enum AccessTokenClientError: LocalizedError {
    case invalidURL
    case emptyResponse
    case httpStatus(Int)
    case noTokenInPayload
    case noIdentityInPayload

    var errorDescription: String? {
        switch self {
        case .invalidURL: return "Voice access token URL is invalid."
        case .emptyResponse: return "Token server returned an empty body."
        case .httpStatus(let c): return "Token server HTTP error (\(c))."
        case .noTokenInPayload: return "Token JSON did not contain a \"token\" string."
        case .noIdentityInPayload: return "Token JSON did not contain an \"identity\" string."
        }
    }
}

enum AccessTokenClient {
    private static func appendApnsQuery(to components: inout URLComponents) {
        var items = components.queryItems ?? []
        items.removeAll { $0.name == "apns" || $0.name == "apns_environment" }
        items.append(URLQueryItem(name: "apns", value: VoiceRegistrationDiagnostics.apnsQueryValueForTokenServer()))
        components.queryItems = items
    }

    /// API host derived from the configured `…/token` URL (same host as `/api/voice-session`).
    static func apiBaseURL(fromTokenURLString raw: String) -> String? {
        let trimmed = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty, var parts = URLComponents(string: trimmed) else { return nil }
        parts.query = nil
        parts.fragment = nil
        var path = parts.path
        if path == "/token" {
            path = ""
        } else if path.hasSuffix("/token") {
            path.removeLast("/token".count)
        }
        parts.path = path
        guard let url = parts.url else { return nil }
        var out = url.absoluteString
        while out.hasSuffix("/") { out.removeLast() }
        return out
    }

    /// Preferred: `GET /api/voice-session` — token and identity are defined only by the server.
    static func fetchVoiceSession(fromTokenURLString tokenURL: String) async throws -> VoiceCredentials {
        let trimmed = tokenURL.trimmingCharacters(in: .whitespacesAndNewlines)
        guard let base = apiBaseURL(fromTokenURLString: trimmed),
              var components = URLComponents(string: "\(base)/api/voice-session") else {
            throw AccessTokenClientError.invalidURL
        }
        appendApnsQuery(to: &components)
        guard let url = components.url else { throw AccessTokenClientError.invalidURL }
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.timeoutInterval = 20
        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse else { throw AccessTokenClientError.emptyResponse }
        guard (200 ..< 300).contains(http.statusCode) else {
            throw AccessTokenClientError.httpStatus(http.statusCode)
        }
        return try parseCredentialsPayload(data)
    }

    /// `GET /token` without `identity` query — server chooses identity (env or default). Parses `{ token, identity }`.
    static func fetchTokenServerChosenIdentity(fromTokenURLString tokenURL: String) async throws -> VoiceCredentials {
        let trimmed = tokenURL.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty, var components = URLComponents(string: trimmed) else {
            throw AccessTokenClientError.invalidURL
        }
        var items = components.queryItems ?? []
        items.removeAll { $0.name == "identity" }
        components.queryItems = items.isEmpty ? nil : items
        appendApnsQuery(to: &components)
        guard let url = components.url else { throw AccessTokenClientError.invalidURL }

        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.timeoutInterval = 20

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse else { throw AccessTokenClientError.emptyResponse }
        guard (200 ..< 300).contains(http.statusCode) else {
            throw AccessTokenClientError.httpStatus(http.statusCode)
        }
        guard !data.isEmpty else { throw AccessTokenClientError.emptyResponse }
        return try parseCredentialsPayload(data)
    }

    /// Tries `/api/voice-session`, then `/token` without client identity (older backends).
    static func fetchVoiceCredentials(fromTokenURLString tokenURL: String) async throws -> VoiceCredentials {
        do {
            return try await fetchVoiceSession(fromTokenURLString: tokenURL)
        } catch {
            return try await fetchTokenServerChosenIdentity(fromTokenURLString: tokenURL)
        }
    }

    private static func parseCredentialsPayload(_ data: Data) throws -> VoiceCredentials {
        if let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
           let token = obj["token"] as? String,
           !token.isEmpty {
            let idRaw = obj["identity"] as? String
            let identity = sanitizeIdentity(idRaw ?? "")
            return VoiceCredentials(token: token, identity: identity)
        }
        if let raw = String(data: data, encoding: .utf8)?.trimmingCharacters(in: .whitespacesAndNewlines),
           raw.hasPrefix("eyJ") {
            throw AccessTokenClientError.noIdentityInPayload
        }
        throw AccessTokenClientError.noTokenInPayload
    }

    /// Twilio Voice identities must be alphanumeric + underscore, max 121 chars.
    private static func sanitizeIdentity(_ raw: String) -> String {
        let trimmed = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        if trimmed.isEmpty { return "voice_client" }
        let allowed = trimmed.filter { $0.isLetter || $0.isNumber || $0 == "_" }
        let base = allowed.isEmpty ? "voice_client" : String(allowed)
        return String(base.prefix(121))
    }
}
