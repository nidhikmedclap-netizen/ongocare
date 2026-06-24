//
//  VoiceAudioSession.swift
//  TwilioCallApp
//
//  Twilio Voice requires an active playAndRecord session; without it, calls connect but audio is silent both ways.
//

import AVFoundation
import OSLog

enum VoiceAudioSession {
    private static let log = Logger(subsystem: Bundle.main.bundleIdentifier ?? "TwilioCallApp", category: "VoiceAudio")

    /// Call before `TwilioVoiceSDK.connect` and again from `callDidConnect` if needed.
    static func activateForTwilioCall() {
        let session = AVAudioSession.sharedInstance()
        do {
            try session.setCategory(
                .playAndRecord,
                mode: .voiceChat,
                options: [.allowBluetooth, .allowBluetoothA2DP]
            )
            try session.setActive(true, options: [])
        } catch {
            log.error("AVAudioSession activate failed: \(error.localizedDescription, privacy: .public)")
        }
    }

    static func setSpeaker(_ useSpeaker: Bool) {
        let session = AVAudioSession.sharedInstance()
        do {
            try session.overrideOutputAudioPort(useSpeaker ? .speaker : .none)
        } catch {
            log.error("overrideOutputAudioPort failed: \(error.localizedDescription, privacy: .public)")
        }
    }

    static func deactivateAfterCall() {
        let session = AVAudioSession.sharedInstance()
        do {
            try session.setActive(false, options: [.notifyOthersOnDeactivation])
        } catch {
            log.error("AVAudioSession deactivate failed: \(error.localizedDescription, privacy: .public)")
        }
    }

    /// Incoming-call ringtone — separate from Twilio `playAndRecord` until the user accepts.
    static func activateForIncomingRingtone() {
        let session = AVAudioSession.sharedInstance()
        do {
            try session.setCategory(.playback, mode: .default, options: [.defaultToSpeaker, .duckOthers])
            try session.setActive(true, options: [])
        } catch {
            log.error("AVAudioSession incoming ringtone failed: \(error.localizedDescription, privacy: .public)")
        }
    }

    /// Voicemail / MP3 playback via `AVPlayer` — use instead of `playAndRecord` so audio routes to the speaker after Voice calls.
    static func activateForMediaPlayback() {
        let session = AVAudioSession.sharedInstance()
        do {
            try session.setCategory(.playback, mode: .default, options: [.mixWithOthers])
            try session.setActive(true, options: [])
        } catch {
            log.error("AVAudioSession media playback failed: \(error.localizedDescription, privacy: .public)")
            return
        }
        try? session.overrideOutputAudioPort(.speaker)
    }
}
