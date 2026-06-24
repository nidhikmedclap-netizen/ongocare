//
//  IncomingRingtone.swift
//  TwilioCallApp
//
//  In-app ringtone fallback for demo/simulator paths. Real inbound VoIP uses CallKit (system ring when app is closed).
//

import AudioToolbox
import AVFoundation
import Foundation
import OSLog

enum IncomingRingtone {
    private static let log = Logger(subsystem: Bundle.main.bundleIdentifier ?? "TwilioCallApp", category: "IncomingRingtone")
    private static var player: AVAudioPlayer?
    private static var fallbackTimer: Timer?
    private static var vibrationTimer: Timer?

    /// Start ringing for the given business ringtone name (`Chime`, `Default`, etc.).
    static func start(ringtoneName: String) {
        DispatchQueue.main.async {
            stop()
            VoiceAudioSession.activateForIncomingRingtone()
            if let url = bundleURL(for: ringtoneName) {
                do {
                    let p = try AVAudioPlayer(contentsOf: url)
                    p.numberOfLoops = -1
                    p.volume = 1.0
                    p.prepareToPlay()
                    guard p.play() else {
                        log.warning("AVAudioPlayer.play() returned false for \(url.lastPathComponent, privacy: .public)")
                        startSystemFallback()
                        return
                    }
                    player = p
                    log.debug("Playing incoming ringtone \(url.lastPathComponent, privacy: .public)")
                } catch {
                    log.error("AVAudioPlayer failed: \(error.localizedDescription, privacy: .public)")
                    startSystemFallback()
                }
            } else {
                log.warning("No bundled ringtone for \(ringtoneName, privacy: .public); using system fallback")
                startSystemFallback()
            }
            startVibrationCadence()
        }
    }

    static func stop() {
        DispatchQueue.main.async {
            player?.stop()
            player = nil
            fallbackTimer?.invalidate()
            fallbackTimer = nil
            vibrationTimer?.invalidate()
            vibrationTimer = nil
        }
    }

    // MARK: - Private

    private static func bundleURL(for ringtoneName: String) -> URL? {
        let base: String
        switch ringtoneName.trimmingCharacters(in: .whitespacesAndNewlines).lowercased() {
        case "chime":
            base = "ringtone_chime"
        default:
            base = "ringtone_default"
        }
        for ext in ["caf", "wav", "aiff", "m4a", "mp3"] {
            if let url = Bundle.main.url(forResource: base, withExtension: ext, subdirectory: "Ringtones") {
                return url
            }
            if let url = Bundle.main.url(forResource: base, withExtension: ext) {
                return url
            }
        }
        return nil
    }

    private static func startSystemFallback() {
        playFallbackPulse()
        let t = Timer(timeInterval: 2.4, repeats: true) { _ in
            playFallbackPulse()
        }
        RunLoop.main.add(t, forMode: .common)
        fallbackTimer = t
    }

    private static func playFallbackPulse() {
        AudioServicesPlaySystemSound(1005)
    }

    private static func startVibrationCadence() {
        vibrateOnce()
        let t = Timer(timeInterval: 2.0, repeats: true) { _ in
            vibrateOnce()
        }
        RunLoop.main.add(t, forMode: .common)
        vibrationTimer = t
    }

    private static func vibrateOnce() {
        AudioServicesPlaySystemSound(kSystemSoundID_Vibrate)
    }
}
