import Foundation
import Observation

@Observable
final class SurveyViewModel: @unchecked Sendable {
    // MARK: - Navigation state
    private(set) var currentIndex: Int = 0
    private(set) var history: [Int] = []
    private(set) var visibleQuestions: [SurveyQuestion] = []

    // MARK: - Answers
    var profile = SurveyProfile()

    // MARK: - Multi-select in-progress answers for current question
    var currentMultiSelection: Set<String> = []
    var currentSingleSelection: String? = nil
    var currentTextInput: String = ""
    var currentNumberInput: String = ""
    var currentDateInput: Date? = nil
    var currentStressLevel: Double = 5  // 1–10 slider

    // MARK: - Per-section progress (for the top bar segments)
    var sectionIndex: Int {
        guard let current = currentQuestion else { return 0 }
        return SurveySection.allCases.firstIndex(of: current.section) ?? 0
    }

    var currentQuestion: SurveyQuestion? {
        guard currentIndex < visibleQuestions.count else { return nil }
        return visibleQuestions[currentIndex]
    }

    var sectionProgress: Double {
        guard let q = currentQuestion else { return 0 }
        let sectionQs = visibleQuestions.filter { $0.section == q.section }
        let qIndex = sectionQs.firstIndex(where: { $0.id == q.id }) ?? 0
        let total = max(1, sectionQs.count - 1)
        return Double(qIndex) / Double(total)
    }

    var overallProgress: Double {
        guard !visibleQuestions.isEmpty else { return 0 }
        return Double(currentIndex) / Double(visibleQuestions.count)
    }

    var canAdvance: Bool {
        guard let q = currentQuestion else { return false }
        switch q.type {
        case .celebrate, .crisis, .consent, .eligibilityRouting: return true
        case .singleSelect, .dropdown:   return currentSingleSelection != nil
        case .multiSelect:               return !currentMultiSelection.isEmpty
        case .text:                      return !currentTextInput.trimmingCharacters(in: .whitespaces).isEmpty
        case .number:                    return Double(currentNumberInput) != nil
        case .dateInput:                 return currentDateInput != nil
        case .doseSelect:                return currentSingleSelection != nil
        case .stressSlider:              return true
        case .heightWeight:              return profile.heightTotalInches != nil && profile.currentWeightLbs != nil
        case .fileUpload, .photoID:      return true  // skippable
        case .profileForm:               return isProfileFormValid
        case .medsAllergiesForm:         return true  // all fields optional in this form
        case .safetyExit:                return false
        }
    }

    private var isProfileFormValid: Bool {
        !profile.firstName.isNilOrEmpty &&
        profile.dateOfBirth != nil
    }

    // MARK: - Services
    private let firestore = FirestoreService.shared
    private var userId: String?
    private var saveTask: Task<Void, Never>? = nil

    // MARK: - Init (resume if progress exists)
    func load(userId: String, savedProgress: OngoUser.SurveyProgress?) {
        self.userId = userId
        rebuildVisibleQuestions()

        if let progress = savedProgress,
           progress.surveyVersion == SurveyVersion.current {
            // Resume from saved position
            if let idx = visibleQuestions.firstIndex(where: { $0.id == progress.currentQuestionId }) {
                currentIndex = idx
            }
            // answers will be restored when we decode the AnyCodable map
        }
    }

    // MARK: - Jump to a specific question (used when chaining from GLP-1 survey)
    func startAtQuestion(id: String) {
        rebuildVisibleQuestions()
        if let idx = visibleQuestions.firstIndex(where: { $0.id == id }) {
            currentIndex = idx
        }
        clearCurrentInputs()
    }

    // MARK: - Rebuild visible question list based on current profile state
    private func rebuildVisibleQuestions() {
        visibleQuestions = SurveyQuestions.all.filter { q in
            q.showIf?(profile) ?? true
        }
    }

    // MARK: - Advance
    func advance() {
        guard let q = currentQuestion else { return }
        saveCurrentAnswer(q)
        rebuildVisibleQuestions()

        history.append(currentIndex)

        // Find next question after current in visible list
        if currentIndex + 1 < visibleQuestions.count {
            currentIndex += 1
        }

        clearCurrentInputs()
        restoreInputsForCurrentQuestion()
        debouncedSave()
        AnalyticsService.logSurveyQuestionAnswered(
            questionId: q.id,
            section: q.section.rawValue
        )
    }

    // MARK: - Go back
    func goBack() {
        guard let prev = history.popLast() else { return }
        currentIndex = prev
        clearCurrentInputs()
        restoreInputsForCurrentQuestion()
    }

