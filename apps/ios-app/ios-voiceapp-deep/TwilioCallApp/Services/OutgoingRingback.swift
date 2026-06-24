//
//  OutgoingRingback.swift
//  TwilioCallApp
//
//  VoIP outbound calls do not play carrier ringback in the earpiece; we give light local feedback
//  while Twilio is in the ringing state (until connect / fail / disconnect).
//

import AudioToolbox
import Foundation

enum OutgoingRingback {
    private static var timer: Timer?

    static func start() {
        DispatchQueue.main.async {
            stop()
            playPulse()
            let t = Timer(timeInterval: 2.8, repeats: true) { _ in
                playPulse()
            }
            RunLoop.main.add(t, forMode: .common)
            timer = t
        }
    }

    static func stop() {
        DispatchQueue.main.async {
            timer?.invalidate()
            timer = nil
        }
    }

    private static func playPulse() {
        // System sound ~ “alert” cadence; replace with bundled ring tone if you want true ringback.
        AudioServicesPlaySystemSound(1007)
    }
}
