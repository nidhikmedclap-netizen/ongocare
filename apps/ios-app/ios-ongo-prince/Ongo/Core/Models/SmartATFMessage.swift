import Foundation
@preconcurrency import FirebaseFirestore

// MARK: - Firestore-backed ATF message template
// Collection: /atfMessages/{messageId}
struct SmartATFMessage: Codable, Identifiable, Sendable {
    @DocumentID var id: String?

    var tier: MessageTier
    var score: Int                 // higher = higher priority
    var text: String               // supports {firstName} {weightLost} {daysOnPlan} placeholders
    var ctaLabel: String?
    var ctaAction: String?         // "openTracker", "openBooking", "openShop", etc.
    var conditions: MessageConditions?
    var locale: String             // "en" | "es"
    var active: Bool

    enum MessageTier: String, Codable, CaseIterable {
        case urgent    = "urgent"
        case nudge     = "nudge"
        case celebrate = "celebrate"
        case tip       = "tip"

        var sortPriority: Int {
            switch self {
            case .urgent:    return 4
            case .nudge:     return 3
            case .celebrate: return 2
            case .tip:       return 1
            }
        }
    }

    struct MessageConditions: Codable {
        var minBmi: Double?
        var hasMedication: Bool?
        var daysOnPlanMin: Int?
        var daysOnPlanMax: Int?
        var hasLoggedWeightToday: Bool?
        var hasCompletedCheckinToday: Bool?
        var dayOfWeek: [Int]?      // 1 = Sunday, 7 = Saturday
    }

    static let collectionPath = "atfMessages"

    // MARK: - Resolve {placeholder} variables
    func resolvedText(firstName: String, weightLost: Double = 0, daysOnPlan: Int = 0) -> String {
        text
            .replacingOccurrences(of: "{firstName}", with: firstName)
            .replacingOccurrences(of: "{weightLost}", with: String(format: "%.1f", weightLost))
            .replacingOccurrences(of: "{daysOnPlan}", with: "\(daysOnPlan)")
    }
}

// MARK: - Medication config from Firestore
// Collection: /medications/{medId}
struct MedicationConfig: Codable, Identifiable, Sendable {
    @DocumentID var id: String?

    var name: String               // "Wegovy"
    var genericName: String        // "semaglutide"
    var doses: [DoseOption]
    var frequency: DoseFrequency
    var active: Bool

    struct DoseOption: Codable, Identifiable {
        var id: String
        var value: String          // "0.25mg"
        var label: String          // "0.25 mg / week (starting)"
        var isStartingDose: Bool
    }

    enum DoseFrequency: String, Codable {
        case weekly = "weekly"
        case daily  = "daily"
    }

    static let collectionPath = "medications"
}