    // MARK: - Save current answer into profile
    private func saveCurrentAnswer(_ q: SurveyQuestion) {
        switch q.id {
        case "weight-loss-goal":   profile.weightLossGoal = currentSingleSelection
        case "motivation":         profile.motivations = Array(currentMultiSelection)
        case "first-name":         profile.firstName = currentTextInput.trimmingCharacters(in: .whitespaces)
        case "email":              profile.email = currentTextInput.trimmingCharacters(in: .whitespaces)
        case "goal-weight":        profile.goalWeightLbs = Double(currentNumberInput)
        case "weight-concern-duration": profile.weightConcernDuration = currentSingleSelection
        case "past-attempts":      profile.pastWeightLossAttempts = Array(currentMultiSelection)
        case "has-used-glp1":      profile.hasUsedGlp1 = currentSingleSelection
        case "which-glp1":         profile.currentGlp1 = currentSingleSelection
        case "glp1-dose":          profile.currentGlp1Dose = currentSingleSelection
        case "glp1-experience":    profile.glp1Experience = currentSingleSelection
        case "glp1-last-injection":profile.glp1LastInjectionDate = currentDateInput
        case "past-surgeries":     profile.pastSurgeries = Array(currentMultiSelection)
        case "surgery-details":    profile.surgeryDetails = currentTextInput
        case "diagnosed-conditions": profile.diagnosedConditions = Array(currentMultiSelection)
        case "other-conditions":   profile.otherConditions = Array(currentMultiSelection)
        case "safety-conditions":
            profile.safetyConditions = Array(currentMultiSelection)
            profile.suicidalIdeation = currentMultiSelection.contains("suicidal-ideation")
        case "family-thyroid":     profile.familyThyroidCancer = currentSingleSelection
        case "sex-at-birth":       profile.sexAtBirth = currentSingleSelection
        case "pregnancy":          profile.isPregnant = currentSingleSelection
        case "pregnancy-consent":  profile.pregnancyConsentGiven = true
        case "pancreatitis":       profile.hasPancreatitis = currentSingleSelection
        case "alcohol":            profile.alcoholDrinksPerWeek = currentSingleSelection
        case "recreational-drugs": profile.usesRecreationalDrugs = currentMultiSelection.contains("none") ? "none" : Array(currentMultiSelection).joined(separator: ",")
        case "meals-per-day":      profile.mealsPerDay = currentSingleSelection
        case "exercise-days":      profile.exerciseDaysPerWeek = currentSingleSelection
        case "sleep-hours":        profile.sleepHoursPerNight = currentSingleSelection
        case "fast-food":          profile.fastFoodPerWeek = currentSingleSelection
        case "sugary-drinks":      profile.sugaryDrinksPerWeek = currentSingleSelection
        case "water-intake":       profile.waterIntakeDaily = currentSingleSelection
        case "stress-level":       profile.stressLevel = "\(Int(currentStressLevel))"
        case "ethnicity":          profile.ethnicity = currentSingleSelection
        default: break
        }
    }

    // MARK: - Restore inputs when navigating back
    private func restoreInputsForCurrentQuestion() {
        guard let q = currentQuestion else { return }
        switch q.id {
        case "weight-loss-goal":   currentSingleSelection = profile.weightLossGoal
        case "motivation":         currentMultiSelection = Set(profile.motivations)
        case "first-name":         currentTextInput = profile.firstName ?? ""
        case "email":              currentTextInput = profile.email ?? ""
        case "goal-weight":        currentNumberInput = profile.goalWeightLbs.map { "\(Int($0))" } ?? ""
        case "weight-concern-duration": currentSingleSelection = profile.weightConcernDuration
        case "has-used-glp1":      currentSingleSelection = profile.hasUsedGlp1
        case "which-glp1":         currentSingleSelection = profile.currentGlp1
        case "glp1-dose":          currentSingleSelection = profile.currentGlp1Dose
        case "sex-at-birth":       currentSingleSelection = profile.sexAtBirth
        case "pancreatitis":       currentSingleSelection = profile.hasPancreatitis
        case "alcohol":            currentSingleSelection = profile.alcoholDrinksPerWeek
        case "meals-per-day":      currentSingleSelection = profile.mealsPerDay
        case "stress-level":       currentStressLevel = Double(profile.stressLevel ?? "5") ?? 5
        default: break
        }
    }

    private func clearCurrentInputs() {
        currentSingleSelection = nil
        currentMultiSelection = []
        currentTextInput = ""
        currentNumberInput = ""
        currentDateInput = nil
        currentStressLevel = 5
    }

    // MARK: - Debounced Firestore save (every answer, ~500ms debounce)
    private func debouncedSave() {
        saveTask?.cancel()
        saveTask = Task {
            try? await Task.sleep(for: .milliseconds(500))
            guard !Task.isCancelled, let uid = userId else { return }
            let progress = OngoUser.SurveyProgress(
                currentQuestionId: currentQuestion?.id ?? "weight-loss-goal",
                sectionIndex: sectionIndex
            )
            try? await firestore.updateSurveyProgress(progress, userId: uid)
        }
    }
}

private extension Optional where Wrapped == String {
    var isNilOrEmpty: Bool { self == nil || self!.isEmpty }
}
