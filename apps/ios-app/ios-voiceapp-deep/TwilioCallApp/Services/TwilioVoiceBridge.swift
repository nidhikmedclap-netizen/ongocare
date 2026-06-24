//
//  TwilioVoiceBridge.swift
//  TwilioCallApp
//

import CallKit
import Foundation
import TwilioVoice
import os

/// Owns the active `TwilioVoice.Call` and forwards delegate events to `AppState` on the main actor.
final class TwilioVoiceBridge: NSObject, CallDelegate {
    weak var owner: AppState?
    private(set) var activeCall: Call?
    /// Set when an incoming VoIP push is handled; cleared on accept, reject, or outbound connect.
    private(set) var pendingCallInvite: CallInvite?

    private let log = os.Logger(subsystem: Bundle.main.bundleIdentifier ?? "TwilioCallApp", category: "TwilioVoice")

    func connectOutgoing(accessToken: String, to: String, from: String, uuid _: UUID) {
        if pendingCallInvite != nil {
            pendingCallInvite?.reject()
            pendingCallInvite = nil
        }
        if let existing = activeCall {
            existing.disconnect()
        }
        activeCall = nil
        OutgoingRingback.stop()
        VoiceCallKitCoordinator.shared.enableAudioForOutbound()
        VoiceAudioSession.activateForTwilioCall()
        let connectOptions = ConnectOptions(accessToken: accessToken) { builder in
            builder.params = [
                "To": to,
                "CallerId": from,
            ]
        }
        log.debug("Connecting outbound To=\(to, privacy: .private) CallerId=\(from, privacy: .private)")
        activeCall = TwilioVoiceSDK.connect(options: connectOptions, delegate: self)
    }

    /// User hung up or UI dismissed; SDK clears `activeCall` in `callDidDisconnect` / failure handlers.
    func disconnectUserInitiated() {
        if activeCall != nil {
            log.debug("disconnectUserInitiated()")
        }
        activeCall?.disconnect()
    }

    /// SDK already ended the call (`callDidDisconnect`); only drop our reference.
    func releaseCallReference() {
        log.debug("releaseCallReference()")
        activeCall = nil
    }

    /// Deprecated name — use `disconnectUserInitiated()` for clarity.
    func disconnect() {
        disconnectUserInitiated()
    }

    func setMuted(_ muted: Bool) {
        activeCall?.isMuted = muted
    }

    /// Accepts the pending Twilio invite if any. Returns false for demo incoming (no SDK invite).
    func acceptPendingIncomingIfAny() -> Bool {
        guard let invite = pendingCallInvite else { return false }
        return acceptInviteForCallKit(invite: invite)
    }

    func acceptInviteForCallKit(invite: CallInvite) -> Bool {
        pendingCallInvite = nil
        let options = AcceptOptions(callInvite: invite) { builder in
            builder.uuid = invite.uuid
        }
        activeCall = invite.accept(options: options, delegate: self)
        return activeCall != nil
    }

    func pendingCallInviteForCallKit(uuid: UUID) -> CallInvite? {
        guard let invite = pendingCallInvite, invite.uuid == uuid else { return nil }
        return invite
    }

    func clearPendingInviteIfMatches(uuid: UUID) {
        if pendingCallInvite?.uuid == uuid {
            pendingCallInvite = nil
        }
    }

    func rejectIncomingInviteUserInitiated() {
        pendingCallInvite?.reject()
        pendingCallInvite = nil
    }

    func setHeld(_ onHold: Bool) {
        activeCall?.isOnHold = onHold
    }

    func sendDigits(_ digits: String) {
        activeCall?.sendDigits(digits)
    }

    func callDidStartRinging(call: Call) {
        log.debug("callDidStartRinging state=\(String(describing: call.state))")
        OutgoingRingback.start()
        Task { @MainActor in
            owner?.applyVoiceConnectionState(.ringing)
        }
    }

