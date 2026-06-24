import Foundation

// MARK: - In-progress survey answer store
// Mirrors the `window.userProfile` JS object from the prototype.
// Stored in OngoUser.surveyProgress.answers as AnyCodable,
// then migrated to OngoUser fields on survey completion.
struct SurveyProfile: Codable {
    // Goals
    var weightLossGoal: String?
    var motivations: [String] = []

    // Identity
    var firstName: String?
    var email: String?

    // Body
    var heightFeet: Int?
    var heightInches: Int?
    var currentWeightLbs: Double?
    var goalWeightLbs: Double?
    var bmi: Double?

    // Weight history
    var weightConcernDuration: String?
    var pastWeightLossAttempts: [String] = []

    // Medical history
    var hasUsedGlp1: String?       // "yes-current" | "yes-past" | "no"
    var currentGlp1: String?
    var currentGlp1Dose: String?
    var glp1Experience: String?
    var glp1LastInjectionDate: Date?
    var glp1PhotoUploaded: Bool = false

    // ID verification
    var photoIdUploaded: Bool = false

    // Surgery
    var pastSurgeries: [String] = []
    var surgeryDetails: String?

    // Medical conditions
    var diagnosedConditions: [String] = []
    var otherConditions: [String] = []

    // Safety
    var safetyConditions: [String] = []
    var familyThyroidCancer: String?    // "yes" | "no" | "unsure"
    var suicidalIdeation: Bool = false

    // Lifestyle
    var sexAtBirth: String?        // "male" | "female"
    var isPregnant: String?
    var pregnancyConsentGiven: Bool = false
    var hasPancreatitis: String?
    var alcoholDrinksPerWeek: String?
    var usesRecreationalDrugs: String?
    var mealsPerDay: String?
    var exerciseDaysPerWeek: String?
    var sleepHoursPerNight: String?
    var fastFoodPerWeek: String?
    var sugaryDrinksPerWeek: String?
    var waterIntakeDaily: String?
    var stressLevel: String?
    var ethnicity: String?

    // Meds / allergies form
    var medications: String?
    var allergies: String?
    var preferredPharmacy: String?

    // Wrap-up
    var dateOfBirth: Date?
    var profilePhotoUploaded: Bool = false
    var medsAndAllergies: String?

    // Computed eligibility flags
    var hasHardContraindication: Bool {
        safetyConditions.contains("eating-disorder") ||
        safetyConditions.contains("glp1-allergy") ||
        safetyConditions.contains("gastroparesis") ||
        safetyConditions.contains("kidney-dialysis") ||
        familyThyroidCancer == "yes" ||
        hasPancreatitis == "yes"
    }

    var hasSoftContraindication: Bool {
        isPregnant == "yes" || isPregnant == "planning"
    }

    var heightTotalInches: Double? {
        guard let feet = heightFeet, let inches = heightInches else { return nil }
        return Double(feet * 12 + inches)
    }
}
