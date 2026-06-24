import SwiftUI

struct OnboardingQuizView: View {
    @Environment(AppState.self) private var appState
    @State private var step: QuizStep = .weightGoal
    @State private var selectedGoal: String? = nil
    @State private var selectedMotivations: Set<String> = []

    enum QuizStep: Int, CaseIterable {
        case weightGoal, motivations, celebrate
    }

    var body: some View {
        VStack(spacing: 0) {
            topBar
            segmentedProgress
                .padding(.horizontal, OngoSpacing.lg)
                .padding(.top, 6)
                .padding(.bottom, 2)

            switch step {
            case .weightGoal:  weightGoalView
            case .motivations: motivationsView
            case .celebrate:   celebrateView
            }
        }
        .background(Color.ongoBackground.ignoresSafeArea())
        .animation(.easeInOut(duration: 0.25), value: step)
    }

    // MARK: - Top bar

    private var topBar: some View {
        HStack {
            Button {
                if step == .weightGoal {
                    withAnimation { appState.rootDestination = .welcome }
                } else if let prev = QuizStep(rawValue: step.rawValue - 1) {
                    withAnimation(.easeInOut) { step = prev }
                }
            } label: {
                Image(systemName: "chevron.left")
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(Color.ongoTextPrimary)
                    .frame(width: 36, height: 36)
                    .background(Color.ongoCard)
                    .clipShape(Circle())
            }

            Spacer()

            Text("GOALS")
                .font(.system(size: 12, weight: .bold))
                .foregroundStyle(Color.ongoTextSecondary)
                .tracking(1.5)

            Spacer()

            if step != .celebrate {
                Button("Skip") {
                    withAnimation { appState.rootDestination = .welcome }
                }
                .font(.system(size: 15, weight: .medium))
                .foregroundStyle(Color.ongoTextSecondary)
            } else {
                Color.clear.frame(width: 36)
            }
        }
        .padding(.horizontal, OngoSpacing.lg)
        .padding(.top, OngoSpacing.sm)
        .padding(.bottom, OngoSpacing.xs)
    }

    // MARK: - Segmented progress bar

    private var segmentedProgress: some View {
        HStack(spacing: 4) {
            ForEach(0..<8, id: \.self) { i in
                Capsule()
                    .fill(i <= step.rawValue ? Color.ongoPrimary : Color.ongoBorder)
                    .frame(height: 4)
            }
        }
    }

    // MARK: - Step 1: Weight goal

