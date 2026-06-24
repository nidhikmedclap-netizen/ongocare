import Foundation
@preconcurrency import FirebaseFirestore

struct OngoUser: Codable, Identifiable, Sendable {
    @DocumentID var id: String?

    // Identity
    var firstName: String
    var lastName: String
    var email: String
    var phone: String?
    var dateOfBirth: Date?
    var zipCode: String?
    var address: String?
    var profilePhotoURL: String?

    // Plan & Eligibility
    var planTier: PlanTier
    var glp1Eligible: Bool
    var eligibilityStatus: EligibilityStatus
    var assignedDoctorId: String?
    var activePrescriptionId: String?

    // Survey state
    var surveyProgress: SurveyProgress?
    var surveyCompleted: Bool

    // Onboarding quiz answers (captured pre-auth, merged on signup)
    var quizAnswers: QuizAnswers?

    // Medical intake answers (body + weight history survey)
    var medicalIntake: MedicalIntake?

    // GLP-1 medication history
    var glp1History: GLP1History?

    // Full survey profile snapshot (persisted on survey completion)
    var surveyProfile: SurveyProfile?

    // App state
    var lastActiveAt: Date?
    var createdAt: Date
    var fcmToken: String?

    // Computed
    var hasActivePlan: Bool { planTier != .none && glp1Eligible }
    var displayName: String { firstName.isEmpty ? email : firstName }
    var initials: String {
        let f = firstName.prefix(1)
        let l = lastName.prefix(1)
        return l.isEmpty ? String(f) : "\(f)\(l)"
    }

    enum PlanTier: String, Codable, CaseIterable {
        case none = "none"
        case starter = "starter"
        case core = "core"
        case premium = "premium"
    }

    enum EligibilityStatus: String, Codable {
        case pending = "pending"
        case eligible = "eligible"
        case ineligible = "ineligible"
        case borderline = "borderline"
        case safetyExit = "safety_exit"
    }

    struct SurveyProgress: Codable, Sendable {
        var currentQuestionId: String
        var answers: [String: AnyCodable]
        var sectionIndex: Int
        var surveyVersion: Int
        var lastUpdated: Date

        init(currentQuestionId: String = "weight-loss-goal",
             answers: [String: AnyCodable] = [:],
             sectionIndex: Int = 0,
             surveyVersion: Int = SurveyVersion.current) {
            self.currentQuestionId = currentQuestionId
            self.answers = answers
            self.sectionIndex = sectionIndex
            self.surveyVersion = surveyVersion
            self.lastUpdated = Date()
        }
    }

    struct QuizAnswers: Codable, Sendable {
        var weightLossGoal: String?
        var currentWeight: Double?
        var heightFeet: Int?
        var heightInches: Int?
        var bmi: Double?
        var capturedAt: Date
    }

    struct MedicalIntake: Codable, Sendable {
        var heightFeet: Int?
        var heightInches: Int?
        var heightCm: Double?
        var currentWeightLbs: Double?
        var currentWeightKg: Double?
        var goalWeightLbs: Double?
        var goalWeightKg: Double?
        var bmi: Double?
        var weightConcernDuration: String?
        var previousWeightMethods: [String]
        var completedAt: Date

        init() {
            heightFeet = nil
            heightInches = nil
            heightCm = nil
            currentWeightLbs = nil
            currentWeightKg = nil
            goalWeightLbs = nil
            goalWeightKg = nil
            bmi = nil
            weightConcernDuration = nil
            previousWeightMethods = []
            completedAt = Date()
        }
    }

    struct GLP1History: Codable, Sendable {
        var hasTakenGLP1: Bool
        var medication: String?
        var dose: String?
        var doseNotes: String?
        var experience: String?
        var lastInjectionDate: Date?
        var photoUploaded: Bool

        init(hasTakenGLP1: Bool = false) {
            self.hasTakenGLP1 = hasTakenGLP1
            medication = nil
            dose = nil
            doseNotes = nil
            experience = nil
            lastInjectionDate = nil
            photoUploaded = false
        }
    }
}

// MARK: - Survey version tracking for migration
enum SurveyVersion {
    static let current = 1
}

// MARK: - Firestore collection path
extension OngoUser {
    static let collectionPath = "users"
}
