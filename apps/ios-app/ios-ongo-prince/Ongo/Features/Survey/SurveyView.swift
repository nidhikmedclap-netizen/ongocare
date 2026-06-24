import SwiftUI

struct SurveyView: View {
    @Environment(AppState.self) private var appState
    @State private var vm = SurveyViewModel()
    @State private var showResumePrompt = true
    @State private var showIntro = true
    @State private var showProfileSetup = false
    @State private var showBodySurvey = false
    @State private var showGLP1Survey = false
    @State private var showCheckout = false

    var body: some View {
        ZStack(alignment: .top) {
            Color.ongoBackground.ignoresSafeArea()

            if showIntro {
                surveyIntroView
            } else if showProfileSetup {
                ProfileSetupView(onComplete: {
                    withAnimation(.easeInOut(duration: 0.25)) {
                        showProfileSetup = false
                        showBodySurvey = true
                    }
                })
            } else if showBodySurvey {
                BodyHistorySurveyView(onComplete: {
                    withAnimation(.easeInOut(duration: 0.25)) {
                        showBodySurvey = false
                        showGLP1Survey = true
                    }
                })
            } else if showGLP1Survey {
                GLP1SurveyView(onComplete: {
                    withAnimation(.easeInOut(duration: 0.25)) {
                        showGLP1Survey = false
                        vm.startAtQuestion(id: "photo-id-upload")
                    }
                })
            } else {
                surveyContent
            }
        }
        .fullScreenCover(isPresented: $showCheckout) {
            SurveyCheckoutView(onComplete: {
                showCheckout = false
                Task { await completeSurvey() }
            })
        }
    }

    // MARK: - Intro screen

