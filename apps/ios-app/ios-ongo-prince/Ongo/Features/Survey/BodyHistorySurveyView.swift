import SwiftUI

struct BodyHistorySurveyView: View {
    var onComplete: (() -> Void)? = nil
    @Environment(AppState.self) private var appState

    @State private var step = 1
    @State private var unitIsImperial = true

    // Step 1: Height & Weight
    @State private var heightFt = ""
    @State private var heightIn = ""
    @State private var heightCm = ""
    @State private var weightLbs = ""
    @State private var weightKg = ""

    // Step 2: Goal Weight
    @State private var goalWeight = ""

    // Step 4: Weight concern duration
    @State private var weightDuration: String? = nil

    // Step 5: Previous methods (multi-select)
    @State private var previousMethods: Set<String> = []

    private let totalSegments = 11

    var body: some View {
        ZStack(alignment: .top) {
            Color.ongoBackground.ignoresSafeArea()

            VStack(spacing: 0) {
                navBar
                segmentedProgress
                    .padding(.horizontal, OngoSpacing.lg)
                    .padding(.top, 6)
                    .padding(.bottom, 2)

                stepContent
            }
        }
        .dismissKeyboardOnTap()
        .animation(.easeInOut(duration: 0.25), value: step)
    }

    // MARK: - Nav bar

    private var navBar: some View {
        HStack {
            Button {
                if step > 1 {
                    withAnimation(.easeInOut) { step -= 1 }
                }
            } label: {
                Image(systemName: "chevron.left")
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(Color.ongoTextPrimary)
                    .frame(width: 36, height: 36)
                    .background(Color(white: 0.94))
                    .clipShape(Circle())
            }
            .opacity(step > 1 ? 1 : 0.4)
            .disabled(step == 1)

            Spacer()

            Text(sectionLabel)
                .font(.system(size: 12, weight: .bold))
                .foregroundStyle(Color.ongoPrimary)
                .tracking(1.5)

            Spacer()

            if step == 3 {
                Color.clear.frame(width: 36)
            } else {
                Button("Skip") {
                    withAnimation(.easeInOut(duration: 0.25)) { advance() }
                }
                .font(.system(size: 15, weight: .medium))
                .foregroundStyle(Color.ongoTextSecondary)
            }
        }
        .padding(.horizontal, OngoSpacing.lg)
        .padding(.top, OngoSpacing.sm)
        .padding(.bottom, OngoSpacing.xs)
    }

    private var sectionLabel: String { step <= 2 ? "BODY" : "HISTORY" }

    // MARK: - Progress bar

    private var segmentedProgress: some View {
        HStack(spacing: 4) {
            ForEach(0..<totalSegments, id: \.self) { i in
                Capsule()
                    .fill(i < progressFilled ? Color.ongoPrimary : Color(white: 0.84))
                    .frame(height: 4)
            }
        }
    }

    private var progressFilled: Int {
        switch step {
        case 1: return 2
        case 2: return 3
        case 3: return 3
        case 4: return 4
        case 5: return 5
        default: return 2
        }
    }

    // MARK: - Step routing

    @ViewBuilder
    private var stepContent: some View {
        switch step {
        case 1: heightWeightStep
        case 2: goalWeightStep
        case 3: historyIntroStep
        case 4: weightDurationStep
        case 5: previousMethodsStep
        default: EmptyView()
        }
    }

    // MARK: - Step 1: Height & Weight

