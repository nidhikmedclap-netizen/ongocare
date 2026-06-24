import SwiftUI

// Matches prototype #lmOverlay — 3-step: manual / photo / confirm
struct LogMealSheet: View {
    let userId: String
    let onSave: (CalorieEntry) -> Void
    @Environment(\.dismiss) private var dismiss

    @State private var step: LogStep = .manual
    @State private var foodName: String = ""
    @State private var calories: String = ""
    @State private var protein: String = ""
    @State private var carbs: String = ""
    @State private var fat: String = ""
    @State private var servingSize: String = ""
    @State private var selectedCategory: CalorieEntry.MealCategory = .breakfast
    @State private var isLoading: Bool = false

    enum LogStep { case manual, photo, confirm }

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Step indicator
                stepIndicator

                Divider()

                switch step {
                case .manual:  manualStep
                case .photo:   photoStep
                case .confirm: confirmStep
                }
            }
            .background(Color.ongoBackground)
            .navigationTitle("Log Meal")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") { dismiss() }
                        .foregroundStyle(Color.ongoTextSecondary)
                }
            }
        }
    }

    // MARK: - Step indicator
    private var stepIndicator: some View {
        HStack(spacing: 0) {
            ForEach(Array([LogStep.manual, .photo, .confirm].enumerated()), id: \.offset) { i, s in
                HStack(spacing: 0) {
                    VStack(spacing: 2) {
                        ZStack {
                            Circle()
                                .fill(s == step ? Color.ongoPrimary : Color.ongoBorder)
                                .frame(width: 28, height: 28)
                            Text("\(i + 1)")
                                .font(OngoFont.label())
                                .foregroundStyle(s == step ? .white : Color.ongoTextSecondary)
                        }
                        Text(stepLabel(s))
                            .font(OngoFont.label(9))
                            .foregroundStyle(s == step ? Color.ongoPrimary : Color.ongoTextTertiary)
                    }
                    if i < 2 {
                        Rectangle()
                            .fill(Color.ongoBorder)
                            .frame(height: 1)
                            .frame(maxWidth: .infinity)
                            .padding(.bottom, 14)
                    }
                }
            }
        }
        .padding(.horizontal, OngoSpacing.xl)
        .padding(.vertical, OngoSpacing.sm)
    }

    private func stepLabel(_ s: LogStep) -> String {
        switch s {
        case .manual:  return "Search"
        case .photo:   return "Photo"
        case .confirm: return "Confirm"
        }
    }

    // MARK: - Manual search step
    private var manualStep: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: OngoSpacing.md) {
                Text("What did you eat?").ongoLabelStyle()
                OngoTextField(placeholder: "e.g. Grilled chicken breast", text: $foodName)

                Text("Serving size (optional)").ongoLabelStyle()
                OngoTextField(placeholder: "e.g. 200g", text: $servingSize)

                Text("Meal type").ongoLabelStyle()
                HStack {
                    ForEach(CalorieEntry.MealCategory.allCases, id: \.self) { cat in
                        Button {
                            withAnimation { selectedCategory = cat }
                        } label: {
                            Text(cat.displayName)
                                .font(OngoFont.label(11))
                                .foregroundStyle(selectedCategory == cat ? .white : Color.ongoPrimary)
                                .padding(.horizontal, OngoSpacing.xs)
                                .padding(.vertical, 6)
                                .background(selectedCategory == cat ? Color.ongoPrimary : Color.ongoGreenMuted)
                                .clipShape(Capsule())
                        }
                    }
                }

                Text("Nutrition").ongoLabelStyle()
                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: OngoSpacing.xs) {
                    nutritionField("Calories (kcal)", binding: $calories, keyboardType: .numberPad)
                    nutritionField("Protein (g)", binding: $protein, keyboardType: .decimalPad)
                    nutritionField("Carbs (g)", binding: $carbs, keyboardType: .decimalPad)
                    nutritionField("Fat (g)", binding: $fat, keyboardType: .decimalPad)
                }

                OngoPrimaryButton(
                    title: "Review →",
                    isDisabled: foodName.isEmpty || calories.isEmpty
                ) {
                    withAnimation { step = .confirm }
                }

                OngoSecondaryButton(title: "Use camera instead") {
                    withAnimation { step = .photo }
                }
            }
            .padding(OngoSpacing.lg)
        }
    }

    private func nutritionField(_ label: String, binding: Binding<String>, keyboardType: UIKeyboardType) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label).font(OngoFont.caption(11)).foregroundStyle(Color.ongoTextSecondary)
            OngoTextField(placeholder: "0", text: binding, keyboardType: keyboardType)
        }
    }

    // MARK: - Photo step (AI beta waitlist)
    private var photoStep: some View {
        VStack(spacing: OngoSpacing.xl) {
            Spacer()
            Image(systemName: "camera.viewfinder")
                .font(.system(size: 64))
                .foregroundStyle(Color.ongoPrimary.opacity(0.5))
            Text("Snap Meal AI")
                .font(OngoFont.headline(22))
            Text("Take a photo of your meal and our AI will estimate the calories and macros automatically.")
                .font(OngoFont.body())
                .foregroundStyle(Color.ongoTextSecondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, OngoSpacing.xl)

            OngoCard {
                VStack(spacing: OngoSpacing.xs) {
                    OngoTagPill(label: "Beta — Coming Soon", color: Color.ongoOrange, style: .tinted)
                        .frame(maxWidth: .infinity)
                    Text("Join the waitlist and we'll email you when Snap Meal launches.")
                        .font(OngoFont.caption())
                        .foregroundStyle(Color.ongoTextSecondary)
                        .multilineTextAlignment(.center)
                    OngoPrimaryButton(title: "Join AI Beta") {
                        AnalyticsService.logAIBetaWaitlistJoined(feature: "snap_meal")
                        withAnimation { step = .manual }
                    }
                }
            }
            .padding(.horizontal, OngoSpacing.lg)

            OngoSecondaryButton(title: "Enter manually instead") {
                withAnimation { step = .manual }
            }
            .padding(.horizontal, OngoSpacing.lg)

            Spacer()
        }
    }

    // MARK: - Confirm step
    private var confirmStep: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: OngoSpacing.md) {
                Text("Review and save").ongoLabelStyle()

                OngoCard {
                    VStack(spacing: OngoSpacing.sm) {
                        confirmRow(label: "Food", value: foodName)
                        if !servingSize.isEmpty { confirmRow(label: "Serving", value: servingSize) }
                        confirmRow(label: "Meal", value: selectedCategory.displayName)
                        Divider()
                        confirmRow(label: "Calories", value: "\(calories) kcal")
                        confirmRow(label: "Protein", value: "\(protein)g")
                        confirmRow(label: "Carbs", value: "\(carbs)g")
                        confirmRow(label: "Fat", value: "\(fat)g")
                    }
                }

                OngoPrimaryButton(title: "Save meal", isLoading: isLoading) { save() }

                OngoSecondaryButton(title: "← Edit") {
                    withAnimation { step = .manual }
                }
            }
            .padding(OngoSpacing.lg)
        }
    }

    private func confirmRow(label: String, value: String) -> some View {
        HStack {
            Text(label).font(OngoFont.body()).foregroundStyle(Color.ongoTextSecondary)
            Spacer()
            Text(value).font(OngoFont.subheadline()).foregroundStyle(Color.ongoTextPrimary)
        }
    }

    // MARK: - Save
    private func save() {
        guard !userId.isEmpty else { return }
        isLoading = true
        let entry = CalorieEntry(
            userId: userId,
            date: Date().midnightUTC,
            mealCategory: selectedCategory,
            foodName: foodName,
            calories: Int(calories) ?? 0,
            protein: Double(protein) ?? 0,
            carbs: Double(carbs) ?? 0,
            fat: Double(fat) ?? 0,
            servingSize: servingSize.isEmpty ? nil : servingSize,
            loggedAt: Date(),
            source: .manual
        )
        Task {
            _ = try? await FirestoreService.shared.add(entry, collection: CalorieEntry.collectionPath)
            await MainActor.run {
                onSave(entry)
                dismiss()
            }
        }
    }
}
