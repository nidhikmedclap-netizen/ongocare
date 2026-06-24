//
//  MockTwilioService.swift
//  TwilioCallApp
//
//  Hardcoded sample data so the UI is fully populated for review before
//  the real TwilioVoice + REST integration lands.
//

import Foundation

final class MockTwilioService: TwilioServicing {

    // MARK: Seed data (computed lazily so IDs are stable per instance)

    lazy var seedBusinesses: [Business] = [
        Business(
            name: "Acme Dental",
            twilioNumber: "+1 (559) 234-4795",
            initials: "AD",
            tint: .cyan,
            greetingPrompt: "Thank you for calling Acme Dental, this is...",
            businessHours: "8a–6p",
            isActive: true,
            todayCallCount: 14,
            todayMessageCount: 7
        ),
        Business(
            name: "Wellness Clinic",
            twilioNumber: "+1 (415) 555-0291",
            initials: "WC",
            tint: .pink,
            greetingPrompt: "Wellness Clinic, how can I help you today?",
            businessHours: "7a–7p",
            isActive: true,
            todayCallCount: 9,
            todayMessageCount: 12
        ),
        Business(
            name: "Sunset Realty",
            twilioNumber: "+1 (310) 555-0445",
            initials: "SR",
            tint: .amber,
            businessHours: "9a–8p",
            isActive: true,
            todayCallCount: 22,
            todayMessageCount: 5
        ),
        Business(
            name: "Brennan Legal",
            twilioNumber: "+1 (646) 555-0118",
            initials: "BL",
            tint: .purple,
            greetingPrompt: "Brennan Legal, this is...",
            businessHours: "9a–6p",
            isActive: true,
            todayCallCount: 3,
            todayMessageCount: 2
        ),
        Business(
            name: "Lotus Spa",
            twilioNumber: "+1 (212) 555-0334",
            initials: "LS",
            tint: .green,
            businessHours: "10a–8p",
            isActive: false,
            todayCallCount: 6,
            todayMessageCount: 4
        ),
        Business(
            name: "Bay Auto Repair",
            twilioNumber: "+1 (510) 555-0782",
            initials: "BA",
            tint: .red,
            businessHours: "7a–6p",
            isActive: true,
            todayCallCount: 11,
            todayMessageCount: 8
        )
    ]

    lazy var seedContacts: [Contact] = [
        Contact(name: "Sarah Chen",
                phoneNumbers: [.init(kind: .mobile, number: "+1 (415) 555-0198")],
                email: "sarah@acme.co",
                company: "Acme Co.",
                gradientIndex: 0),
        Contact(name: "Marcus Kim",
                phoneNumbers: [.init(kind: .mobile, number: "+1 (646) 555-0102")],
                gradientIndex: 1),
        Contact(name: "Priya Gupta",
                phoneNumbers: [.init(kind: .mobile, number: "+1 (628) 555-0198")],
                gradientIndex: 2),
        Contact(name: "Alex Tanaka",
                phoneNumbers: [.init(kind: .mobile, number: "+1 (212) 555-0118")],
                gradientIndex: 3),
        Contact(name: "Jordan Rivera",
                phoneNumbers: [.init(kind: .mobile, number: "+1 (310) 555-0190")],
                gradientIndex: 4)
    ]

    lazy var seedCalls: [CallRecord] = {
        let bs = seedBusinesses
        let cs = seedContacts
        let now = Date()
        func ago(_ minutes: Int) -> Date { now.addingTimeInterval(-Double(minutes * 60)) }
        return [
            CallRecord(contactId: cs[0].id, displayName: cs[0].name, rawNumber: cs[0].primaryNumber,
                       direction: .outgoing, outcome: .answered, durationSeconds: 261,
                       timestamp: ago(17), businessId: bs[3].id),
            CallRecord(contactId: cs[1].id, displayName: cs[1].name, rawNumber: cs[1].primaryNumber,
                       direction: .incoming, outcome: .missed, durationSeconds: 0,
                       timestamp: ago(46), businessId: bs[0].id),
            CallRecord(contactId: cs[2].id, displayName: cs[2].name, rawNumber: cs[2].primaryNumber,
                       direction: .incoming, outcome: .answered, durationSeconds: 724,
                       timestamp: ago(60 * 23), businessId: bs[1].id),
            CallRecord(contactId: cs[3].id, displayName: cs[3].name, rawNumber: cs[3].primaryNumber,
                       direction: .outgoing, outcome: .answered, durationSeconds: 198,
                       timestamp: ago(60 * 26), businessId: bs[2].id),
            CallRecord(contactId: cs[4].id, displayName: cs[4].name, rawNumber: cs[4].primaryNumber,
                       direction: .incoming, outcome: .answered, durationSeconds: 47,
                       timestamp: ago(60 * 49), businessId: bs[4].id),
            CallRecord(displayName: "+1 (415) 555-0142", rawNumber: "+14155550142",
                       direction: .incoming, outcome: .missed, durationSeconds: 0,
                       timestamp: ago(60 * 72), businessId: bs[5].id)
        ]
    }()

