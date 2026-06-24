//
//  Business+Twilio.swift
//  TwilioCallApp
//

import CryptoKit
import Foundation

extension Business {
    /// Builds one `Business` per Twilio incoming number. IDs are stable per Twilio PN SID so the same number keeps the same UUID across app launches.
    /// Stable row when the user only set “Twilio SMS number” in Settings and full directory sync has not succeeded yet.
    /// Incoming PSTN → `<Dial><Client>voice_client</Client>`: Twilio reports `to` as the **client identity**, not E.164, so no row in `businesses` may match. Still show incoming UI.
    static func voiceInboundPlaceholder(clientIdentity: String) -> Business {
        let trimmed = clientIdentity.trimmingCharacters(in: .whitespacesAndNewlines)
        let sid = "twilio-voice-client:\(trimmed)"
        let initialsRaw = trimmed.filter { $0.isLetter || $0.isNumber }.prefix(2)
        let initials = initialsRaw.isEmpty ? "VC" : String(initialsRaw).uppercased()
        return Business(
            id: stableBusinessUUID(twilioSid: sid),
            name: "Voice line",
            twilioNumber: trimmed,
            initials: initials,
            tint: .purple,
            greetingPrompt: "",
            businessHours: "Twilio Voice · \(trimmed)",
            isActive: true,
            todayCallCount: 0,
            todayMessageCount: 0
        )
    }

    static func syntheticFromMessagingLineE164(_ raw: String) -> Business? {
        let normalized = PhoneNumberE164.normalize(raw.trimmingCharacters(in: .whitespacesAndNewlines))
        guard normalized.count >= 8 else { return nil }
        let sid = "manual-e164:\(normalized)"
        return Business(
            id: stableBusinessUUID(twilioSid: sid),
            name: normalized,
            twilioNumber: normalized,
            initials: initialsForLine(name: normalized, phone: normalized),
            tint: .cyan,
            greetingPrompt: "",
            businessHours: "SMS line (Settings)",
            isActive: true,
            todayCallCount: 0,
            todayMessageCount: 0
        )
    }

    static func fromTwilioIncomingNumbers(_ numbers: [TwilioIncomingNumber]) -> [Business] {
        let palette = BusinessTint.allCases
        let sorted = numbers.sorted { $0.phoneNumber < $1.phoneNumber }
        return sorted.enumerated().map { index, n in
            let rawName = n.friendlyName?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
            let displayName = rawName.isEmpty ? n.phoneNumber : rawName
            let caps = [n.voice ? "Voice" : nil, n.sms ? "SMS" : nil, n.mms ? "MMS" : nil].compactMap { $0 }
            let hoursHint = caps.isEmpty ? "Capabilities from Twilio" : caps.joined(separator: " · ")
            return Business(
                id: stableBusinessUUID(twilioSid: n.id),
                name: displayName,
                twilioNumber: n.phoneNumber,
                initials: initialsForLine(name: displayName, phone: n.phoneNumber),
                tint: palette[index % palette.count],
                greetingPrompt: "",
                businessHours: hoursHint,
                isActive: true,
                todayCallCount: 0,
                todayMessageCount: 0
            )
        }
    }

    private static func initialsForLine(name: String, phone: String) -> String {
        let parts = name.split(whereSeparator: { $0.isWhitespace }).map(String.init).filter { !$0.isEmpty }
        let words = parts.filter { $0.contains(where: \.isLetter) }
        if words.count >= 2 {
            let a = words[0].first.map { String($0).uppercased() } ?? ""
            let b = words[1].first.map { String($0).uppercased() } ?? ""
            let s = a + b
            return s.isEmpty ? digitsTailInitials(phone) : s
        }
        if let w = words.first, w.count >= 2 {
            return String(w.prefix(2)).uppercased()
        }
        return digitsTailInitials(phone)
    }

    private static func digitsTailInitials(_ phone: String) -> String {
        let digits = phone.filter(\.isNumber)
        let tail = String(digits.suffix(2))
        return tail.isEmpty ? "•" : tail
    }

    private static func stableBusinessUUID(twilioSid: String) -> UUID {
        let digest = Insecure.MD5.hash(data: Data("biz|\(twilioSid)".utf8))
        var bytes = Array(digest)
        bytes[6] = (bytes[6] & 0x0F) | 0x40
        bytes[8] = (bytes[8] & 0x3F) | 0x80
        return UUID(uuid: (
            bytes[0], bytes[1], bytes[2], bytes[3],
            bytes[4], bytes[5], bytes[6], bytes[7],
            bytes[8], bytes[9], bytes[10], bytes[11],
            bytes[12], bytes[13], bytes[14], bytes[15]
        ))
    }
}
