import SwiftUI

struct GLP1SurveyView: View {
    var onComplete: (() -> Void)? = nil
    @Environment(AppState.self) private var appState

    // Step navigation (1-8)
    @State private var step = 1

    // Step 2: Yes/No fork
    @State private var hasTakenGLP1: Bool? = nil

    // Step 3: Medication
    @State private var selectedMedication: String? = nil

    // Step 4: Dose
    @State private var selectedDose: String? = nil

    // Step 5: Experience
    @State private var selectedExperience: String? = nil

    // Step 6: Last injection date
    @State private var lastInjectionDate: Date? = nil
    @State private var showDatePicker = false

    // Step 7: Photo upload
    @State private var photoUploaded = false

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
        .animation(.easeInOut(duration: 0.25), value: step)
        .sheet(isPresented: $showDatePicker) { datePicker }
    }

    // MARK: - Nav bar

    private var navBar: some View {
        HStack {
            Button { goBack() } label: {
                Image(systemName: "chevron.left")
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(Color.ongoTextPrimary)
                    .frame(width: 36, height: 36)
                    .background(Color(white: 0.94))
                    .clipShape(Circle())
            }
            .opacity(step > 1 && step != 8 ? 1 : 0.4)
            .disabled(step == 1 || step == 8)

            Spacer()

            Text("GLP-1 HISTORY")
                .font(.system(size: 12, weight: .bold))
                .foregroundStyle(Color.ongoPrimary)
                .tracking(1.5)

            Spacer()

            if step == 6 || step == 7 {
                Button("Skip") {
                    withAnimation(.easeInOut(duration: 0.25)) { advance() }
                }
                .font(.system(size: 15, weight: .medium))
                .foregroundStyle(Color.ongoTextSecondary)
            } else {
                Color.clear.frame(width: 40)
            }
        }
        .padding(.horizontal, OngoSpacing.lg)
        .padding(.top, OngoSpacing.sm)
        .padding(.bottom, OngoSpacing.xs)
    }

    private func goBack() {
        let prev: Int
        switch step {
        case 8:
            prev = hasTakenGLP1 == true ? 7 : 2
        default:
            prev = max(1, step - 1)
        }
        withAnimation(.easeInOut) { step = prev }
    }

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
        case 1: return 5
        case 2: return 6
        case 3: return 7
        case 4: return 8
        case 5: return 9
        case 6: return 9
        case 7: return 10
        default: return 11
        }
    }

    // MARK: - Step routing

    @ViewBuilder
    private var stepContent: some View {
        switch step {
        case 1: introStep
        case 2: hasTakenStep
        case 3: medicationStep
        case 4: doseStep
        case 5: experienceStep
        case 6: lastDateStep
        case 7: photoStep
        default: thanksStep
        }
    }

    // MARK: - Step 1: Intro

    private var introStep: some View {
        VStack(spacing: 0) {
            VStack(spacing: OngoSpacing.xl) {
                ZStack {
                    Circle()
                        .fill(Color.ongoPrimary.opacity(0.12))
                        .frame(width: 80, height: 80)
                    Image(systemName: "syringe.fill")
                        .font(.system(size: 30, weight: .bold))
                        .foregroundStyle(Color.ongoPrimary)
                }

                VStack(spacing: 12) {
                    Text("Now a few questions about your GLP-1 history")
                        .font(.system(size: 28, weight: .heavy))
                        .foregroundStyle(Color.ongoTextPrimary)
                        .multilineTextAlignment(.center)
                        .fixedSize(horizontal: false, vertical: true)

                    Text("This helps your doctor understand your starting point and find the right treatment for you.")
                        .font(.system(size: 16))
                        .foregroundStyle(Color.ongoTextSecondary)
                        .multilineTextAlignment(.center)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
            .padding(.horizontal, OngoSpacing.lg)
            .padding(.vertical, 40)

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

    // MARK: - Step 2: Have you taken GLP-1?

    private var hasTakenStep: some View {
        ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: OngoSpacing.md) {
                surveyHeader(
                    eyebrow: "GLP-1 HISTORY",
                    title: "Have you taken any GLP-1 medications before, or are you currently taking one?",
                    subtitle: nil
                )

                VStack(spacing: 10) {
                    radioOption(label: "Yes, I have", isSelected: hasTakenGLP1 == true) {
                        hasTakenGLP1 = true
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.25) {
                            withAnimation(.easeInOut(duration: 0.25)) { step = 3 }
                        }
                    }
                    radioOption(label: "No, I haven't", isSelected: hasTakenGLP1 == false) {
                        hasTakenGLP1 = false
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.25) {
                            withAnimation(.easeInOut(duration: 0.25)) { step = 8 }
                        }
                    }
                }
            }
            .padding(.horizontal, OngoSpacing.lg)
            .padding(.top, OngoSpacing.md)
            .padding(.bottom, 120)
        }
    }

    // MARK: - Step 3: Medication

    private var medicationStep: some View {
        let medications: [(String, String)] = [
            ("wegovy",   "Wegovy"),
            ("ozempic",  "Ozempic"),
            ("rybelsus", "Rybelsus"),
            ("zepbound", "Zepbound"),
            ("mounjaro", "Mounjaro"),
            ("saxenda",  "Saxenda or Victoza"),
            ("other",    "Other"),
            ("not_sure", "I'm not sure"),
        ]
        return ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: OngoSpacing.md) {
                surveyHeader(
                    eyebrow: "GLP-1 HISTORY",
                    title: "Which GLP-1 medication?",
                    subtitle: "Select the one you've most recently taken or are currently taking."
                )

                VStack(spacing: 10) {
                    ForEach(medications, id: \.0) { id, label in
                        radioOption(label: label, isSelected: selectedMedication == id) {
                            selectedMedication = id
                            if id == "other" || id == "not_sure" { selectedDose = nil }
                            DispatchQueue.main.asyncAfter(deadline: .now() + 0.25) {
                                withAnimation(.easeInOut(duration: 0.25)) { advance() }
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

    // MARK: - Step 4: Dose

    private var doseStep: some View {
        let doses = doseOptions(for: selectedMedication)
        return ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: OngoSpacing.md) {
                surveyHeader(
                    eyebrow: "GLP-1 HISTORY",
                    title: "What dose are you taking?",
                    subtitle: "Or the last dose you took."
                )

                VStack(spacing: 10) {
                    ForEach(doses, id: \.0) { id, label in
                        radioOption(label: label, isSelected: selectedDose == id) {
                            selectedDose = id
                            DispatchQueue.main.asyncAfter(deadline: .now() + 0.25) {
                                withAnimation(.easeInOut(duration: 0.25)) { advance() }
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

    // MARK: - Step 5: Experience

    private var experienceStep: some View {
        let options: [(String, String)] = [
            ("very_positive",   "Very positive — great results"),
            ("mostly_positive", "Mostly positive — some side effects"),
            ("mixed",           "Mixed — it helped but had drawbacks"),
            ("mostly_negative", "Mostly negative — significant side effects"),
            ("stopped_early",   "I stopped taking it early"),
            ("still_taking",    "I'm currently still taking it"),
        ]
        return ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: OngoSpacing.md) {
                surveyHeader(
                    eyebrow: "GLP-1 HISTORY",
                    title: "How would you describe your experience?",
                    subtitle: nil
                )

                VStack(spacing: 10) {
                    ForEach(options, id: \.0) { id, label in
                        radioOption(label: label, isSelected: selectedExperience == id) {
                            selectedExperience = id
                            DispatchQueue.main.asyncAfter(deadline: .now() + 0.25) {
                                withAnimation(.easeInOut(duration: 0.25)) { advance() }
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

    // MARK: - Step 6: Last injection date

    private var lastDateStep: some View {
        ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: OngoSpacing.md) {
                surveyHeader(
                    eyebrow: "GLP-1 HISTORY",
                    title: "When was your last GLP-1 dose?",
                    subtitle: "Skip if you're not sure."
                )

                Button { showDatePicker = true } label: {
                    HStack {
                        Image(systemName: "calendar")
                            .foregroundStyle(Color.ongoPrimary)
                        Text(lastInjectionDate.map { dateLabel($0) } ?? "Select a date")
                            .foregroundStyle(lastInjectionDate != nil ? Color.ongoTextPrimary : Color.ongoTextTertiary)
                        Spacer()
                        Image(systemName: "chevron.right")
                            .font(.system(size: 13, weight: .medium))
                            .foregroundStyle(Color.ongoTextSecondary)
                    }
                    .font(.system(size: 16))
                    .padding(16)
                    .background(Color.white)
                    .clipShape(RoundedRectangle(cornerRadius: 14))
                    .overlay(
                        RoundedRectangle(cornerRadius: 14)
                            .stroke(
                                lastInjectionDate != nil ? Color.ongoPrimary : Color(white: 0.88),
                                lineWidth: 1.5
                            )
                    )
                }
                .buttonStyle(.plain)
            }
            .padding(.horizontal, OngoSpacing.lg)
            .padding(.top, OngoSpacing.md)
            .padding(.bottom, 120)
        }
        .overlay(alignment: .bottom) { ctaBar }
    }

    private var datePicker: some View {
        VStack(spacing: 0) {
            HStack {
                Text("Last dose date")
                    .font(.system(size: 17, weight: .semibold))
                Spacer()
                Button("Done") { showDatePicker = false }
                    .font(.system(size: 17, weight: .semibold))
                    .foregroundStyle(Color.ongoPrimary)
            }
            .padding(.horizontal, 20)
            .padding(.top, 20)
            .padding(.bottom, 8)

            DatePicker(
                "Last dose",
                selection: Binding(
                    get: { lastInjectionDate ?? Date() },
                    set: { lastInjectionDate = $0 }
                ),
                in: ...Date(),
                displayedComponents: [.date]
            )
            .datePickerStyle(.graphical)
            .tint(Color.ongoPrimary)
            .padding(.horizontal, 8)
        }
        .presentationDetents([.medium])
    }

    private func dateLabel(_ date: Date) -> String {
        let f = DateFormatter()
        f.dateStyle = .medium
        return f.string(from: date)
    }

    // MARK: - Step 7: Photo upload

    private var photoStep: some View {
        ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: OngoSpacing.md) {
                surveyHeader(
                    eyebrow: "GLP-1 HISTORY",
                    title: "Upload a photo of your medication",
                    subtitle: "Optional — helps your doctor see your exact prescription or medication label."
                )

                Button { photoUploaded = true } label: {
                    VStack(spacing: 12) {
                        Image(systemName: photoUploaded ? "checkmark.circle.fill" : "camera.fill")
                            .font(.system(size: 36))
                            .foregroundStyle(photoUploaded ? Color.ongoPrimary : Color.ongoPrimary.opacity(0.5))

                        Text(photoUploaded ? "Photo uploaded ✓" : "Tap to upload a photo")
                            .font(.system(size: 15, weight: .semibold))
                            .foregroundStyle(photoUploaded ? Color.ongoPrimary : Color.ongoTextSecondary)

                        if !photoUploaded {
                            Text("Medication or prescription label")
                                .font(.system(size: 13))
                                .foregroundStyle(Color.ongoTextTertiary)
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .padding(32)
                    .background(photoUploaded ? Color.ongoPrimary.opacity(0.06) : Color(white: 0.97))
                    .clipShape(RoundedRectangle(cornerRadius: 16))
                    .overlay(
                        RoundedRectangle(cornerRadius: 16)
                            .strokeBorder(
                                photoUploaded ? Color.ongoPrimary : Color(white: 0.84),
                                style: StrokeStyle(lineWidth: 1.5, dash: photoUploaded ? [] : [6])
                            )
                    )
                }
                .buttonStyle(.plain)
            }
            .padding(.horizontal, OngoSpacing.lg)
            .padding(.top, OngoSpacing.md)
            .padding(.bottom, 120)
        }
        .overlay(alignment: .bottom) { ctaBar }
    }

    // MARK: - Step 8: Thanks / closing

    private var thanksStep: some View {
        VStack(spacing: 0) {
            Spacer()

            VStack(spacing: OngoSpacing.lg) {
                Text("Thanks, \(appState.ongoUser?.firstName ?? "there")!")
                    .font(.system(size: 32, weight: .heavy))
                    .foregroundStyle(Color.ongoTextPrimary)
                    .multilineTextAlignment(.center)
                    .frame(maxWidth: .infinity)

                Text("A few more steps to verify your identity and health background — your doctor will use this to personalize your treatment.")
                    .font(.system(size: 16))
                    .foregroundStyle(Color.ongoTextSecondary)
                    .multilineTextAlignment(.center)
                    .lineSpacing(3)
                    .fixedSize(horizontal: false, vertical: true)
                    .frame(maxWidth: .infinity)
            }
            .padding(.horizontal, OngoSpacing.lg)

            Spacer()

            Button { finishSurvey() } label: {
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

    // MARK: - Shared CTA bar

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
        case 2: return hasTakenGLP1 != nil
        case 3: return selectedMedication != nil
        case 4: return selectedDose != nil
        case 5: return selectedExperience != nil
        default: return true
        }
    }

    // MARK: - Advance

    private func advance() {
        switch step {
        case 2:
            step = (hasTakenGLP1 == false) ? 8 : 3
        case 7:
            persistAndShowThanks()
        default:
            if step < 8 { step += 1 }
        }
    }

    // MARK: - Save & complete

    private func persistAndShowThanks() {
        Task { @MainActor in
            await persistHistory()
            withAnimation(.easeInOut(duration: 0.25)) { step = 8 }
        }
    }

    private func finishSurvey() {
        Task { @MainActor in
            if hasTakenGLP1 == false { await persistHistory() }
            if let onComplete { onComplete() }
            else { withAnimation { appState.rootDestination = .main } }
        }
    }

    private func persistHistory() async {
        guard var user = appState.ongoUser else { return }
        var history = OngoUser.GLP1History(hasTakenGLP1: hasTakenGLP1 ?? false)
        if hasTakenGLP1 == true {
            history.medication = selectedMedication
            history.dose = selectedDose
            history.experience = selectedExperience
            history.lastInjectionDate = lastInjectionDate
            history.photoUploaded = photoUploaded
        }
        user.glp1History = history
        appState.ongoUser = user
        try? await appState.firestore.saveUser(user)
    }

    // MARK: - Dose options per medication

    private func doseOptions(for medication: String?) -> [(String, String)] {
        switch medication {
        case "wegovy":
            return [
                ("0.25mg",   "0.25 mg (starting dose)"),
                ("0.5mg",    "0.5 mg"),
                ("1mg",      "1 mg"),
                ("1.7mg",    "1.7 mg"),
                ("2.4mg",    "2.4 mg (maximum dose)"),
                ("not_sure", "I'm not sure"),
            ]
        case "ozempic":
            return [
                ("0.25mg",   "0.25 mg"),
                ("0.5mg",    "0.5 mg"),
                ("1mg",      "1 mg"),
                ("2mg",      "2 mg"),
                ("not_sure", "I'm not sure"),
            ]
        case "rybelsus":
            return [
                ("3mg",      "3 mg"),
                ("7mg",      "7 mg"),
                ("14mg",     "14 mg"),
                ("not_sure", "I'm not sure"),
            ]
        case "zepbound", "mounjaro":
            return [
                ("2.5mg",    "2.5 mg"),
                ("5mg",      "5 mg"),
                ("7.5mg",    "7.5 mg"),
                ("10mg",     "10 mg"),
                ("12.5mg",   "12.5 mg"),
                ("15mg",     "15 mg"),
                ("not_sure", "I'm not sure"),
            ]
        case "saxenda":
            return [
                ("0.6mg",    "0.6 mg"),
                ("1.2mg",    "1.2 mg"),
                ("1.8mg",    "1.8 mg"),
                ("2.4mg",    "2.4 mg"),
                ("3mg",      "3 mg"),
                ("not_sure", "I'm not sure"),
            ]
        default:
            return [
                ("other",    "Other"),
                ("not_sure", "I'm not sure"),
            ]
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
}