    private var surveyIntroView: some View {
        ZStack {
            Color.ongoPrimary.ignoresSafeArea()

            VStack(spacing: 0) {
                Spacer()

                VStack(spacing: OngoSpacing.xl) {
                    // Icon container (squircle)
                    ZStack {
                        RoundedRectangle(cornerRadius: 28)
                            .fill(Color.white.opacity(0.15))
                            .frame(width: 110, height: 110)
                        Image(systemName: "leaf.fill")
                            .font(.system(size: 44))
                            .foregroundStyle(.white)
                    }

                    VStack(spacing: OngoSpacing.md) {
                        Text("YOU'RE ALMOST THERE")
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundStyle(.white.opacity(0.75))
                            .tracking(2)

                        Text("Let's personalize\nyour care")
                            .font(.system(size: 34, weight: .heavy))
                            .foregroundStyle(.white)
                            .multilineTextAlignment(.center)

                        Text("A few quick details help your care team create a treatment plan built specifically for you. Takes less than 2 minutes.")
                            .font(.system(size: 16))
                            .foregroundStyle(.white.opacity(0.85))
                            .multilineTextAlignment(.center)
                            .lineSpacing(3)
                            .padding(.horizontal, OngoSpacing.lg)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                }

                Spacer()

                Button {
                    withAnimation(.easeInOut(duration: 0.3)) {
                        showIntro = false
                        showProfileSetup = true
                    }
                } label: {
                    HStack(spacing: 8) {
                        Text("Let's go")
                            .font(.system(size: 17, weight: .semibold))
                        Text("→")
                            .font(.system(size: 17))
                    }
                    .foregroundStyle(Color.ongoGreenDark)
                    .frame(maxWidth: .infinity)
                    .frame(height: 56)
                    .background(Color.white)
                    .clipShape(RoundedRectangle(cornerRadius: 16))
                }
                .padding(.horizontal, OngoSpacing.lg)
                .padding(.bottom, OngoSpacing.xxxl)
            }
        }
    }

    // MARK: - Survey content

    private var surveyContent: some View {
        VStack(spacing: 0) {
            topBar
            sectionProgressBar

            Group {
                if let q = vm.currentQuestion {
                    questionRenderer(q)
                        .id(q.id)   // force SwiftUI to create a new view on question change
                        .transition(.asymmetric(
                            insertion: .move(edge: .trailing).combined(with: .opacity),
                            removal: .move(edge: .leading).combined(with: .opacity)
                        ))
                }
            }
            .animation(.easeInOut(duration: 0.22), value: vm.currentQuestion?.id)

            if let q = vm.currentQuestion, q.type != .safetyExit && q.type != .crisis {
                ctaBar(for: q)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
        .background(Color.ongoBackground.ignoresSafeArea())
        .onAppear { setupSurvey() }
        .overlay(alignment: .top) {
            resumeBanner
        }
    }

    // MARK: - Top bar (back + section label + skip)
    private var topBar: some View {
        HStack {
            Button {
                withAnimation { vm.goBack() }
            } label: {
                Image(systemName: "chevron.left")
                    .font(.system(size: 17, weight: .semibold))
                    .foregroundStyle(Color.ongoTextPrimary)
            }
            .disabled(vm.history.isEmpty)
            .opacity(vm.history.isEmpty ? 0.3 : 1)

            Spacer()

            Text(vm.currentQuestion?.section.displayLabel.uppercased() ?? "")
                .ongoLabelStyle()

            Spacer()

            if vm.currentQuestion?.isRequired == false && vm.currentQuestion?.type != .celebrate {
                Button("Skip") {
                    withAnimation { vm.advance() }
                }
                .font(OngoFont.caption())
                .foregroundStyle(Color.ongoTextSecondary)
            } else {
                Color.clear.frame(width: 40, height: 20)
            }
        }
        .padding(.horizontal, OngoSpacing.lg)
        .padding(.top, OngoSpacing.sm)
        .padding(.bottom, OngoSpacing.xs)
    }

    // MARK: - Section progress segments
    private var sectionProgressBar: some View {
        HStack(spacing: 3) {
            ForEach(Array(SurveySection.allCases.enumerated()), id: \.element) { i, section in
                let sIdx = SurveySection.allCases.firstIndex(of: vm.currentQuestion?.section ?? .goals) ?? 0
                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        Capsule().fill(Color.ongoBorder)
                        Capsule()
                            .fill(Color.ongoPrimary)
                            .frame(width: i < sIdx ? geo.size.width
                                   : i == sIdx ? geo.size.width * vm.sectionProgress
                                   : 0)
                    }
                }
                .frame(height: 4)
                .animation(.spring(response: 0.4, dampingFraction: 0.85), value: vm.sectionProgress)
                .animation(.easeInOut, value: sIdx)
            }
        }
        .padding(.horizontal, OngoSpacing.lg)
        .padding(.bottom, OngoSpacing.sm)
    }

    // MARK: - Question renderer (routes by type)
    @ViewBuilder
    private func questionRenderer(_ q: SurveyQuestion) -> some View {
        if q.type == .celebrate {
            // Celebrate screens are non-scrolling and vertically centered
            VStack(spacing: 0) {
                Spacer(minLength: OngoSpacing.xl)
                VStack(alignment: .center, spacing: OngoSpacing.xl) {
                    questionHeader(q)
                    celebrateBody(q)
                }
                .padding(.horizontal, OngoSpacing.lg)
                .frame(maxWidth: .infinity)
                Spacer(minLength: OngoSpacing.xl)
            }
        } else {
            ScrollView {
                VStack(alignment: .leading, spacing: OngoSpacing.xl) {
                    questionHeader(q)

                    switch q.type {
                    case .singleSelect, .dropdown:
                        singleSelectBody(q)
                    case .multiSelect:
                        multiSelectBody(q)
                    case .text:
                        textBody(q)
                    case .number:
                        numberBody(q)
                    case .heightWeight:
                        heightWeightBody(q)
                    case .dateInput:
                        dateBody(q)
                    case .stressSlider:
                        stressSliderBody
                    case .celebrate:
                        EmptyView()
                    case .crisis:
                        crisisBody
                    case .safetyExit:
                        safetyExitBody
                    case .consent:
                        consentBody(q)
                    case .eligibilityRouting:
                        eligibilityRoutingBody(q)
                    case .profileForm:
                        SurveyProfileFormView(profile: $vm.profile)
                    case .medsAllergiesForm:
                        SurveyMedsFormView(profile: $vm.profile)
                    case .fileUpload:
                        fileUploadBody(q)
                    case .photoID:
                        photoIDBody
                    case .doseSelect:
                        doseSelectBody(q)
                    }
                }
                .padding(.horizontal, OngoSpacing.lg)
                .padding(.top, OngoSpacing.md)
                .padding(.bottom, 120)
            }
        }
    }

    private func questionHeader(_ q: SurveyQuestion) -> some View {
        VStack(alignment: .leading, spacing: OngoSpacing.xs) {
            if let eyebrow = q.eyebrow {
                Text(eyebrow)
                    .ongoLabelStyle()
            }
            Text(resolveHeadline(q))
                .ongoDisplayStyle(size: 28)
            if let sub = q.sub {
                Text(sub)
                    .font(OngoFont.body())
                    .foregroundStyle(Color.ongoTextSecondary)
            }
        }
    }

    private func resolveHeadline(_ q: SurveyQuestion) -> String {
        q.headline
            .replacingOccurrences(of: "{firstName}", with: vm.profile.firstName ?? "there")
            .replacingOccurrences(of: "{surgeryType}", with: surgeryTypeLabel(vm.profile.pastSurgeries))
    }

    private func surgeryTypeLabel(_ surgeries: [String]) -> String {
        let labels: [String: String] = [
            "lap-band": "lap band",
            "gastric-sleeve": "gastric sleeve",
            "gastric-bypass": "gastric bypass"
        ]
        if surgeries.count == 1, let name = labels[surgeries[0]] { return name }
        return "weight loss"
    }

    // MARK: - Single select
    private func singleSelectBody(_ q: SurveyQuestion) -> some View {
        VStack(spacing: OngoSpacing.xs) {
            ForEach(q.options) { opt in
                OngoOptionPill(
                    title: opt.label,
                    subtitle: opt.description,
                    isSelected: vm.currentSingleSelection == opt.id
                ) {
                    vm.currentSingleSelection = opt.id
                    // Auto-advance on single select after brief delay
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.25) {
                        if vm.canAdvance { withAnimation { vm.advance() } }
                    }
                }
            }
        }
    }

