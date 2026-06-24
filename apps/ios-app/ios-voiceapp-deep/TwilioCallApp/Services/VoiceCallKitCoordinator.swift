//
//  VoiceCallKitCoordinator.swift
//  TwilioCallApp
//
//  Reports incoming VoIP calls to CallKit so iOS rings with the system ringtone when the app
//  is backgrounded or terminated. Twilio media uses DefaultAudioDevice toggled from CXProviderDelegate.
//

import AVFoundation
import CallKit
import Foundation
import OSLog
import TwilioVoice

final class VoiceCallKitCoordinator: NSObject {
    static let shared = VoiceCallKitCoordinator()

    private let log = Logger(subsystem: Bundle.main.bundleIdentifier ?? "TwilioCallApp", category: "CallKit")
    private let callController = CXCallController()
    private let audioDevice = DefaultAudioDevice()

    private var provider: CXProvider?
    private var pendingInvites: [UUID: CallInvite] = [:]
    private var pushCompletion: (() -> Void)?

    weak var appState: AppState?
    weak var voiceBridge: TwilioVoiceBridge?

    private override init() {
        super.init()
    }

    /// Call once at launch before any VoIP push is handled.
    func installAtLaunch() {
        let config = CXProviderConfiguration(localizedName: "Ongo Voice")
        config.maximumCallGroups = 1
        config.maximumCallsPerCallGroup = 1
        config.supportsVideo = false
        config.includesCallsInRecents = true

        let provider = CXProvider(configuration: config)
        provider.setDelegate(self, queue: nil)
        self.provider = provider

        TwilioVoiceSDK.audioDevice = audioDevice
        audioDevice.isEnabled = false
        log.notice("CallKit CXProvider installed; Twilio DefaultAudioDevice bound")
    }

    func bind(appState: AppState, voiceBridge: TwilioVoiceBridge) {
        self.appState = appState
        self.voiceBridge = voiceBridge
    }

    /// PushKit completion must run after `reportNewIncomingCall` finishes (or fails).
    func setPushCompletion(_ completion: @escaping () -> Void) {
        pushCompletion = completion
    }

    private func finishPushHandling() {
        let completion = pushCompletion
        pushCompletion = nil
        completion?()
    }

    /// When the VoIP payload is a cancel (no new invite), still complete the PushKit handler.
    func completePushIfPending() {
        finishPushHandling()
    }

    /// Report an incoming Twilio invite to the system (lock-screen / banner UI + ringtone).
    func reportIncoming(
        callInvite: CallInvite,
        displayName: String,
        inviteFrom: String,
        inviteToLine: String,
        inboundLineE164: String?
    ) {
        guard let provider else {
            log.error("reportIncoming: CXProvider not installed")
            finishPushHandling()
            presentInAppIncoming(
                inviteFrom: inviteFrom,
                inviteToLine: inviteToLine,
                inboundLineE164: inboundLineE164,
                callSid: callInvite.callSid,
                callKitUUID: callInvite.uuid
            )
            return
        }

        pendingInvites[callInvite.uuid] = callInvite
        presentInAppIncoming(
            inviteFrom: inviteFrom,
            inviteToLine: inviteToLine,
            inboundLineE164: inboundLineE164,
            callSid: callInvite.callSid,
            callKitUUID: callInvite.uuid
        )

        let fromRaw = (callInvite.from ?? "Unknown")
            .replacingOccurrences(of: "client:", with: "")
        let handleValue = displayName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
            ? fromRaw
            : displayName

        let update = CXCallUpdate()
        update.remoteHandle = CXHandle(type: .phoneNumber, value: fromRaw)
        update.localizedCallerName = handleValue
        update.hasVideo = false
        update.supportsDTMF = true
        update.supportsHolding = true
        update.supportsGrouping = false
        update.supportsUngrouping = false

        provider.reportNewIncomingCall(with: callInvite.uuid, update: update) { [weak self] error in
            if let error {
                self?.log.error("reportNewIncomingCall failed: \(error.localizedDescription, privacy: .public)")
                self?.pendingInvites.removeValue(forKey: callInvite.uuid)
            } else {
                self?.log.notice("reportNewIncomingCall succeeded uuid=\(callInvite.uuid.uuidString, privacy: .public)")
            }
            self?.finishPushHandling()
        }
    }

    func requestAnswer(uuid: UUID) {
        let action = CXAnswerCallAction(call: uuid)
        callController.request(CXTransaction(action: action)) { [weak self] error in
            if let error {
                self?.log.error("CXAnswerCallAction failed: \(error.localizedDescription, privacy: .public)")
            }
        }
    }

