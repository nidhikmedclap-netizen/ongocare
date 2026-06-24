//
//  Models.swift
//  TwilioCallApp
//
//  Domain models used across the app. Designed to be source-of-record agnostic
//  so the same shapes work whether data comes from MockTwilioService or a real
//  Twilio backend later.
//

import CryptoKit
import Foundation
import SwiftUI

// MARK: - Business

/// A Twilio phone number paired with the business identity it represents.
/// Every Call and Conversation persists a `businessId` so the UI can label
/// which line / brand the interaction belongs to.
struct Business: Identifiable, Hashable {
    let id: UUID
    var name: String
    var twilioNumber: String
    var initials: String          // e.g. "AD" for Acme Dental
    var tint: BusinessTint        // colored chip / brand color
    var greetingPrompt: String    // shown on incoming-call screen
    var businessHours: String     // human-readable, e.g. "8a–6p"
    var isActive: Bool            // currently within hours
    var ringtoneName: String      // "Chime", "Default", etc.

    /// Stats surfaced on the Businesses list
    var todayCallCount: Int
    var todayMessageCount: Int

    init(
        id: UUID = UUID(),
        name: String,
        twilioNumber: String,
        initials: String,
        tint: BusinessTint,
        greetingPrompt: String = "",
        businessHours: String = "9a–5p",
        isActive: Bool = true,
        ringtoneName: String = "Chime",
        todayCallCount: Int = 0,
        todayMessageCount: Int = 0
    ) {
        self.id = id
        self.name = name
        self.twilioNumber = twilioNumber
        self.initials = initials
        self.tint = tint
        self.greetingPrompt = greetingPrompt.isEmpty
            ? "Thank you for calling \(name), this is..."
            : greetingPrompt
        self.businessHours = businessHours
        self.isActive = isActive
        self.ringtoneName = ringtoneName
        self.todayCallCount = todayCallCount
        self.todayMessageCount = todayMessageCount
    }
}

/// A small enum so business colors stay consistent across chips, banners, and avatar dots.
enum BusinessTint: String, CaseIterable, Hashable {
    case cyan, pink, amber, purple, green, red, blue, indigo

    var color: Color {
        switch self {
        case .cyan:   return Color(red: 0.02, green: 0.71, blue: 0.83)
        case .pink:   return Color(red: 0.93, green: 0.28, blue: 0.60)
        case .amber:  return Color(red: 0.96, green: 0.62, blue: 0.04)
        case .purple: return Color(red: 0.49, green: 0.23, blue: 0.93)
        case .green:  return Color(red: 0.13, green: 0.77, blue: 0.37)
        case .red:    return Color(red: 0.94, green: 0.27, blue: 0.27)
        case .blue:   return Color(red: 0.23, green: 0.51, blue: 0.96)
        case .indigo: return Color(red: 0.39, green: 0.40, blue: 0.95)
        }
    }

    /// Soft background tint used for chips
    var softFill: Color { color.opacity(0.18) }

    /// Lighter foreground tone used for chip text — hand-picked per tint
    /// so chips read clearly on the deep-purple background.
    var softText: Color {
        switch self {
        case .cyan:   return Color(red: 0.40, green: 0.91, blue: 0.97)
        case .pink:   return Color(red: 0.97, green: 0.66, blue: 0.83)
        case .amber:  return Color(red: 0.99, green: 0.83, blue: 0.46)
        case .purple: return Color(red: 0.77, green: 0.71, blue: 0.99)
        case .green:  return Color(red: 0.53, green: 0.94, blue: 0.67)
        case .red:    return Color(red: 0.99, green: 0.65, blue: 0.65)
        case .blue:   return Color(red: 0.58, green: 0.71, blue: 0.99)
        case .indigo: return Color(red: 0.65, green: 0.66, blue: 0.99)
        }
    }
}

// MARK: - Contact

struct Contact: Identifiable, Hashable {
    let id: UUID
    var name: String
    var phoneNumbers: [PhoneEntry]
    var email: String?
    var company: String?
    /// One of 6 deterministic gradient pairs used for the avatar bubble.
    var gradientIndex: Int