    // MARK: - Multi select
    private func multiSelectBody(_ q: SurveyQuestion) -> some View {
        VStack(spacing: OngoSpacing.xs) {
            ForEach(q.options) { opt in
                OngoCheckboxPill(
                    title: opt.label,
                    isSelected: vm.currentMultiSelection.contains(opt.id)
                ) {
                    if opt.isExclusive {
                        vm.currentMultiSelection = vm.currentMultiSelection.contains(opt.id) ? [] : [opt.id]
                    } else {
                        vm.currentMultiSelection.remove("none")
                        if vm.currentMultiSelection.contains(opt.id) {
                            vm.currentMultiSelection.remove(opt.id)
                        } else {
                            vm.currentMultiSelection.insert(opt.id)
                        }
                    }
                }
            }
        }
    }

    // MARK: - Text input
    private func textBody(_ q: SurveyQuestion) -> some View {
        VStack(spacing: OngoSpacing.xs) {
            let isEmail = q.id == "email"
            let placeholder = q.placeholder ?? (isEmail ? "you@email.com" : "Type here…")
            OngoTextField(
                placeholder: placeholder,
                text: $vm.currentTextInput,
                keyboardType: isEmail ? .emailAddress : .default
            )
        }
    }

    // MARK: - Number input
    private func numberBody(_ q: SurveyQuestion) -> some View {
        HStack {
            OngoTextField(placeholder: "e.g. 150", text: $vm.currentNumberInput, keyboardType: .numberPad)
            Text("lbs").font(OngoFont.subheadline()).foregroundStyle(Color.ongoTextSecondary).frame(width: 36)
        }
    }

    // MARK: - Height + Weight compound
    private func heightWeightBody(_ q: SurveyQuestion) -> some View {
        SurveyHeightWeightView(profile: $vm.profile)
    }

    // MARK: - Date picker
    private func dateBody(_ q: SurveyQuestion) -> some View {
        DatePicker(
            "Date",
            selection: Binding(
                get: { vm.currentDateInput ?? Date() },
                set: { vm.currentDateInput = $0 }
            ),
            in: ...Date(),
            displayedComponents: [.date]
        )
        .datePickerStyle(.graphical)
        .tint(Color.ongoPrimary)
        .onAppear { if vm.currentDateInput == nil { vm.currentDateInput = Date() } }
    }

    // MARK: - Stress slider (1–10)
    private var stressSliderBody: some View {
        VStack(spacing: OngoSpacing.md) {
            HStack {
                Text("😌").font(.system(size: 28))
                Slider(value: $vm.currentStressLevel, in: 1...10, step: 1)
                    .tint(Color.ongoOrange)
                Text("😰").font(.system(size: 28))
            }
            Text("\(Int(vm.currentStressLevel)) / 10")
                .font(.system(size: 48, weight: .heavy))
                .foregroundStyle(Color.ongoOrange)
                .frame(maxWidth: .infinity)
            Text(stressLabel(for: vm.currentStressLevel))
                .font(OngoFont.subheadline())
                .foregroundStyle(Color.ongoTextSecondary)
                .frame(maxWidth: .infinity)
        }
    }

