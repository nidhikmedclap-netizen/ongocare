//
//  VoicePushCoordinator.swift
//  TwilioCallApp
//
//  VoIP push registration so Twilio can deliver incoming call invites to this client identity.
//

import Foundation
import os
import PushKit
import TwilioVoice

final class VoicePushCoordinator: NSObject, PKPushRegistryDelegate {
    static let shared = VoicePushCoordinator()

    /// `os.Logger` — TwilioVoice also exposes a `Logger` type; avoid ambiguity with `OSLog.Logger`.
    private let log = os.Logger(subsystem: Bundle.main.bundleIdentifier ?? "TwilioCallApp", category: "VoicePush")
    private var registry: PKPushRegistry?
    private weak var appState: AppState?
    private var lastVoipDeviceToken: Data?

    private override init() {
        super.init()
    }

    /// Called from `AppState.init` so `appState` is available before SwiftUI `.task` (PushKit can deliver a token immediately).
    func bindAppState(_ state: AppState) {
        appState = state
        log.debug("VoicePush: bound AppState for Twilio registration + incoming bridge")
    }

    /// Called from `AppDelegate` so PKPushRegistry exists at launch (Twilio / Apple requirement).
    func ensurePushRegistryAtLaunch() {
        installRegistryIfNeeded()
    }

    func startIfNeeded(appState: AppState) {
        bindAppState(appState)
        installRegistryIfNeeded()
    }

    private func installRegistryIfNeeded() {
        guard registry == nil else {
            log.debug("installRegistryIfNeeded: already installed")
            return
        }
        let r = PKPushRegistry(queue: .main)
        r.delegate = self
        r.desiredPushTypes = [.voIP]
        registry = r
        log.notice("PushKit: PKPushRegistry started (main queue), desiredPushTypes=voIP")
    }

