//
//  VoiceCallErrorFormatting.swift
//  TwilioCallApp
//

import Foundation

enum VoiceCallErrorFormatting {
    static func userMessage(for error: Error) -> String {
        let e = error as NSError
        var parts: [String] = []
        if !e.localizedDescription.isEmpty {
            parts.append(e.localizedDescription)
        }
        if let reason = e.localizedFailureReason, !reason.isEmpty {
            parts.append(reason)
        }
        parts.append("Error code: \(e.code)")
        return parts.joined(separator: "\n")
    }
}