    lazy var seedConversations: [Conversation] = {
        let bs = seedBusinesses
        let cs = seedContacts
        let now = Date()
        func ago(_ minutes: Int) -> Date { now.addingTimeInterval(-Double(minutes * 60)) }

        return [
            Conversation(
                contactId: cs[0].id, displayName: cs[0].name, rawNumber: cs[0].primaryNumber,
                businessId: bs[3].id,
                lastMessagePreview: "Sounds great — I'll send the deck over tonight 📊",
                lastMessageTimestamp: ago(3), unreadCount: 1,
                messages: [
                    Message(direction: .inbound, body: "Hi! Trying to confirm our review for Friday", timestamp: ago(40)),
                    Message(direction: .outbound, body: "Hi Sarah! Yes — 3pm works.", timestamp: ago(38)),
                    Message(direction: .inbound, body: "Perfect, sharing the file now.", timestamp: ago(20)),
                    Message(direction: .inbound, body: "Sounds great — I'll send the deck over tonight 📊", timestamp: ago(3))
                ]),
            Conversation(
                contactId: cs[1].id, displayName: cs[1].name, rawNumber: cs[1].primaryNumber,
                businessId: bs[0].id,
                lastMessagePreview: "Tried calling — give me a buzz when free",
                lastMessageTimestamp: ago(46), unreadCount: 1,
                messages: [
                    Message(direction: .inbound, body: "Hi! Trying to confirm my cleaning for tomorrow at 2pm", timestamp: ago(120)),
                    Message(direction: .outbound, body: "Hi Marcus! Yes — 2pm with Dr. Reyes. See you then 🦷", timestamp: ago(118)),
                    Message(direction: .inbound, body: "Perfect, thanks!", timestamp: ago(110)),
                    Message(direction: .inbound, body: "Tried calling — give me a buzz when free", timestamp: ago(46))
                ]),
            Conversation(
                contactId: cs[2].id, displayName: cs[2].name, rawNumber: cs[2].primaryNumber,
                businessId: bs[1].id,
                lastMessagePreview: "You: Thanks again for jumping on the call!",
                lastMessageTimestamp: ago(60 * 22),
                messages: [
                    Message(direction: .outbound, body: "Thanks again for jumping on the call!", timestamp: ago(60 * 22))
                ]),
            Conversation(
                contactId: cs[3].id, displayName: cs[3].name, rawNumber: cs[3].primaryNumber,
                businessId: bs[2].id,
                lastMessagePreview: "Lunch tomorrow? 1pm at the usual spot",
                lastMessageTimestamp: ago(60 * 24),
                messages: [
                    Message(direction: .inbound, body: "Lunch tomorrow? 1pm at the usual spot", timestamp: ago(60 * 24))
                ]),
            Conversation(
                displayName: "+1 (415) 555-0142", rawNumber: "+14155550142",
                businessId: bs[5].id,
                lastMessagePreview: "Your appointment is confirmed for Tue at 3pm.",
                lastMessageTimestamp: ago(60 * 60),
                messages: [
                    Message(direction: .inbound, body: "Your appointment is confirmed for Tue at 3pm.", timestamp: ago(60 * 60))
                ])
        ]
    }()

    // MARK: Service surface

    func loadBusinesses() async -> [Business] { seedBusinesses }
    func loadContacts() async -> [Contact] { seedContacts }
    func loadCalls() async -> [CallRecord] { seedCalls }
    func loadConversations() async -> [Conversation] { seedConversations }

    func placeCall(to number: String, from business: Business) async {
        // Real impl wires TwilioVoice SDK here.
    }

    func sendMessage(to number: String, body: String, from business: Business) async -> Message {
        Message(direction: .outbound, body: body, timestamp: Date(), status: .sent)
    }
}