    private func stressLabel(for level: Double) -> String {
        switch level {
        case 1...3: return "Low — pretty chill"
        case 4...5: return "Moderate — manageable"
        case 6...7: return "High — feeling it"
        case 8...9: return "Very high — running on fumes"
        default:    return "Extreme — burnout zone"
        }
    }

    // MARK: - Celebrate / transition
    private func celebrateBody(_ q: SurveyQuestion) -> some View {
        VStack(spacing: OngoSpacing.xl) {
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 64))
                .foregroundStyle(Color.ongoPrimary)
                .frame(maxWidth: .infinity)
            if let sub = q.sub {
                Text(sub)
                    .font(OngoFont.body())
                    .foregroundStyle(Color.ongoTextSecondary)
                    .multilineTextAlignment(.center)
                    .frame(maxWidth: .infinity)
            }
        }
        .padding(.top, OngoSpacing.lg)
    }

    // MARK: - Crisis (988) screen
    private var crisisBody: some View {
        VStack(spacing: OngoSpacing.lg) {
            Image(systemName: "heart.fill")
                .font(.system(size: 64))
                .foregroundStyle(Color.ongoError)
                .frame(maxWidth: .infinity)

            Text("It takes courage to share that. You're not alone.")
                .font(OngoFont.subheadline(18))
                .multilineTextAlignment(.center)
                .foregroundStyle(Color.ongoTextPrimary)

            Text("If you're in crisis, please reach out:")
                .font(OngoFont.body())
                .foregroundStyle(Color.ongoTextSecondary)
                .multilineTextAlignment(.center)

            Link(destination: URL(string: "tel://988")!) {
                HStack {
                    Image(systemName: "phone.fill")
                    Text("Call or text 988 — Suicide & Crisis Lifeline")
                        .font(OngoFont.subheadline())
                }
                .frame(maxWidth: .infinity)
                .frame(height: 56)
                .background(Color.ongoError)
                .foregroundStyle(.white)
                .clipShape(RoundedRectangle(cornerRadius: OngoRadius.xl))
            }

            OngoSecondaryButton(title: "I'm safe, continue") {
                withAnimation { vm.advance() }
            }
        }
        .padding(.top, OngoSpacing.xl)
    }

    // MARK: - Safety exit (hard stop)
    private var safetyExitBody: some View {
        VStack(spacing: OngoSpacing.lg) {
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.system(size: 64))
                .foregroundStyle(Color.ongoOrange)
                .frame(maxWidth: .infinity)

            Text("Based on your answers, GLP-1 medications aren't appropriate for you at this time due to a medical contraindication.")
                .font(OngoFont.body())
                .foregroundStyle(Color.ongoTextSecondary)
                .multilineTextAlignment(.center)

            Text("Your safety is our priority. Please consult with your primary care provider for alternatives.")
                .font(OngoFont.body())
                .foregroundStyle(Color.ongoTextSecondary)
                .multilineTextAlignment(.center)

            OngoSecondaryButton(title: "Return to home screen") {
                withAnimation { appState.signOut() }
            }
        }
        .padding(.top, OngoSpacing.xl)
    }

    // MARK: - Pregnancy consent
    private func consentBody(_ q: SurveyQuestion) -> some View {
        VStack(alignment: .leading, spacing: OngoSpacing.md) {
            OngoCard {
                VStack(alignment: .leading, spacing: OngoSpacing.xs) {
                    Label("Important Notice", systemImage: "exclamationmark.triangle")
                        .font(OngoFont.subheadline())
                        .foregroundStyle(Color.ongoOrange)
                    Text(q.sub ?? "GLP-1 medications are not recommended during pregnancy.")
                        .font(OngoFont.body())
                        .foregroundStyle(Color.ongoTextSecondary)
                }
            }
        }
    }

    // MARK: - Eligibility routing (success → booking handoff)
    private func eligibilityRoutingBody(_ q: SurveyQuestion) -> some View {
        VStack(spacing: OngoSpacing.xl) {
            OngoHeroCard {
                VStack(spacing: OngoSpacing.sm) {
                    Image(systemName: "checkmark.seal.fill")
                        .font(.system(size: 56))
                        .foregroundStyle(.white)
                    Text(resolveHeadline(q))
                        .font(OngoFont.headline(24))
                        .foregroundStyle(.white)
                    if let sub = q.sub {
                        Text(sub)
                            .font(OngoFont.body())
                            .foregroundStyle(.white.opacity(0.85))
                            .multilineTextAlignment(.center)
                    }
                }
            }
        }
        .padding(.top, OngoSpacing.md)
    }

    // MARK: - File upload (GLP-1 photo)
    private func fileUploadBody(_ q: SurveyQuestion) -> some View {
        VStack(spacing: OngoSpacing.md) {
            Image(systemName: "doc.badge.plus")
                .font(.system(size: 48))
                .foregroundStyle(Color.ongoPrimary.opacity(0.6))
            Text("Tap to upload a photo of your medication or prescription label")
                .font(OngoFont.body())
                .foregroundStyle(Color.ongoTextSecondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(OngoSpacing.xxl)
        .background(Color.ongoCardAlt)
        .clipShape(RoundedRectangle(cornerRadius: OngoRadius.md))
        .overlay(
            RoundedRectangle(cornerRadius: OngoRadius.md)
                .strokeBorder(style: StrokeStyle(lineWidth: 2, dash: [6]))
                .foregroundStyle(Color.ongoBorder)
        )
    }

    // MARK: - Photo ID upload
    private var photoIDBody: some View {
        VStack(spacing: OngoSpacing.lg) {
            // Dashed card
            VStack(spacing: OngoSpacing.lg) {
                // Icon
                ZStack {
                    RoundedRectangle(cornerRadius: 16)
                        .fill(Color.ongoPrimary.opacity(0.10))
                        .frame(width: 72, height: 72)
                    Image(systemName: "person.crop.rectangle.fill")
                        .font(.system(size: 28))
                        .foregroundStyle(Color.ongoPrimary)
                }

                // Bullets
                VStack(alignment: .leading, spacing: OngoSpacing.md) {
                    idBullet(icon: "checkmark.circle.fill", text: "Clearly shows your entire ID")
                    idBullet(icon: "checkmark.circle.fill", text: "Not cropped, blurry, or dark")
                    idBullet(icon: "lock.circle.fill",      text: "Only your healthcare team will see this")
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            .padding(OngoSpacing.xl)
            .frame(maxWidth: .infinity)
            .background(Color.white)
            .clipShape(RoundedRectangle(cornerRadius: OngoRadius.xl))
            .overlay(
                RoundedRectangle(cornerRadius: OngoRadius.xl)
                    .strokeBorder(style: StrokeStyle(lineWidth: 1.5, dash: [6]))
                    .foregroundStyle(Color.ongoBorder)
            )

            // Action buttons
            HStack(spacing: OngoSpacing.sm) {
                Button {
                    // PHPickerViewController integration
                } label: {
                    HStack(spacing: 6) {
                        Image(systemName: "folder")
                            .font(.system(size: 14, weight: .medium))
                        Text("Select photo")
                            .font(.system(size: 15, weight: .semibold))
                    }
                    .foregroundStyle(Color.ongoTextPrimary)
                    .frame(maxWidth: .infinity)
                    .frame(height: 52)
                    .background(Color.white)
                    .clipShape(Capsule())
                    .overlay(Capsule().strokeBorder(Color.ongoBorder, lineWidth: 1.5))
                }
                .buttonStyle(.plain)

                Button {
                    // UIImagePickerController camera integration
                } label: {
                    HStack(spacing: 6) {
                        Image(systemName: "camera.fill")
                            .font(.system(size: 14, weight: .medium))
                        Text("Take photo")
                            .font(.system(size: 15, weight: .semibold))
                    }
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .frame(height: 52)
                    .background(Color.black)
                    .clipShape(Capsule())
                }
                .buttonStyle(.plain)
            }
        }
    }

    private func idBullet(icon: String, text: String) -> some View {
        HStack(spacing: OngoSpacing.sm) {
            Image(systemName: icon)
                .font(.system(size: 20))
                .foregroundStyle(Color.ongoPrimary)
                .frame(width: 28)
            Text(text)
                .font(OngoFont.body())
                .foregroundStyle(Color.ongoTextPrimary)
        }
    }

    // MARK: - Dose select
    private func doseSelectBody(_ q: SurveyQuestion) -> some View {
        // Doses loaded from Firestore via MedicationConfig
        // Show placeholder until loaded; in a real impl this would use a @State var
        VStack(spacing: OngoSpacing.xs) {
            Text("Select your current dose of \(vm.profile.currentGlp1 ?? "medication")")
                .font(OngoFont.body())
                .foregroundStyle(Color.ongoTextSecondary)
            ForEach(placeholderDoses(for: vm.profile.currentGlp1), id: \.id) { dose in
                OngoOptionPill(
                    title: dose.label,
                    isSelected: vm.currentSingleSelection == dose.id
                ) { vm.currentSingleSelection = dose.id }
            }
        }
    }

    private func placeholderDoses(for medId: String?) -> [MedicationConfig.DoseOption] {
        // Returned from Firestore via MedicationConfig; hard-coded fallback for MVP
        switch medId {
        case "wegovy", "ozempic":
            return [
                .init(id: "0.25mg", value: "0.25mg", label: "0.25 mg / week (starting)", isStartingDose: true),
                .init(id: "0.5mg",  value: "0.5mg",  label: "0.5 mg / week", isStartingDose: false),
                .init(id: "1mg",    value: "1mg",    label: "1 mg / week", isStartingDose: false),
                .init(id: "1.7mg",  value: "1.7mg",  label: "1.7 mg / week", isStartingDose: false),
                .init(id: "2.4mg",  value: "2.4mg",  label: "2.4 mg / week (max)", isStartingDose: false)
            ]
        case "mounjaro", "zepbound":
            return [
                .init(id: "2.5mg", value: "2.5mg", label: "2.5 mg / week (starting)", isStartingDose: true),
                .init(id: "5mg",   value: "5mg",   label: "5 mg / week", isStartingDose: false),
                .init(id: "7.5mg", value: "7.5mg", label: "7.5 mg / week", isStartingDose: false),
                .init(id: "10mg",  value: "10mg",  label: "10 mg / week", isStartingDose: false),
                .init(id: "12.5mg",value: "12.5mg",label: "12.5 mg / week", isStartingDose: false),
                .init(id: "15mg",  value: "15mg",  label: "15 mg / week (max)", isStartingDose: false)
            ]
        default:
            return [.init(id: "other", value: "other", label: "Other / not listed", isStartingDose: false)]
        }
    }

    // MARK: - CTA Bar
    private func ctaBar(for q: SurveyQuestion) -> some View {
        VStack(spacing: 0) {
            Divider()
            VStack(spacing: OngoSpacing.xs) {
                if q.type == .eligibilityRouting {
                    OngoPrimaryButton(title: "Book my first appointment") {
                        showCheckout = true
                    }
                } else {
                    OngoPrimaryButton(
                        title: q.type == .celebrate ? "Let's go →" : "Continue",
                        isDisabled: !vm.canAdvance
                    ) {
                        withAnimation { vm.advance() }
                    }
                }
            }
            .padding(.horizontal, OngoSpacing.lg)
            .padding(.vertical, OngoSpacing.sm)
            .background(Color.ongoBackground)
        }
    }

    // MARK: - Resume banner (shown when survey progress exists)
    @ViewBuilder
    private var resumeBanner: some View {
        if showResumePrompt && (appState.ongoUser?.surveyProgress != nil) {
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text("Welcome back!")
                        .font(OngoFont.subheadline())
                        .foregroundStyle(Color.white)
                    Text("Picking up where you left off.")
                        .font(OngoFont.caption())
                        .foregroundStyle(.white.opacity(0.85))
                }
                Spacer()
                Button("OK") {
                    withAnimation { showResumePrompt = false }
                }
                .font(OngoFont.caption().bold())
                .foregroundStyle(.white)
            }
            .padding(OngoSpacing.sm)
            .background(Color.ongoPrimary)
            .clipShape(RoundedRectangle(cornerRadius: OngoRadius.md))
            .padding(OngoSpacing.sm)
            .transition(.move(edge: .top).combined(with: .opacity))
            .onAppear {
                DispatchQueue.main.asyncAfter(deadline: .now() + 4) {
                    withAnimation { showResumePrompt = false }
                }
            }
        }
    }

    // MARK: - Setup
    private func setupSurvey() {
        guard let userId = appState.ongoUser?.id else { return }
        vm.load(
            userId: userId,
            savedProgress: appState.ongoUser?.surveyProgress
        )
    }

    // MARK: - Complete survey
    private func completeSurvey() async {
        AnalyticsService.logSurveyCompleted()
        await appState.handleSurveyComplete(profile: vm.profile)
    }
}
