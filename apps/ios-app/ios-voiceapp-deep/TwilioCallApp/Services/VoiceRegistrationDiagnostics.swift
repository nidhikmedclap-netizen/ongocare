//
//  VoiceRegistrationDiagnostics.swift
//  TwilioCallApp
//
//  On-screen VoIP registration status — Twilio error 52134 (Invalid APNs device token) means
//  the server Push Credential does not match this build's APNs environment (sandbox vs production).
//

import Foundation
import Observation

@Observable
final class VoiceRegistrationDiagnostics {
    static let shared = VoiceRegistrationDiagnostics()

    /// development = Xcode debug install (sandbox APNs). production = TestFlight/App Store archive.
    var apnsEnvironmentLabel: String = VoiceRegistrationDiagnostics.currentAPNsEnvironmentLabel()
    var voipTokenLength: Int = 0
    var voipTokenHexPrefix: String = ""
    var voiceIdentity: String = ""
    var jwtIncludesPushCredential: Bool = false
    var lastRegisterStatus: String = "Waiting for VoIP token…"
    var lastRegisterError: String?
    var lastVoipPushAt: Date?
    var lastVoipPushSummary: String?

    static func currentAPNsEnvironmentLabel() -> String {
        #if DEBUG
        return "development (sandbox)"
        #else
        return "production"
        #endif
    }

    /// Sent to `GET /api/voice-session?apns=…` so the server picks sandbox vs production push credential.
    static func apnsQueryValueForTokenServer() -> String {
        #if DEBUG
        return "sandbox"
        #else
        return "production"
        #endif
    }

    static func jwtIncludesPushCredentialSid(_ jwt: String) -> Bool {
        let parts = jwt.split(separator: ".")
        guard parts.count >= 2 else { return false }
        var b64 = String(parts[1])
            .replacingOccurrences(of: "-", with: "+")
            .replacingOccurrences(of: "_", with: "/")
        while b64.count % 4 != 0 { b64.append("=") }
        guard let data = Data(base64Encoded: b64),
              let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let grants = obj["grants"] as? [String: Any],
              let voice = grants["voice"] as? [String: Any],
              let sid = voice["push_credential_sid"] as? String
        else { return false }
        return !sid.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }

    var twilio52134Hint: String {
        """
        Twilio error 52134 = Invalid APNs device token.

        This build uses \(apnsEnvironmentLabel) APNs. The server must return a matching push credential:
        • Xcode Debug → TWILIO_VOICE_PUSH_CREDENTIAL_SID_SANDBOX (Twilio Sandbox VoIP)
        • TestFlight/Release → TWILIO_VOICE_PUSH_CREDENTIAL_SID_PRODUCTION (Twilio Production VoIP)

        One shared CR… in .env breaks the other install type. Redeploy server after setting both, then Re-register VoIP.
        """
    }
}