    private var heightWeightStep: some View {
        ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: OngoSpacing.md) {
                surveyHeader(
                    eyebrow: "STEP 1 · ELIGIBILITY CHECK",
                    title: "Let's check if GLP-1 is right for you",
                    subtitle: "Your height and weight help us calculate your BMI — a key factor in eligibility."
                )

                unitToggle

                fieldSectionLabel("HEIGHT")
                if unitIsImperial {
                    HStack(spacing: 12) {
                        measureField(value: $heightFt, unit: "FT", placeholder: "5")
                        measureField(value: $heightIn, unit: "IN", placeholder: "9")
                    }
                } else {
                    measureField(value: $heightCm, unit: "CM", placeholder: "175")
                }

                fieldSectionLabel("WEIGHT")
                if unitIsImperial {
                    measureField(value: $weightLbs, unit: "LBS", placeholder: "200")
                } else {
                    measureField(value: $weightKg, unit: "KG", placeholder: "90")
                }
            }
            .padding(.horizontal, OngoSpacing.lg)
            .padding(.top, OngoSpacing.md)
            .padding(.bottom, 120)
        }
        .overlay(alignment: .bottom) { ctaBar }
    }

    // MARK: - Step 2: Goal Weight

    private var goalWeightStep: some View {
        ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: OngoSpacing.md) {
                surveyHeader(
                    eyebrow: "ALMOST DONE",
                    title: "What's your goal weight?",
                    subtitle: "No pressure — this is just a starting point. Your doctor will help refine it."
                )

                measureField(
                    value: $goalWeight,
                    unit: unitIsImperial ? "LBS" : "KG",
                    placeholder: "Goal weight"
                )
            }
            .padding(.horizontal, OngoSpacing.lg)
            .padding(.top, OngoSpacing.md)
            .padding(.bottom, 120)
        }
        .overlay(alignment: .bottom) { ctaBar }
    }

    // MARK: - Step 3: History Intro

    private var historyIntroStep: some View {
        VStack(spacing: 0) {
            ZStack {
                LinearGradient(
                    colors: [Color.ongoPrimary.opacity(0.10), Color.ongoPrimary.opacity(0.03)],
                    startPoint: .top, endPoint: .bottom
                )
                .clipShape(RoundedRectangle(cornerRadius: 24))

                VStack(spacing: OngoSpacing.xl) {
                    ZStack {
                        Circle()
                            .fill(Color.ongoPrimary)
                            .frame(width: 80, height: 80)
                        Image(systemName: "bolt.fill")
                            .font(.system(size: 30, weight: .bold))
                            .foregroundStyle(.white)
                    }

                    VStack(spacing: 12) {
                        Text("Now a few questions about your weight journey")
                            .font(.system(size: 28, weight: .heavy))
                            .foregroundStyle(Color.ongoTextPrimary)
                            .multilineTextAlignment(.center)
                            .fixedSize(horizontal: false, vertical: true)

                        Text("This helps your future doctor understand where you are today.")
                            .font(.system(size: 16))
                            .foregroundStyle(Color.ongoTextSecondary)
                            .multilineTextAlignment(.center)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                }
                .padding(.horizontal, OngoSpacing.lg)
                .padding(.vertical, 40)
            }
            .padding(.horizontal, OngoSpacing.lg)
            .padding(.top, OngoSpacing.xl)

            Spacer()

            Button {
                withAnimation(.easeInOut(duration: 0.25)) { advance() }
            } label: {
                HStack(spacing: 6) {
                    Text("Continue")
                        .font(.system(size: 17, weight: .semibold))
                    Text("→")
                        .font(.system(size: 17))
                }
                .foregroundStyle(.white)
                .frame(maxWidth: .infinity)
                .frame(height: 56)
                .background(Color.black)
                .clipShape(Capsule())
            }
            .padding(.horizontal, OngoSpacing.lg)
            .padding(.bottom, OngoSpacing.xxxl)
        }
    }

    // MARK: - Step 4: Weight Concern Duration

    private var weightDurationStep: some View {
        let options = [
            "Less than 1 year",
            "1–3 years",
            "3–5 years",
            "More than 5 years"
        ]
        return ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: OngoSpacing.md) {
                surveyHeader(
                    eyebrow: "WEIGHT HISTORY",
                    title: "How long has your weight been a concern for you?",
                    subtitle: nil
                )

                VStack(spacing: 10) {
                    ForEach(options, id: \.self) { option in
                        radioOption(label: option, isSelected: weightDuration == option) {
                            weightDuration = option
                        }
                    }
                }
            }
            .padding(.horizontal, OngoSpacing.lg)
            .padding(.top, OngoSpacing.md)
            .padding(.bottom, 120)
        }
        .overlay(alignment: .bottom) { ctaBar }
    }

    // MARK: - Step 5: Previous Methods

    private var previousMethodsStep: some View {
        let options = [
            "Tracking calories",
            "Weight loss programs",
            "Low-carb or keto diets",
            "Intermittent fasting",
            "Regular exercise",
            "Prescription medications",
            "Something else"
        ]
        return ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: OngoSpacing.md) {
                surveyHeader(
                    eyebrow: "WEIGHT HISTORY",
                    title: "What have you tried before to lose weight?",
                    subtitle: "Select all that apply."
                )

                VStack(spacing: 10) {
                    ForEach(options, id: \.self) { option in
                        checkboxOption(label: option, isSelected: previousMethods.contains(option)) {
                            if previousMethods.contains(option) {
                                previousMethods.remove(option)
                            } else {
                                previousMethods.insert(option)
                            }
                        }
                    }
                }
            }
            .padding(.horizontal, OngoSpacing.lg)
            .padding(.top, OngoSpacing.md)
            .padding(.bottom, 120)
        }
        .overlay(alignment: .bottom) { ctaBar }
    }

    // MARK: - CTA Bar

    private var ctaBar: some View {
        Button {
            withAnimation(.easeInOut(duration: 0.25)) { advance() }
        } label: {
            HStack(spacing: 6) {
                Text("Continue")
                    .font(.system(size: 16, weight: .semibold))
                Text("→")
                    .font(.system(size: 16))
            }
            .foregroundStyle(canAdvance ? .white : Color.ongoTextTertiary)
            .frame(maxWidth: .infinity)
            .frame(height: 56)
            .background(canAdvance ? Color.ongoPrimary : Color(white: 0.87))
            .clipShape(RoundedRectangle(cornerRadius: 16))
        }
        .disabled(!canAdvance)
        .padding(.horizontal, OngoSpacing.lg)
        .padding(.bottom, OngoSpacing.xxxl)
        .background(Color.ongoBackground)
    }

    private var canAdvance: Bool {
        switch step {
        case 1:
            return unitIsImperial
                ? !heightFt.isEmpty && !heightIn.isEmpty && !weightLbs.isEmpty
                : !heightCm.isEmpty && !weightKg.isEmpty
        case 2: return !goalWeight.isEmpty
        case 3: return true
        case 4: return weightDuration != nil
        case 5: return !previousMethods.isEmpty
        default: return false
        }
    }

    // MARK: - Advance / Save

    private func advance() {
        if step < 5 {
            step += 1
        } else {
            saveAndComplete()
        }
    }

    private func saveAndComplete() {
        Task { @MainActor in
            guard var user = appState.ongoUser else { return }

            var intake = OngoUser.MedicalIntake()
            if unitIsImperial {
                intake.heightFeet = Int(heightFt)
                intake.heightInches = Int(heightIn)
                intake.currentWeightLbs = Double(weightLbs)
                intake.goalWeightLbs = Double(goalWeight)
                let totalIn = (Int(heightFt) ?? 0) * 12 + (Int(heightIn) ?? 0)
                if totalIn > 0, let w = Double(weightLbs) {
                    intake.bmi = (w / Double(totalIn * totalIn)) * 703
                }
            } else {
                intake.heightCm = Double(heightCm)
                intake.currentWeightKg = Double(weightKg)
                intake.goalWeightKg = Double(goalWeight)
                if let cm = Double(heightCm), let kg = Double(weightKg), cm > 0 {
                    let m = cm / 100
                    intake.bmi = kg / (m * m)
                }
            }
            intake.weightConcernDuration = weightDuration
            intake.previousWeightMethods = Array(previousMethods)

            user.medicalIntake = intake
            appState.ongoUser = user
            try? await appState.firestore.saveUser(user)
            if let onComplete { onComplete() } else { withAnimation { appState.rootDestination = .main } }
        }
    }

    // MARK: - Subcomponents

    private func surveyHeader(eyebrow: String, title: String, subtitle: String?) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(eyebrow)
                .font(.system(size: 12, weight: .bold))
                .foregroundStyle(Color.ongoPrimary)
                .tracking(1.5)

            Text(title)
                .font(.system(size: 26, weight: .heavy))
                .foregroundStyle(Color.ongoTextPrimary)
                .fixedSize(horizontal: false, vertical: true)

            if let subtitle {
                Text(subtitle)
                    .font(.system(size: 15))
                    .foregroundStyle(Color.ongoTextSecondary)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
    }

    private var unitToggle: some View {
        HStack(spacing: 0) {
            unitPill(label: "Imperial (ft / lbs)", isSelected: unitIsImperial) {
                withAnimation(.easeInOut(duration: 0.2)) { unitIsImperial = true }
            }
            unitPill(label: "Metric (cm / kg)", isSelected: !unitIsImperial) {
                withAnimation(.easeInOut(duration: 0.2)) { unitIsImperial = false }
            }
        }
        .padding(4)
        .background(Color(white: 0.91))
        .clipShape(Capsule())
    }

    private func unitPill(label: String, isSelected: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(label)
                .font(.system(size: 14, weight: .semibold))
                .foregroundStyle(isSelected ? .white : Color.ongoTextSecondary)
                .padding(.horizontal, 14)
                .padding(.vertical, 9)
                .background(isSelected ? Color.black : Color.clear)
                .clipShape(Capsule())
        }
        .buttonStyle(.plain)
    }

    private func fieldSectionLabel(_ text: String) -> some View {
        Text(text)
            .font(.system(size: 12, weight: .bold))
            .foregroundStyle(Color.ongoPrimary)
            .tracking(1.5)
    }

    private func measureField(value: Binding<String>, unit: String, placeholder: String) -> some View {
        HStack {
            TextField(placeholder, text: value)
                .keyboardType(.decimalPad)
                .font(.system(size: 18))
                .foregroundStyle(Color.ongoTextPrimary)
            Spacer()
            Text(unit)
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(Color.ongoTextTertiary)
        }
        .padding(.horizontal, 16)
        .frame(height: 56)
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .stroke(!value.wrappedValue.isEmpty ? Color.ongoPrimary : Color(white: 0.88), lineWidth: 1.5)
        )
    }

    private func radioOption(label: String, isSelected: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: 14) {
                ZStack {
                    Circle()
                        .stroke(isSelected ? Color.ongoPrimary : Color(white: 0.80), lineWidth: 2)
                        .frame(width: 22, height: 22)
                    if isSelected {
                        Circle()
                            .fill(Color.ongoPrimary)
                            .frame(width: 12, height: 12)
                    }
                }
                Text(label)
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(Color.ongoTextPrimary)
                Spacer()
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 16)
            .background(Color.white)
            .clipShape(RoundedRectangle(cornerRadius: 14))
            .overlay(
                RoundedRectangle(cornerRadius: 14)
                    .stroke(isSelected ? Color.ongoPrimary : Color(white: 0.88), lineWidth: 1.5)
            )
        }
        .buttonStyle(.plain)
    }

    private func checkboxOption(label: String, isSelected: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: 14) {
                ZStack {
                    RoundedRectangle(cornerRadius: 5)
                        .stroke(isSelected ? Color.ongoPrimary : Color(white: 0.80), lineWidth: 2)
                        .frame(width: 22, height: 22)
                    if isSelected {
                        RoundedRectangle(cornerRadius: 5)
                            .fill(Color.ongoPrimary)
                            .frame(width: 22, height: 22)
                        Image(systemName: "checkmark")
                            .font(.system(size: 12, weight: .bold))
                            .foregroundStyle(.white)
                    }
                }
                Text(label)
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(Color.ongoTextPrimary)
                Spacer()
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 16)
            .background(Color.white)
            .clipShape(RoundedRectangle(cornerRadius: 14))
            .overlay(
                RoundedRectangle(cornerRadius: 14)
                    .stroke(isSelected ? Color.ongoPrimary : Color(white: 0.88), lineWidth: 1.5)
            )
        }
        .buttonStyle(.plain)
    }
}