    func callDidConnect(call: Call) {
        log.debug("callDidConnect state=\(String(describing: call.state)) sid=\(call.sid ?? "-", privacy: .public)")
        OutgoingRingback.stop()
        VoiceCallKitCoordinator.shared.enableAudioForOutbound()
        Task { @MainActor in
            owner?.applyVoiceConnectionState(.connected, callSid: call.sid)
        }
    }

    func callDidFailToConnect(call: Call, error: Error) {
        OutgoingRingback.stop()
        if let uuid = call.uuid {
            VoiceCallKitCoordinator.shared.reportCallEnded(uuid: uuid, reason: .failed)
        }
        log.error("callDidFailToConnect: \(error.localizedDescription, privacy: .public)")
        Task { @MainActor in
            owner?.handleVoiceConnectFailure(message: VoiceCallErrorFormatting.userMessage(for: error))
        }
    }

    func callDidDisconnect(call: Call, error: Error?) {
        OutgoingRingback.stop()
        VoiceCallKitCoordinator.shared.disableAudio()
        if let error {
            log.error("callDidDisconnect error: \(error.localizedDescription, privacy: .public)")
        } else {
            log.debug("callDidDisconnect (no error — normal hangup) sid=\(call.sid ?? "-", privacy: .public)")
        }
        if let uuid = call.uuid {
            VoiceCallKitCoordinator.shared.reportCallEnded(uuid: uuid, reason: .remoteEnded)
        }
        Task { @MainActor in
            owner?.handleVoiceDisconnect(error: error)
        }
    }

    func callIsReconnecting(call: Call, error: Error) {
        log.warning("callIsReconnecting: \(error.localizedDescription, privacy: .public)")
        Task { @MainActor in
            owner?.applyVoiceConnectionState(.reconnecting)
        }
    }

    func callDidReconnect(call: Call) {
        log.debug("callDidReconnect")
        Task { @MainActor in
            owner?.applyVoiceConnectionState(.connected)
        }
    }
}

// MARK: - Incoming calls (VoIP push)

extension TwilioVoiceBridge: NotificationDelegate {
    func callInviteReceived(callInvite: CallInvite) {
        let fromRaw = callInvite.from ?? "Unknown"
        let toRaw = callInvite.to
        let toLine = callInvite.customParameters?["toLine"]?.trimmingCharacters(in: .whitespacesAndNewlines)
        log.notice(
            "NotificationDelegate.callInviteReceived callSid=\(callInvite.callSid, privacy: .public) from=\(fromRaw, privacy: .public) to=\(toRaw, privacy: .public) toLine=\(toLine ?? "-", privacy: .public)"
        )
        // Drop stale outbound legs so Twilio does not see this client as busy.
        if activeCall != nil {
            log.warning("callInviteReceived: clearing active outbound call so client is not busy")
            activeCall?.disconnect()
            activeCall = nil
        }
        pendingCallInvite = callInvite

        var displayName = fromRaw
        if fromRaw.hasPrefix("client:") {
            displayName = String(fromRaw.dropFirst(7))
        } else {
            displayName = PhoneNumberE164.normalize(fromRaw)
        }

        VoiceCallKitCoordinator.shared.reportIncoming(
            callInvite: callInvite,
            displayName: displayName,
            inviteFrom: fromRaw,
            inviteToLine: toRaw,
            inboundLineE164: toLine
        )
    }

    func cancelledCallInviteReceived(cancelledCallInvite: CancelledCallInvite, error: Error) {
        log.notice(
            "NotificationDelegate.cancelledCallInviteReceived callSid=\(cancelledCallInvite.callSid, privacy: .public) error=\(error.localizedDescription, privacy: .public)"
        )
        if let invite = pendingCallInvite, invite.callSid == cancelledCallInvite.callSid {
            VoiceCallKitCoordinator.shared.reportCallEnded(uuid: invite.uuid, reason: .unanswered)
        }
        VoiceCallKitCoordinator.shared.completePushIfPending()
        Task { @MainActor in
            self.pendingCallInvite = nil
            self.owner?.handleCancelledIncomingInvite(callSid: cancelledCallInvite.callSid)
        }
    }
}
