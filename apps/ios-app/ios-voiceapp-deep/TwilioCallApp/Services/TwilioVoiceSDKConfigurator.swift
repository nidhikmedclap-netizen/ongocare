//
//  TwilioVoiceSDKConfigurator.swift
//  TwilioCallApp
//
//  Twilio requires `TwilioVoiceSDK.edge` to be set before `handleNotification` processes VoIP payloads.
//

import Foundation
import TwilioVoice

enum TwilioVoiceSDKConfigurator {
    /// Call once at process start (before any register / handleNotification).
    static func configureAtLaunch() {
        VoiceCallKitCoordinator.shared.installAtLaunch()
        // Required before `handleNotification` (Twilio docs). `roaming` picks lowest-latency edge when DNS supports RFC 7871.
        TwilioVoiceSDK.edge = "roaming"
        #if DEBUG
        TwilioVoiceSDK.logLevel = .debug
        #else
        TwilioVoiceSDK.logLevel = .info
        #endif
    }
}