    func requestEnd(uuid: UUID) {
        let action = CXEndCallAction(call: uuid)
        callController.request(CXTransaction(action: action)) { [weak self] error in
            if let error {
                self?.log.error("CXEndCallAction failed: \(error.localizedDescription, privacy: .public)")
            }
        }
    }

    func reportCallEnded(uuid: UUID, reason: CXCallEndedReason) {
        provider?.reportCall(with: uuid, endedAt: Date(), reason: reason)
        pendingInvites.removeValue(forKey: uuid)
    }

    /// Outbound calls still use manual session setup until we route outbound through CallKit start actions.
    func enableAudioForOutbound() {
        audioDevice.isEnabled = true
    }

    func disableAudio() {
        audioDevice.isEnabled = false
    }

    private func presentInAppIncoming(
        inviteFrom: String,
        inviteToLine: String,
        inboundLineE164: String?,
        callSid: String,
        callKitUUID: UUID
    ) {
        Task { @MainActor in
            appState?.presentIncomingVoiceCall(
                inviteFrom: inviteFrom,
                inviteToLine: inviteToLine,
                inboundLineE164: inboundLineE164,
                twilioCallSid: callSid,
                callKitUUID: callKitUUID
            )
        }
    }

    private func acceptInvite(uuid: UUID) {
        guard let invite = pendingInvites.removeValue(forKey: uuid) ?? voiceBridge?.pendingCallInviteForCallKit(uuid: uuid) else {
            log.error("acceptInvite: no CallInvite for uuid \(uuid.uuidString, privacy: .public)")
            return
        }
        voiceBridge?.acceptInviteForCallKit(invite: invite)
    }

    private func rejectInvite(uuid: UUID) {
        if let invite = pendingInvites.removeValue(forKey: uuid) {
            invite.reject()
        } else if let invite = voiceBridge?.pendingCallInviteForCallKit(uuid: uuid) {
            invite.reject()
        }
        voiceBridge?.clearPendingInviteIfMatches(uuid: uuid)
        Task { @MainActor in
            appState?.handleCallKitEnd(uuid: uuid, answered: false)
        }
    }
}

// MARK: - CXProviderDelegate

extension VoiceCallKitCoordinator: CXProviderDelegate {
    func providerDidReset(_ provider: CXProvider) {
        log.notice("providerDidReset")
        audioDevice.isEnabled = false
        pendingInvites.removeAll()
    }

    func providerDidBegin(_ provider: CXProvider) {
        log.debug("providerDidBegin")
    }

    func provider(_ provider: CXProvider, didActivate audioSession: AVAudioSession) {
        log.debug("provider didActivate audioSession")
        audioDevice.isEnabled = true
    }

    func provider(_ provider: CXProvider, didDeactivate audioSession: AVAudioSession) {
        log.debug("provider didDeactivate audioSession")
        audioDevice.isEnabled = false
    }

    func provider(_ provider: CXProvider, timedOutPerforming action: CXAction) {
        log.warning("provider timedOutPerforming \(String(describing: type(of: action)), privacy: .public)")
    }

    func provider(_ provider: CXProvider, perform action: CXAnswerCallAction) {
        log.notice("CXAnswerCallAction uuid=\(action.callUUID.uuidString, privacy: .public)")
        Task { @MainActor in
            appState?.handleCallKitAnswer(uuid: action.callUUID)
        }
        acceptInvite(uuid: action.callUUID)
        action.fulfill()
    }

    func provider(_ provider: CXProvider, perform action: CXEndCallAction) {
        log.notice("CXEndCallAction uuid=\(action.callUUID.uuidString, privacy: .public)")
        if pendingInvites[action.callUUID] != nil {
            rejectInvite(uuid: action.callUUID)
            reportCallEnded(uuid: action.callUUID, reason: .declinedElsewhere)
        } else {
            voiceBridge?.disconnectUserInitiated()
            reportCallEnded(uuid: action.callUUID, reason: .remoteEnded)
        }
        action.fulfill()
    }

    func provider(_ provider: CXProvider, perform action: CXSetMutedCallAction) {
        voiceBridge?.setMuted(action.isMuted)
        action.fulfill()
    }

    func provider(_ provider: CXProvider, perform action: CXSetHeldCallAction) {
        voiceBridge?.setHeld(action.isOnHold)
        if !action.isOnHold {
            audioDevice.isEnabled = true
        }
        action.fulfill()
    }

    func provider(_ provider: CXProvider, perform action: CXStartCallAction) {
        action.fulfill()
    }

    func provider(_ provider: CXProvider, perform action: CXPlayDTMFCallAction) {
        voiceBridge?.sendDigits(action.digits)
        action.fulfill()
    }
}
