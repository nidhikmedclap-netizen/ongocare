import Foundation
@preconcurrency import FirebaseFirestore

struct WeightEntry: Codable, Identifiable, Sendable {
    @DocumentID var id: String?

    var userId: String
    var weightLbs: Double
    var note: String?
    var photoURL: String?
    var loggedAt: Date

    // Computed for display
    var weightKg: Double { weightLbs * 0.453592 }

    static let collectionPath = "weightEntries"
}

// MARK: - Body measurement for body fat calculator
struct BodyMeasurement: Codable, Identifiable {
    @DocumentID var id: String?

    var userId: String
    var sexAtBirth: String         // "male" | "female"

    // Navy formula inputs (inches)
    var neckInches: Double
    var waistInches: Double
    var hipsInches: Double?        // female only

    // Results
    var bodyFatPercent: Double
    var bodyFatCategory: BodyFatCategory
    var measuredAt: Date

    enum BodyFatCategory: String, Codable {
        case essential = "Essential"
        case athlete = "Athlete"
        case fitness = "Fitness"
        case average = "Average"
        case obese = "Obese"
    }

    // US Navy formula
    static func calculate(sexAtBirth: String,
                          heightInches: Double,
                          neckInches: Double,
                          waistInches: Double,
                          hipsInches: Double? = nil) -> Double {
        if sexAtBirth == "male" {
            let val = 495.0 / (1.0324 - 0.19077 * log10(waistInches - neckInches) + 0.15456 * log10(heightInches)) - 450.0
            return max(0, val)
        } else {
            let hips = hipsInches ?? 0
            let val = 495.0 / (1.29579 - 0.35004 * log10(waistInches + hips - neckInches) + 0.22100 * log10(heightInches)) - 450.0
            return max(0, val)
        }
    }

    static func category(for percent: Double, sexAtBirth: String) -> BodyFatCategory {
        if sexAtBirth == "male" {
            switch percent {
            case ..<3:    return .essential
            case 3..<14:  return .athlete
            case 14..<18: return .fitness
            case 18..<25: return .average
            default:      return .obese
            }
        } else {
            switch percent {
            case ..<12:   return .essential
            case 12..<21: return .athlete
            case 21..<25: return .fitness
            case 25..<32: return .average
            default:      return .obese
            }
        }
    }

    static let collectionPath = "bodyMeasurements"
}