    private var weightGoalView: some View {
        ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: OngoSpacing.md) {
                Text("2 MINUTE QUIZ")
                    .font(.system(size: 12, weight: .bold))
                    .foregroundStyle(Color.ongoPrimary)
                    .tracking(1.5)

                Text("How much weight would you like to lose?")
                    .font(.system(size: 26, weight: .heavy))
                    .foregroundStyle(Color.ongoTextPrimary)
                    .fixedSize(horizontal: false, vertical: true)

                VStack(spacing: 10) {
                    ForEach(weightGoalOptions, id: \.value) { opt in
                        radioOptionCard(
                            title: opt.label,
                            desc: opt.desc,
                            isSelected: selectedGoal == opt.value
                        ) { selectedGoal = opt.value }
                    }
                }
            }
            .padding(.horizontal, OngoSpacing.lg)
            .padding(.top, OngoSpacing.lg)
            .padding(.bottom, 120)
        }
        .overlay(alignment: .bottom) {
            ctaButton(title: "Continue", isDisabled: selectedGoal == nil) {
                withAnimation(.easeInOut(duration: 0.25)) { step = .motivations }
            }
        }
    }

    // MARK: - Step 2: Motivations

    private var motivationsView: some View {
        ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: OngoSpacing.md) {
                Text("ALMOST THERE")
                    .font(.system(size: 12, weight: .bold))
                    .foregroundStyle(Color.ongoPrimary)
                    .tracking(1.5)

                Text("What's driving you right now?")
                    .font(.system(size: 26, weight: .heavy))
                    .foregroundStyle(Color.ongoTextPrimary)

                Text("Tell us what matters most so we can tailor your plan. Select all that apply.")
                    .font(.system(size: 15))
                    .foregroundStyle(Color.ongoTextSecondary)
                    .fixedSize(horizontal: false, vertical: true)

                VStack(spacing: 10) {
                    ForEach(motivationOptions, id: \.value) { opt in
                        checkboxOptionCard(
                            title: opt.label,
                            isSelected: selectedMotivations.contains(opt.value)
                        ) {
                            if selectedMotivations.contains(opt.value) {
                                selectedMotivations.remove(opt.value)
                            } else {
                                selectedMotivations.insert(opt.value)
                            }
                        }
                    }
                }
            }
            .padding(.horizontal, OngoSpacing.lg)
            .padding(.top, OngoSpacing.lg)
            .padding(.bottom, 120)
        }
        .overlay(alignment: .bottom) {
            ctaButton(title: "Continue", isDisabled: selectedMotivations.isEmpty) {
                withAnimation(.easeInOut(duration: 0.25)) { step = .celebrate }
            }
        }
    }

    // MARK: - Step 3: Celebrate

    private var celebrateView: some View {
        VStack(spacing: 0) {
            Spacer()

            VStack(spacing: OngoSpacing.xl) {
                ZStack {
                    Circle()
                        .fill(Color.ongoPrimary.opacity(0.85))
                        .frame(width: 88, height: 88)
                    Image(systemName: "bolt.fill")
                        .font(.system(size: 36, weight: .bold))
                        .foregroundStyle(.white)
                }

                VStack(spacing: OngoSpacing.sm) {
                    Text("Great start!")
                        .font(.system(size: 30, weight: .heavy))
                        .foregroundStyle(Color.ongoTextPrimary)

                    Text("Your answers help us tailor your plan. Just a few more questions to personalize everything for you.")
                        .font(.system(size: 16))
                        .foregroundStyle(Color.ongoTextSecondary)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, OngoSpacing.xl)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }

            Spacer()

            Button {
                let answers = OngoUser.QuizAnswers(
                    weightLossGoal: selectedGoal,
                    currentWeight: nil,
                    heightFeet: nil,
                    heightInches: nil,
                    bmi: nil,
                    capturedAt: Date()
                )
                appState.pendingQuizAnswers = answers
                withAnimation { appState.rootDestination = .auth(mode: .signUp) }
            } label: {
                HStack(spacing: OngoSpacing.xs) {
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

    // MARK: - Option cards

    private func radioOptionCard(title: String, desc: String, isSelected: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: OngoSpacing.md) {
                ZStack {
                    Circle()
                        .stroke(isSelected ? Color.ongoPrimary : Color.ongoBorder, lineWidth: 2)
                        .frame(width: 22, height: 22)
                    if isSelected {
                        Circle()
                            .fill(Color.ongoPrimary)
                            .frame(width: 12, height: 12)
                    }
                }
                VStack(alignment: .leading, spacing: 3) {
                    Text(title)
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundStyle(Color.ongoTextPrimary)
                    Text(desc)
                        .font(.system(size: 14))
                        .foregroundStyle(Color.ongoTextSecondary)
                        .fixedSize(horizontal: false, vertical: true)
                }
                Spacer()
            }
            .padding(OngoSpacing.md)
            .background(Color.white)
            .clipShape(RoundedRectangle(cornerRadius: OngoRadius.md))
            .overlay(
                RoundedRectangle(cornerRadius: OngoRadius.md)
                    .stroke(isSelected ? Color.ongoPrimary : Color.clear, lineWidth: 1.5)
            )
        }
        .buttonStyle(.plain)
    }

    private func checkboxOptionCard(title: String, isSelected: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: OngoSpacing.md) {
                ZStack {
                    RoundedRectangle(cornerRadius: 5)
                        .stroke(isSelected ? Color.ongoPrimary : Color.ongoBorder, lineWidth: 2)
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
                Text(title)
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(Color.ongoTextPrimary)
                Spacer()
            }
            .padding(OngoSpacing.md)
            .background(Color.white)
            .clipShape(RoundedRectangle(cornerRadius: OngoRadius.md))
            .overlay(
                RoundedRectangle(cornerRadius: OngoRadius.md)
                    .stroke(isSelected ? Color.ongoPrimary : Color.clear, lineWidth: 1.5)
            )
        }
        .buttonStyle(.plain)
    }

    // MARK: - CTA button

    private func ctaButton(title: String, isDisabled: Bool, action: @escaping () -> Void) -> some View {
        VStack(spacing: 0) {
            Divider()
            Button(action: action) {
                Text(title)
                    .font(.system(size: 17, weight: .semibold))
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .frame(height: 56)
                    .background(isDisabled ? Color(white: 0.82) : Color.ongoPrimary)
                    .clipShape(Capsule())
            }
            .disabled(isDisabled)
            .padding(.horizontal, OngoSpacing.lg)
            .padding(.vertical, OngoSpacing.sm)
            .background(Color.ongoBackground)
        }
    }

    // MARK: - Data

    private let weightGoalOptions = [
        (value: "1-15",   label: "1–15 lbs",       desc: "Slim down. Tone up. Stay on track."),
        (value: "16-50",  label: "16–50 lbs",       desc: "Lose weight & keep it off — no more yo-yo cycles."),
        (value: "50+",    label: "50+ lbs",          desc: "Bigger goal? We'll match you with the right plan."),
        (value: "unsure", label: "I'm not sure yet", desc: "That's okay — we'll help you figure it out.")
    ]

    private let motivationOptions = [
        (value: "confident",  label: "I want to feel more confident"),
        (value: "energy",     label: "I want more energy"),
        (value: "health",     label: "I want to improve my overall health"),
        (value: "cravings",   label: "I want fewer cravings"),
        (value: "diabetes",   label: "I want to reduce my risk of diabetes"),
        (value: "labs",       label: "I want better health results (labs)"),
        (value: "day-to-day", label: "I want to feel better day to day")
    ]
}