    private func resolvedTokenURL() -> String {
        if let appState {
            let u = appState.effectiveVoiceAccessTokenURL.trimmingCharacters(in: .whitespacesAndNewlines)
            if !u.isEmpty { return u }
        }
        return VoiceConfiguration.effectiveTokenURLFromStorage().trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private func applyServerIdentity(_ identity: String) {
        if let appState {
            appState.voiceClientIdentity = identity
        } else {
            UserDefaults.standard.set(identity, forKey: VoiceConfiguration.userDefaultsVoiceIdentityKey)
            log.notice("Voice identity stored in UserDefaults before AppState bound: \(identity, privacy: .public)")
        }
    }

    /// Re-register with a fresh access token (e.g. after returning to foreground) so Twilio keeps the VoIP binding valid.
    func refreshRegistrationIfPossible() {
        registerWithServerIfPossible(reason: "refresh")
    }

    /// Settings → Re-register VoIP; also used after foreground refresh.
    func reregisterNow() {
        registerWithServerIfPossible(reason: "manual")
    }

    private func registerWithServerIfPossible(reason: String) {
        guard let tokenData = lastVoipDeviceToken else {
            log.debug("\(reason): no cached VoIP token yet")
            Task { @MainActor in
                VoiceRegistrationDiagnostics.shared.lastRegisterStatus = "No VoIP token yet — reinstall app on device"
                VoiceRegistrationDiagnostics.shared.lastRegisterError = nil
            }
            return
        }
        let url = resolvedTokenURL()
        guard !url.isEmpty else {
            Task { @MainActor in
                VoiceRegistrationDiagnostics.shared.lastRegisterStatus = "Voice token URL not configured"
            }
            return
        }
        Task { @MainActor in
            Self.updateDiagnosticsToken(tokenData)
            VoiceRegistrationDiagnostics.shared.lastRegisterStatus = "Registering (\(reason))…"
            VoiceRegistrationDiagnostics.shared.lastRegisterError = nil
            do {
                let creds = try await AccessTokenClient.fetchVoiceCredentials(fromTokenURLString: url)
                self.applyServerIdentity(creds.identity)
                Self.updateDiagnosticsJWT(creds.token, identity: creds.identity)
                log.notice("Twilio register (\(reason, privacy: .public)); identity=\(creds.identity, privacy: .public)")
                TwilioVoiceSDK.register(accessToken: creds.token, deviceToken: tokenData) { error in
                    Task { @MainActor in
                        if let error {
                            VoiceRegistrationDiagnostics.shared.lastRegisterStatus = "Register failed"
                            VoiceRegistrationDiagnostics.shared.lastRegisterError = error.localizedDescription
                            self.log.error("TwilioVoiceSDK.register (\(reason, privacy: .public)) failed: \(error.localizedDescription, privacy: .public)")
                        } else {
                            VoiceRegistrationDiagnostics.shared.lastRegisterStatus = "Registered OK"
                            VoiceRegistrationDiagnostics.shared.lastRegisterError = nil
                            self.log.notice("TwilioVoiceSDK.register (\(reason, privacy: .public)) succeeded")
                        }
                    }
                }
            } catch {
                VoiceRegistrationDiagnostics.shared.lastRegisterStatus = "Token fetch failed"
                VoiceRegistrationDiagnostics.shared.lastRegisterError = error.localizedDescription
                self.log.error("Token fetch for register (\(reason, privacy: .public)) failed: \(error.localizedDescription, privacy: .public)")
            }
        }
    }

    @MainActor
    private static func updateDiagnosticsToken(_ tokenData: Data) {
        let d = VoiceRegistrationDiagnostics.shared
        d.apnsEnvironmentLabel = VoiceRegistrationDiagnostics.currentAPNsEnvironmentLabel()
        d.voipTokenLength = tokenData.count
        d.voipTokenHexPrefix = String(hexString(tokenData).prefix(20))
    }

    @MainActor
    private static func updateDiagnosticsJWT(_ jwt: String, identity: String) {
        let d = VoiceRegistrationDiagnostics.shared
        d.voiceIdentity = identity
        d.jwtIncludesPushCredential = VoiceRegistrationDiagnostics.jwtIncludesPushCredentialSid(jwt)
    }

    private static func hexString(_ data: Data) -> String {
        data.map { String(format: "%02hhx", $0) }.joined()
    }

    func unregisterIfPossible() {
        guard let tokenData = lastVoipDeviceToken else { return }
        let url = resolvedTokenURL()
        guard !url.isEmpty else { return }
        Task { @MainActor in
            do {
                let creds = try await AccessTokenClient.fetchVoiceCredentials(fromTokenURLString: url)
                TwilioVoiceSDK.unregister(accessToken: creds.token, deviceToken: tokenData) { _ in }
            } catch {
                self.log.error("unregister token fetch failed: \(error.localizedDescription, privacy: .public)")
            }
        }
    }

    #if DEBUG
    /// Twilio inbound needs `push_credential_sid` in the Voice grant — if missing, VoIP never reaches the device.
    private static func logIfJWTMissingPushCredential(_ jwt: String, log: os.Logger) {
        let parts = jwt.split(separator: ".")
        guard parts.count >= 2 else { return }
        var b64 = String(parts[1])
            .replacingOccurrences(of: "-", with: "+")
            .replacingOccurrences(of: "_", with: "/")
        while b64.count % 4 != 0 { b64.append("=") }
        guard let data = Data(base64Encoded: b64),
              let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let grants = obj["grants"] as? [String: Any],
              let voice = grants["voice"] as? [String: Any] else {
            return
        }
        if voice["push_credential_sid"] == nil {
            log.warning("JWT Voice grant has no push_credential_sid — set TWILIO_VOICE_PUSH_CREDENTIAL_SID on token server or inbound will not ring (Twilio 52004).")
        }
    }
    #endif

    func pushRegistry(_ registry: PKPushRegistry, didUpdate pushCredentials: PKPushCredentials, for type: PKPushType) {
        guard type == .voIP else { return }
        let tokenData = pushCredentials.token
        lastVoipDeviceToken = tokenData
        let hex = Self.hexString(tokenData)
        log.notice("PushKit: VoIP device token updated (len=\(tokenData.count) hex.prefix=\(hex.prefix(24), privacy: .public)…)")
        Task { @MainActor in
            Self.updateDiagnosticsToken(tokenData)
            VoiceRegistrationDiagnostics.shared.lastRegisterStatus = "Registering (new VoIP token)…"
            let url = self.resolvedTokenURL()
            guard !url.isEmpty else {
                VoiceRegistrationDiagnostics.shared.lastRegisterStatus = "Voice token URL not configured"
                self.log.error("No Voice token URL; cannot TwilioVoiceSDK.register (Info.plist VoiceTokenURL / Settings override)")
                return
            }
            if self.appState == nil {
                self.log.warning("VoIP token arrived before AppState bind — using VoiceConfiguration.effectiveTokenURLFromStorage()")
            }
            self.log.notice("Fetching Voice credentials for register; tokenURLHost=\(URL(string: url)?.host ?? url, privacy: .public)")
            do {
                let creds = try await AccessTokenClient.fetchVoiceCredentials(fromTokenURLString: url)
                self.applyServerIdentity(creds.identity)
                Self.updateDiagnosticsJWT(creds.token, identity: creds.identity)
                #if DEBUG
                Self.logIfJWTMissingPushCredential(creds.token, log: self.log)
                #endif
                self.log.notice("Voice JWT identity from server=\(creds.identity, privacy: .public) (must match <Dial><Client> on Twilio)")
                TwilioVoiceSDK.register(accessToken: creds.token, deviceToken: tokenData) { error in
                    Task { @MainActor in
                        if let error {
                            VoiceRegistrationDiagnostics.shared.lastRegisterStatus = "Register failed"
                            VoiceRegistrationDiagnostics.shared.lastRegisterError = error.localizedDescription
                            self.log.error("TwilioVoiceSDK.register failed: \(error.localizedDescription, privacy: .public)")
                        } else {
                            VoiceRegistrationDiagnostics.shared.lastRegisterStatus = "Registered OK"
                            VoiceRegistrationDiagnostics.shared.lastRegisterError = nil
                            self.log.notice("TwilioVoiceSDK.register succeeded for VoIP token")
                        }
                    }
                }
            } catch {
                VoiceRegistrationDiagnostics.shared.lastRegisterStatus = "Token fetch failed"
                VoiceRegistrationDiagnostics.shared.lastRegisterError = error.localizedDescription
                self.log.error("Token fetch for push register failed: \(error.localizedDescription, privacy: .public)")
            }
        }
    }

    func pushRegistry(_ registry: PKPushRegistry, didInvalidatePushTokenFor type: PKPushType) {
        guard type == .voIP else { return }
        log.notice("PushKit: VoIP token invalidated")
        let tokenData = lastVoipDeviceToken
        lastVoipDeviceToken = nil
        guard let tokenData else { return }
        Task { @MainActor in
            let url = self.resolvedTokenURL()
            guard !url.isEmpty else { return }
            do {
                let creds = try await AccessTokenClient.fetchVoiceCredentials(fromTokenURLString: url)
                self.applyServerIdentity(creds.identity)
                TwilioVoiceSDK.unregister(accessToken: creds.token, deviceToken: tokenData) { _ in }
            } catch {
                self.log.error("unregister token fetch failed: \(error.localizedDescription, privacy: .public)")
            }
        }
    }

    func pushRegistry(
        _ registry: PKPushRegistry,
        didReceiveIncomingPushWith payload: PKPushPayload,
        for type: PKPushType,
        completion: @escaping () -> Void
    ) {
        guard type == .voIP else {
            completion()
            return
        }
        let pushKeys = payload.dictionaryPayload.keys.map { String(describing: $0) }.sorted().joined(separator: ",")
        log.notice("PushKit: didReceiveIncomingPush (VoIP) keys=\(pushKeys, privacy: .public)")
        Task { @MainActor in
            let d = VoiceRegistrationDiagnostics.shared
            d.lastVoipPushAt = Date()
            d.lastVoipPushSummary = "keys: \(pushKeys)"
        }
        guard let appState else {
            log.error("didReceiveIncomingPush: appState nil — cannot route to TwilioVoiceBridge (bind AppState earlier)")
            completion()
            return
        }
        VoiceCallKitCoordinator.shared.bind(appState: appState, voiceBridge: appState.voiceBridge)
        VoiceCallKitCoordinator.shared.setPushCompletion(completion)

        let bridge = appState.voiceBridge
        let handled = TwilioVoiceSDK.handleNotification(
            payload: payload.dictionaryPayload,
            delegate: bridge,
            delegateQueue: .main,
            callMessageDelegate: nil
        )
        if !handled {
            log.error("TwilioVoiceSDK.handleNotification returned false — check TwilioVoiceSDK.edge, JWT, payload")
            completion()
        } else {
            log.notice("TwilioVoiceSDK.handleNotification returned true — awaiting CallKit report")
        }
    }
}
