import Foundation
@preconcurrency import FirebaseFirestore

struct DailyCheckin: Codable, Identifiable, Sendable {
    @DocumentID var id: String?

    var userId: String
    var date: Date                 // normalized to midnight UTC

    var mood: MoodEntry?
    var water: WaterEntry?
    var steps: StepsEntry?
    var meds: MedsEntry?

    var createdAt: Date
    var updatedAt: Date

    // MARK: - Sub-entries
    struct MoodEntry: Codable {
        var score: Int             // 1–5
        var note: String?
        var loggedAt: Date
    }

    struct WaterEntry: Codable {
        var cupsLogged: Int        // each cup = 8 oz
        var goalCups: Int          // default 8
        var loggedAt: Date

        var progressFraction: Double {
            guard goalCups > 0 else { return 0 }
            return min(1.0, Double(cupsLogged) / Double(goalCups))
        }
    }

    struct StepsEntry: Codable {
        var steps: Int
        var goalSteps: Int         // default 7000
        var source: StepSource
        var loggedAt: Date

        var progressFraction: Double {
            guard goalSteps > 0 else { return 0 }
            return min(1.0, Double(steps) / Double(goalSteps))
        }

        enum StepSource: String, Codable {
            case manual = "manual"
            case healthKit = "health_kit"
        }
    }

    struct MedsEntry: Codable {
        var taken: Bool
        var medicationName: String
        var dose: String
        var loggedAt: Date
    }

    // Firestore document ID is userId_dateString
    static func documentId(userId: String, date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        formatter.timeZone = TimeZone(identifier: "UTC")
        return "\(userId)_\(formatter.string(from: date))"
    }

    static let collectionPath = "dailyCheckins"
}
