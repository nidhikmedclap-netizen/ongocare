import SwiftUI

// Matches prototype #mpOverlay — AI meal plan (beta waitlist per Q5)
struct MealPlanView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var step: PlanStep = .preferences
    @State private var calorieGoal: String = ""
    @State private var dietaryPrefs: Set<String> = []
    @State private var hasJoinedBeta: Bool = false

    enum PlanStep { case preferences, result }

    private let preferences = [
        "Low carb", "High protein", "Mediterranean",
        "Keto", "Vegan", "Vegetarian", "Dairy-free", "Gluten-free"
    ]

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                if step == .preferences {
                    prefsStep
                } else {
                    betaStep
                }
            }
            .background(Color.ongoBackground)
            .navigationTitle("Meal Plan AI")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button { dismiss() } label: {
                        Image(systemName: "xmark").foregroundStyle(Color.ongoTextSecondary)
                    }
                }
            }
        }
    }

    // MARK: - Preferences step
    private var prefsStep: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: OngoSpacing.lg) {
                VStack(alignment: .leading, spacing: OngoSpacing.xs) {
                    Text("Daily calorie target").ongoLabelStyle()
                    HStack {
                        OngoTextField(placeholder: "e.g. 1800", text: $calorieGoal, keyboardType: .numberPad)
                        Text("kcal").font(OngoFont.subheadline()).foregroundStyle(Color.ongoTextSecondary).frame(width: 36)
                    }
                }

                VStack(alignment: .leading, spacing: OngoSpacing.xs) {
                    Text("Dietary preferences").ongoLabelStyle()
                    FlowLayout(spacing: OngoSpacing.xs) {
                        ForEach(preferences, id: \.self) { pref in
                            Button {
                                withAnimation {
                                    if dietaryPrefs.contains(pref) { dietaryPrefs.remove(pref) }
                                    else { dietaryPrefs.insert(pref) }
                                }
                            } label: {
                                Text(pref)
                                    .font(OngoFont.subheadline(13))
                                    .foregroundStyle(dietaryPrefs.contains(pref) ? .white : Color.ongoPrimary)
                                    .padding(.horizontal, OngoSpacing.sm)
                                    .padding(.vertical, 6)
                                    .background(dietaryPrefs.contains(pref) ? Color.ongoPrimary : Color.ongoGreenMuted)
                                    .clipShape(Capsule())
                            }
                        }
                    }
                }

                OngoPrimaryButton(title: "Generate my plan") {
                    withAnimation { step = .result }
                }
            }
            .padding(OngoSpacing.lg)
        }
    }

    // MARK: - Result / beta waitlist step
    private var betaStep: some View {
        VStack(spacing: OngoSpacing.xl) {
            Spacer()
            Image(systemName: "sparkles")
                .font(.system(size: 56))
                .foregroundStyle(Color.ongoOrange)

            Text("Meal Plan AI")
                .font(OngoFont.headline(26))

            Text("We're building a GPT-4–powered meal plan engine tailored to your GLP-1 goals, calorie targets, and food preferences.")
                .font(OngoFont.body())
                .foregroundStyle(Color.ongoTextSecondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, OngoSpacing.xl)

            if hasJoinedBeta {
                VStack(spacing: OngoSpacing.xs) {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: 36))
                        .foregroundStyle(Color.ongoSuccess)
                    Text("You're on the list!")
                        .font(OngoFont.headline(20))
                    Text("We'll email you the moment Meal Plan AI goes live.")
                        .font(OngoFont.body())
                        .foregroundStyle(Color.ongoTextSecondary)
                        .multilineTextAlignment(.center)
                }
                .transition(.scale.combined(with: .opacity))
            } else {
                OngoPrimaryButton(title: "Request early access") {
                    AnalyticsService.logAIBetaWaitlistJoined(feature: "meal_plan")
                    withAnimation { hasJoinedBeta = true }
                }
                .padding(.horizontal, OngoSpacing.lg)
            }

            Spacer()
        }
    }
}
