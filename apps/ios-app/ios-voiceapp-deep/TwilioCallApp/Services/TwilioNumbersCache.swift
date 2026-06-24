//
//  TwilioNumbersCache.swift
//  TwilioCallApp
//

import Foundation

/// Persists the last successful `GET /api/twilio/phone-numbers` payload so lines still load when offline or the API errors.
enum TwilioNumbersCache {
    private static let key = "twilio_incoming_numbers_cache_v1"

    private struct Row: Codable {
        let id: String
        let phoneNumber: String
        let friendlyName: String?
        let voice: Bool
        let sms: Bool
        let mms: Bool
    }

    static func save(_ numbers: [TwilioIncomingNumber]) {
        let rows = numbers.map {
            Row(
                id: $0.id,
                phoneNumber: $0.phoneNumber,
                friendlyName: $0.friendlyName,
                voice: $0.voice,
                sms: $0.sms,
                mms: $0.mms
            )
        }
        guard let data = try? JSONEncoder().encode(rows) else { return }
        UserDefaults.standard.set(data, forKey: key)
    }

    static func load() -> [TwilioIncomingNumber]? {
        guard let data = UserDefaults.standard.data(forKey: key),
              let rows = try? JSONDecoder().decode([Row].self, from: data),
              !rows.isEmpty
        else { return nil }
        return rows.map {
            TwilioIncomingNumber(
                id: $0.id,
                phoneNumber: $0.phoneNumber,
                friendlyName: $0.friendlyName,
                voice: $0.voice,
                sms: $0.sms,
                mms: $0.mms
            )
        }
    }

    static func clear() {
        UserDefaults.standard.removeObject(forKey: key)
    }
}
