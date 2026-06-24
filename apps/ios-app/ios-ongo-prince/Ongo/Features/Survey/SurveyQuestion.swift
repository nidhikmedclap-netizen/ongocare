import Foundation

// MARK: - Survey question model (mirrors the JS `questions` array)
struct SurveyQuestion: Identifiable, @unchecked Sendable {
    let id: String
    let section: SurveySection
    let type: QuestionType
    let eyebrow: String?
    let headline: String          // static version; dynamic headlines resolved in view
    let sub: String?
    let options: [AnswerOption]
    let isRequired: Bool
    let placeholder: String?
    let showIf: ((SurveyProfile) -> Bool)?  // nil = always show
    let isHardExit: Bool          // true for safety-exit and crisis screens

    init(
        id: String,
        section: SurveySection,
        type: QuestionType,
        eyebrow: String? = nil,
        headline: String,
        sub: String? = nil,
        options: [AnswerOption] = [],
        isRequired: Bool = true,
        placeholder: String? = nil,
        showIf: ((SurveyProfile) -> Bool)? = nil,
        isHardExit: Bool = false
    ) {
        self.id = id
        self.section = section
        self.type = type
        self.eyebrow = eyebrow
        self.headline = headline
        self.sub = sub
        self.options = options
        self.isRequired = isRequired
        self.placeholder = placeholder
        self.showIf = showIf
        self.isHardExit = isHardExit
    }

    enum QuestionType {
        case singleSelect
        case multiSelect
        case text
        case number
        case heightWeight    // compound height + weight input
        case dateInput
        case fileUpload
        case photoID
        case doseSelect      // dynamic doses loaded from Firestore
        case dropdown
        case stressSlider
        case profileForm     // lastName, DOB, zip, phone, address
        case medsAllergiesForm
        case celebrate       // transition screen, auto-advance enabled
        case consent         // pregnancy consent
        case crisis          // 988 screen
        case safetyExit      // hard exit
        case eligibilityRouting  // success → handoff to booking
    }

    struct AnswerOption: Identifiable {
        let id: String
        let label: String
        let description: String?
        let isExclusive: Bool  // for "None of the above" type options

        init(id: String, label: String, description: String? = nil, isExclusive: Bool = false) {
            self.id = id
            self.label = label
            self.description = description
            self.isExclusive = isExclusive
        }
    }
}

// MARK: - Survey sections (mirrors JS `sections` array)
enum SurveySection: String, CaseIterable {
    case goals          = "goals"
    case identity       = "identity"
    case body           = "body"
    case weightHistory  = "weight-history"
    case medicalHistory = "medical-history"
    case idVerification = "id-verification"
    case surgery        = "surgery"
    case medical        = "medical"
    case safety         = "safety"
    case lifestyle      = "lifestyle"
    case wrapUp         = "wrap-up"

    var displayLabel: String {
        switch self {
        case .goals:          return "Goals"
        case .identity:       return "About You"
        case .body:           return "Body"
        case .weightHistory:  return "History"
        case .medicalHistory: return "Meds"
        case .idVerification: return "ID"
        case .surgery:        return "Surgery"
        case .medical:        return "Medical"
        case .safety:         return "Safety"
        case .lifestyle:      return "Lifestyle"
        case .wrapUp:         return "Wrap-up"
        }
    }
}
