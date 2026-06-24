//
//  VoiceConfiguration.swift
//  TwilioCallApp
//
//  Resolves the Twilio Voice access-token URL the same way production apps do:
//  a single HTTPS endpoint is baked into Release via xcconfig (VoiceTokenURL in Info.plist).
//  Optional Settings override is for QA only.
//

import Foundation

enum VoiceConfiguration {
    /// Merged into Info.plist from `$(VOICE_TOKEN_BASE_URL)` in Support/Info.plist (see Config/Shared.xcconfig).
    private static let infoPlistKey = "VoiceTokenURL"
    /// Same key as `AppState` Settings override (must stay in sync for early VoIP register before SwiftUI `.task`).
    private static let userDefaultsTokenOverrideKey = "voice_token_url_override"
    /// Same key as `AppState.Keys.voiceIdentity` for persisting server identity when `AppState` is not bound yet.
    static let userDefaultsVoiceIdentityKey = "voice_client_identity"

    static var bundledTokenURL: String {
        guard let raw = Bundle.main.object(forInfoDictionaryKey: infoPlistKey) as? String else {
            return ""
        }
        return raw.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    /// Debug-only token URL so `return ""` is not unreachable on Simulator (see nested `#if` below).
    private static var debugDevTokenURL: String? {
        #if DEBUG
        #if targetEnvironment(simulator)
        return "http://127.0.0.1:3001/token"
        #else
        let raw = ProcessInfo.processInfo.environment["VOICE_TOKEN_URL"]?
            .trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        return raw.isEmpty ? nil : raw
        #endif
        #else
        return nil
        #endif
    }

    /// Effective URL for outbound calls: override (if non-empty), then plist, then dev fallbacks.
    static func effectiveTokenURL(override: String) -> String {
        let o = override.trimmingCharacters(in: .whitespacesAndNewlines)
        if !o.isEmpty { return o }

        let bundled = bundledTokenURL
        if !bundled.isEmpty { return bundled }

        if let dev = debugDevTokenURL { return dev }
        return ""
    }

    /// Token URL before `AppState` is bound (PushKit can fire between process launch and SwiftUI `.task`).
    static func effectiveTokenURLFromStorage() -> String {
        let override = UserDefaults.standard.string(forKey: userDefaultsTokenOverrideKey)?
            .trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        return effectiveTokenURL(override: override)
    }
}
