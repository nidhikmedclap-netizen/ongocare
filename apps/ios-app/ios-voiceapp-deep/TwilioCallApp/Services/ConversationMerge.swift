//
//  ConversationMerge.swift
//  TwilioCallApp
//

import CryptoKit
import Foundation

enum ConversationMerge {
    /// Stable thread id so pull-to-refresh and navigation do not churn.
    static func stableConversationId(businessId: UUID, peerE164: String) -> UUID {
        let basis = "conv|\(businessId.uuidString.lowercased())|\(peerE164)"
        return uuidFromMD5Basis(basis)
    }

    static func stableMessageId(serverRowId: String) -> UUID {
        uuidFromMD5Basis("msg|\(serverRowId)")
    }

    private static func uuidFromMD5Basis(_ basis: String) -> UUID {
        let digest = Insecure.MD5.hash(data: Data(basis.utf8))
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

    /// - Parameters:
    ///   - smsLineE164Override: Your real Twilio SMS number (E.164) if it does not match any `Business.twilioNumber` in seed data.
    ///   - smsLineBusinessId: Which business line to attribute that number to (threads + send-as context).
    static func conversations(
        from rows: [MessagingAPIClient.LogRow],
        businesses: [Business],
        contacts: [Contact],
        smsLineE164Override: String? = nil,
        smsLineBusinessId: UUID? = nil
    ) -> [Conversation] {
        struct Key: Hashable {
            var businessId: UUID
            var peerE164: String
        }

        var bizByE164: [String: Business] = [:]
        for b in businesses {
            let k = PhoneNumberE164.normalize(b.twilioNumber)
            if bizByE164[k] == nil { bizByE164[k] = b }
        }

        let trimmedOverride = smsLineE164Override?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        if !trimmedOverride.isEmpty, let bid = smsLineBusinessId,
           let biz = businesses.first(where: { $0.id == bid }) {
            let k = PhoneNumberE164.normalize(trimmedOverride)
            bizByE164[k] = biz
        }

        var buckets: [Key: [Message]] = [:]
        var lastPreview: [Key: (text: String, date: Date)] = [:]

        for r in rows.sorted(by: { $0.atDate < $1.atDate }) {
            let fromN = PhoneNumberE164.normalize(r.from)
            let toN = PhoneNumberE164.normalize(r.to)
            let inbound = r.direction == "inbound"
            let ourLine = inbound ? toN : fromN
            let peer = inbound ? fromN : toN
            guard let biz = bizByE164[ourLine] else { continue }

            let key = Key(businessId: biz.id, peerE164: peer)
            let msg = Message(
                id: stableMessageId(serverRowId: r.id),
                direction: inbound ? .inbound : .outbound,
                body: r.body,
                timestamp: r.atDate,
                status: .delivered
            )
            buckets[key, default: []].append(msg)
            let preview = inbound ? r.body : "You: \(r.body)"
            lastPreview[key] = (preview, r.atDate)
        }

        return buckets.compactMap { key, messages -> Conversation? in
            guard let (preview, ts) = lastPreview[key] else { return nil }
            let name = displayName(peerE164: key.peerE164, contacts: contacts)
            let contactId = contacts.first { PhoneNumberE164.normalize($0.primaryNumber) == key.peerE164 }?.id
            return Conversation(
                id: stableConversationId(businessId: key.businessId, peerE164: key.peerE164),
                contactId: contactId,
                displayName: name,
                rawNumber: key.peerE164,
                businessId: key.businessId,
                lastMessagePreview: preview,
                lastMessageTimestamp: ts,
                unreadCount: 0,
                messages: messages
            )
        }
    }

    private static func displayName(peerE164: String, contacts: [Contact]) -> String {
        if let c = contacts.first(where: { PhoneNumberE164.normalize($0.primaryNumber) == peerE164 }) {
            return c.name
        }
        return peerE164
    }
}
