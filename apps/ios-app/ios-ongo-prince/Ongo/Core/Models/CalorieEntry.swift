import Foundation
@preconcurrency import FirebaseFirestore

struct CalorieEntry: Codable, Identifiable, Sendable {
    @DocumentID var id: String?

    var userId: String
    var date: Date                 // normalized to midnight UTC
    var mealCategory: MealCategory
    var foodName: String
    var calories: Int
    var protein: Double            // grams
    var carbs: Double              // grams
    var fat: Double                // grams
    var servingSize: String?
    var loggedAt: Date
    var source: LogSource

    enum MealCategory: String, Codable, CaseIterable {
        case breakfast = "breakfast"
        case lunch     = "lunch"
        case dinner    = "dinner"
        case snack     = "snack"

        var displayName: String { rawValue.capitalized }
    }

    enum LogSource: String, Codable {
        case manual = "manual"
        case aiPhoto = "ai_photo"
        case quickAdd = "quick_add"
    }

    static let collectionPath = "calorieEntries"
}

// MARK: - Daily calorie goal (Mifflin-St Jeor BMR)
struct CalorieGoal: Codable {
    var targetCalories: Int
    var protein: Int               // grams
    var carbs: Int                 // grams
    var fat: Int                   // grams

    // Mifflin-St Jeor BMR
    static func calculate(
        sexAtBirth: String,
        weightLbs: Double,
        heightInches: Double,
        ageYears: Int,
        activityLevel: ActivityLevel = .sedentary,
        goal: Goal = .loseWeight
    ) -> CalorieGoal {
        let weightKg = weightLbs * 0.453592
        let heightCm = heightInches * 2.54

        let bmr: Double
        if sexAtBirth == "male" {
            bmr = 10 * weightKg + 6.25 * heightCm - 5 * Double(ageYears) + 5
        } else {
            bmr = 10 * weightKg + 6.25 * heightCm - 5 * Double(ageYears) - 161
        }

        let tdee = bmr * activityLevel.multiplier
        let target = Int(tdee + Double(goal.calorieAdjustment))
        let protein = Int(weightLbs * 0.8)       // ~0.8g per lb body weight
        let fat = Int(Double(target) * 0.30 / 9)
        let carbs = Int((Double(target) - Double(protein * 4) - Double(fat * 9)) / 4)

        return CalorieGoal(targetCalories: target, protein: protein, carbs: max(0, carbs), fat: fat)
    }

    enum ActivityLevel: String, Codable {
        case sedentary      = "sedentary"
        case lightlyActive  = "lightly_active"
        case moderatelyActive = "moderately_active"
        case veryActive     = "very_active"

        var multiplier: Double {
            switch self {
            case .sedentary:        return 1.2
            case .lightlyActive:    return 1.375
            case .moderatelyActive: return 1.55
            case .veryActive:       return 1.725
            }
        }
    }

    enum Goal: String, Codable {
        case loseWeight   = "lose_weight"
        case maintain     = "maintain"
        case gainMuscle   = "gain_muscle"

        var calorieAdjustment: Int {
            switch self {
            case .loseWeight:  return -500
            case .maintain:    return 0
            case .gainMuscle:  return 250
            }
        }
    }
}