    init(
        id: UUID = UUID(),
        name: String,
        phoneNumbers: [PhoneEntry],
        email: String? = nil,
        company: String? = nil,
        gradientIndex: Int = 0
    ) {
        self.id = id
        self.name = name
        self.phoneNumbers = phoneNumbers
        self.email = email
        self.company = company
        self.gradientIndex = gradientIndex
    }

    var primaryNumber: String {
        phoneNumbers.first?.number ?? ""
    }

    var initials: String {
        let parts = name.split(separator: " ").prefix(2)
        let chars = parts.compactMap { $0.first.map(String.init) }
        return chars.joined().uppercased()
    }
}

struct PhoneEntry: Hashable {
    enum Kind: String { case mobile, work, home, other }
    var kind: Kind
    var number: String
}

// MARK: - Calls

struct CallRecord: Identifiable, Hashable {
    enum Direction { case incoming, outgoing }
    enum Outcome { case answered, missed, declined }

    let id: UUID
    /// When set, used as the Firestore document id and for cross-device deduplication.
    var twilioCallSid: String?
    var contactId: UUID?      // nil if from an unknown number
    var displayName: String   // resolved at write-time so list views are simple
    var rawNumber: String
    var direction: Direction
    var outcome: Outcome
    var durationSeconds: Int  // 0 for missed
    var timestamp: Date
    var businessId: UUID      // which Twilio line this call belonged to

    init(
        id: UUID = UUID(),
        twilioCallSid: String? = nil,
        contactId: UUID? = nil,
        displayName: String,
        rawNumber: String,
        direction: Direction,
        outcome: Outcome,
        durationSeconds: Int = 0,
        timestamp: Date,
        businessId: UUID
    ) {
        self.id = id
        self.twilioCallSid = twilioCallSid
        self.contactId = contactId
        self.displayName = displayName
        self.rawNumber = rawNumber
        self.direction = direction
        self.outcome = outcome
        self.durationSeconds = durationSeconds
        self.timestamp = timestamp
        self.businessId = businessId
    }

    var isMissed: Bool { outcome == .missed }

    /// Stable UUID derived from a Twilio Call SID so every device writes the same `CallRecord.id` / Firestore doc.
    static func stableUUID(fromTwilioCallSid sid: String) -> UUID {
        let input = Data("twilio.voice.call|\(sid)".utf8)
        let digest = SHA256.hash(data: input)
        var bytes = Array(digest.prefix(16))
        bytes[6] = (bytes[6] & 0x0F) | 0x40
        bytes[8] = (bytes[8] & 0x3F) | 0x80
        return UUID(
            uuid: (
                bytes[0], bytes[1], bytes[2], bytes[3],
                bytes[4], bytes[5], bytes[6], bytes[7],
                bytes[8], bytes[9], bytes[10], bytes[11],
                bytes[12], bytes[13], bytes[14], bytes[15]
            )
        )
    }
}

// MARK: - Messaging

struct Conversation: Identifiable, Hashable {
    let id: UUID
    var contactId: UUID?
    var displayName: String
    var rawNumber: String
    var businessId: UUID
    var lastMessagePreview: String
    var lastMessageTimestamp: Date
    var unreadCount: Int
    var messages: [Message]

    init(
        id: UUID = UUID(),
        contactId: UUID? = nil,
        displayName: String,
        rawNumber: String,
        businessId: UUID,
        lastMessagePreview: String,
        lastMessageTimestamp: Date,
        unreadCount: Int = 0,
        messages: [Message] = []
    ) {
        self.id = id
        self.contactId = contactId
        self.displayName = displayName
        self.rawNumber = rawNumber
        self.businessId = businessId
        self.lastMessagePreview = lastMessagePreview
        self.lastMessageTimestamp = lastMessageTimestamp
        self.unreadCount = unreadCount
        self.messages = messages
    }
}

struct Message: Identifiable, Hashable {
    enum Direction { case inbound, outbound }
    enum Status { case sending, sent, delivered, failed }

    let id: UUID
    var direction: Direction
    var body: String
    var timestamp: Date
    var status: Status

    init(
        id: UUID = UUID(),
        direction: Direction,
        body: String,
        timestamp: Date,
        status: Status = .delivered
    ) {
        self.id = id
        self.direction = direction
        self.body = body
        self.timestamp = timestamp
        self.status = status
    }
}
