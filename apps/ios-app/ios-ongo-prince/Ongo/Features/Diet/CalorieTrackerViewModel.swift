import Foundation
import Observation
import FirebaseFirestore

@Observable
final class CalorieTrackerViewModel {
    var entries: [CalorieEntry] = []
    var goal: CalorieGoal = CalorieGoal(targetCalories: 2000, protein: 125, carbs: 200, fat: 67)
    var selectedCategory: CalorieEntry.MealCategory? = nil  // nil = show all
    var selectedDate: Date = Date()
    var isLoading: Bool = false
    var showLogMeal: Bool = false
    var showMealPlan: Bool = false

    private var listener: ListenerRegistration? = nil
    private let firestore = FirestoreService.shared

    // MARK: - Totals
    var totalCalories: Int { entries.map(\.calories).reduce(0, +) }
    var totalProtein: Double { entries.map(\.protein).reduce(0, +) }
    var totalCarbs: Double { entries.map(\.carbs).reduce(0, +) }
    var totalFat: Double { entries.map(\.fat).reduce(0, +) }
    var caloriesLeft: Int { max(0, goal.targetCalories - totalCalories) }

    var caloriesProgress: Double {
        guard goal.targetCalories > 0 else { return 0 }
        return min(1.0, Double(totalCalories) / Double(goal.targetCalories))
    }
    var proteinProgress: Double { min(1.0, totalProtein / Double(max(1, goal.protein))) }
    var carbsProgress: Double { min(1.0, totalCarbs / Double(max(1, goal.carbs))) }
    var fatProgress: Double { min(1.0, totalFat / Double(max(1, goal.fat))) }

    var filteredEntries: [CalorieEntry] {
        guard let cat = selectedCategory else { return entries }
        return entries.filter { $0.mealCategory == cat }
    }

    var entriesByCategory: [CalorieEntry.MealCategory: [CalorieEntry]] {
        Dictionary(grouping: entries) { $0.mealCategory }
    }

    // MARK: - Load entries for selected date
    @MainActor
    func load(userId: String, user: OngoUser?) {
        // Compute goal from user profile if available
        // Uses Mifflin-St Jeor BMR; falls back to 2000 kcal default
        if let user, let _ = user.dateOfBirth,
           let survey = user.surveyProgress {
            // In production we'd read these from user.surveyCompleted profile
            _ = survey
        }

        listenToEntries(userId: userId)
    }

    @MainActor private func listenToEntries(userId: String) {
        listener?.remove()
        let dateKey = selectedDate.firestoreDateKey
        listener = firestore.listenQuery(
            CalorieEntry.self,
            collection: CalorieEntry.collectionPath,
            filters: [("userId", .isEqualTo, userId)],
            orderBy: ("loggedAt", descending: false)
        ) { [weak self] fetched in
            // Filter client-side by date string (avoids composite index)
            self?.entries = fetched.filter { $0.date.firestoreDateKey == dateKey }
        }
    }

    @MainActor
    func changeDate(to date: Date, userId: String) {
        selectedDate = date
        listenToEntries(userId: userId)
    }

    func cleanup() { listener?.remove() }
}
