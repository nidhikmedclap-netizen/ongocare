import SwiftUI

// Matches prototype #profilePage — read-only profile with 5 expandable sections
struct MyProfileView: View {
    @Environment(AppState.self) private var appState
    @State private var expandedSection: ProfileSection? = nil

    enum ProfileSection: String, CaseIterable {
        case personal     = "Personal info"
        case body         = "Body & goals"
        case medical      = "Medical info"
        case lifestyle    = "Lifestyle"
        case verification = "Verification"

        var icon: String {
            switch self {
            case .personal:     return "person"
            case .body:         return "scalemass"
            case .medical:      return "cross.case"
            case .lifestyle:    return "clock"
            case .verification: return "person.text.rectangle"
            }
        }
    }

    private var user: OngoUser? { appState.ongoUser }
    private var sp: SurveyProfile? { user?.surveyProfile }

    // MARK: - Body

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(spacing: OngoSpacing.md) {
                heroCard
                actionButtons
                ForEach(ProfileSection.allCases, id: \.self) { section in
                    accordionCard(section)
                }
            }
            .padding(.horizontal, OngoSpacing.md)
            .padding(.vertical, OngoSpacing.md)
            .padding(.bottom, 100)
        }
        .background(Color.ongoBackground)
        .navigationTitle("My Profile")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button("Edit") { }
                    .font(OngoFont.subheadline())
                    .foregroundStyle(Color.ongoPrimary)
            }
        }
    }

    // MARK: - Hero card

    private var heroCard: some View {
        ZStack(alignment: .topLeading) {
            RoundedRectangle(cornerRadius: OngoRadius.lg)
                .fill(Color.ongoPrimary)

            VStack(alignment: .leading, spacing: OngoSpacing.sm) {
                HStack(spacing: OngoSpacing.md) {
                    // Avatar
                    ZStack {
                        Circle()
                            .fill(Color.white.opacity(0.25))
                            .frame(width: 72, height: 72)
                        Text(user?.initials ?? "?")
                            .font(.system(size: 28, weight: .bold))
                            .foregroundStyle(.white)
                    }

                    VStack(alignment: .leading, spacing: 4) {
                        Text(user?.displayName ?? "")
                            .font(.system(size: 22, weight: .bold))
                            .foregroundStyle(.white)

                        Text(heroSubtitle)
                            .font(OngoFont.body())
                            .foregroundStyle(.white.opacity(0.85))
                    }
                }

                if user?.glp1Eligible == true {
                    HStack(spacing: 6) {
                        Image(systemName: "checkmark")
                            .font(.system(size: 11, weight: .bold))
                        Text("GLP-1 ELIGIBLE")
                            .font(.system(size: 12, weight: .bold))
                            .tracking(0.5)
                    }
                    .foregroundStyle(.white)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 6)
                    .background(.white.opacity(0.2))
                    .clipShape(Capsule())
                }
            }
            .padding(OngoSpacing.lg)
        }
    }

    private var heroSubtitle: String {
        var parts: [String] = []
        if let e = sp?.ethnicity, let label = optionLabel(for: "ethnicity", id: e) { parts.append(label) }
        if let dob = user?.dateOfBirth ?? sp?.dateOfBirth {
            let years = Calendar.current.dateComponents([.year], from: dob, to: Date()).year ?? 0
            parts.append("\(years) y/o")
        }
        if let zip = user?.zipCode, !zip.isEmpty { parts.append(zip) }
        return parts.joined(separator: " · ")
    }

    // MARK: - Action buttons

    private var actionButtons: some View {
        HStack(spacing: OngoSpacing.sm) {
            NavigationLink(destination: TrackerCalendarView(userId: user?.id ?? "")) {
                Label("Weight tracker", systemImage: "scalemass")
                    .font(OngoFont.subheadline(14))
                    .foregroundStyle(Color.ongoTextPrimary)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 13)
                    .background(Color.ongoCard)
                    .clipShape(RoundedRectangle(cornerRadius: OngoRadius.md))
                    .overlay(RoundedRectangle(cornerRadius: OngoRadius.md).stroke(Color.ongoBorder, lineWidth: 1))
            }

            NavigationLink(destination: SubscriptionsView(userId: user?.id ?? "")) {
                Label("Subscriptions", systemImage: "creditcard")
                    .font(OngoFont.subheadline(14))
                    .foregroundStyle(Color.ongoPrimary)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 13)
                    .background(Color.ongoCard)
                    .clipShape(RoundedRectangle(cornerRadius: OngoRadius.md))
                    .overlay(RoundedRectangle(cornerRadius: OngoRadius.md).stroke(Color.ongoPrimary, lineWidth: 1.5))
            }
        }
    }

    // MARK: - Accordion

    private func accordionCard(_ section: ProfileSection) -> some View {
        OngoCard {
            VStack(spacing: 0) {
                Button {
                    withAnimation(.spring(response: 0.35)) {
                        expandedSection = expandedSection == section ? nil : section
                    }
                } label: {
                    HStack(spacing: OngoSpacing.sm) {
                        sectionIcon(section.icon)
                        Text(section.rawValue)
                            .font(OngoFont.subheadline())
                            .foregroundStyle(Color.ongoTextPrimary)
                        Spacer()
                        Image(systemName: expandedSection == section ? "chevron.up" : "chevron.down")
                            .font(.system(size: 13))
                            .foregroundStyle(Color.ongoTextTertiary)
                    }
                }
                .buttonStyle(.plain)

                if expandedSection == section {
                    Divider().padding(.top, OngoSpacing.sm)
                    sectionContent(section)
                }
            }
        }
    }

    private func sectionIcon(_ name: String) -> some View {
        ZStack {
            RoundedRectangle(cornerRadius: 10)
                .fill(Color.ongoPrimary.opacity(0.12))
                .frame(width: 44, height: 44)
            Image(systemName: name)
                .font(.system(size: 19))
                .foregroundStyle(Color.ongoPrimary)
        }
    }

    // MARK: - Section content

    @ViewBuilder
    private func sectionContent(_ section: ProfileSection) -> some View {
        VStack(spacing: 0) {
            switch section {
            case .personal:   personalRows
            case .body:       bodyRows
            case .medical:    medicalRows
            case .lifestyle:  lifestyleRows
            case .verification: verificationRows
            }
        }
        .padding(.top, OngoSpacing.xs)
    }

    // MARK: Personal info

    private var personalRows: some View {
        Group {
            row("Full name",      value: [user?.firstName, user?.lastName].compactMap { $0 }.filter { !$0.isEmpty }.joined(separator: " "))
            divider
            row("Email",         value: user?.email)
            divider
            row("Phone",         value: user?.phone)
            divider
            row("Date of birth", value: (user?.dateOfBirth ?? sp?.dateOfBirth).map { $0.formatted(date: .abbreviated, time: .omitted) })
            divider
            row("Sex at birth",  value: optionLabel(for: "sex-at-birth", id: sp?.sexAtBirth))
            divider
            row("Ethnicity",     value: optionLabel(for: "ethnicity",    id: sp?.ethnicity))
            divider
            row("Address",       value: user?.address)
            divider
            row("ZIP",           value: user?.zipCode)
        }
    }

    // MARK: Body & goals

    private var bodyRows: some View {
        Group {
            row("Height", value: heightString)
            divider
            row("Current weight", value: sp?.currentWeightLbs.map { String(format: "%.1f lb", $0) })
            divider
            row("Goal weight",    value: sp?.goalWeightLbs.map { String(format: "%.1f lb", $0) })
            divider
            row("BMI",            value: bmiString)
            divider
            row("Weight loss goal", value: optionLabel(for: "weight-loss-goal", id: sp?.weightLossGoal))
            divider
            pillsRow("Motivations", values: (sp?.motivations ?? []).compactMap { optionLabel(for: "motivation", id: $0) ?? $0.capitalized })
        }
    }

    // MARK: Medical info

    private var medicalRows: some View {
        Group {
            row("Current GLP-1", value: glp1String)
            divider
            pillsRow("Diagnosed conditions", values: sp?.diagnosedConditions ?? [])
            divider
            pillsRow("Safety flags",         values: sp?.safetyConditions ?? [])
            divider
            pillsRow("Past surgeries",       values: sp?.pastSurgeries ?? [])
            divider
            row("Medications",        value: sp?.medications)
            divider
            row("Allergies",          value: sp?.allergies)
            divider
            row("Preferred pharmacy", value: sp?.preferredPharmacy)
            divider
            row("Pregnancy",          value: boolLabel(sp?.isPregnant, yes: "Yes", no: "No"))
            divider
            row("Family thyroid history", value: boolLabel(sp?.familyThyroidCancer, yes: "Yes", no: "No"))
        }
    }

    // MARK: Lifestyle

    private var lifestyleRows: some View {
        Group {
            row("Meals/day",          value: optionLabel(for: "meals-per-day",    id: sp?.mealsPerDay))
            divider
            row("Exercise days/week", value: optionLabel(for: "exercise-days",    id: sp?.exerciseDaysPerWeek))
            divider
            row("Sleep hours/night",  value: optionLabel(for: "sleep-hours",      id: sp?.sleepHoursPerNight))
            divider
            row("Fast food/week",     value: optionLabel(for: "fast-food",        id: sp?.fastFoodPerWeek))
            divider
            row("Sugary drinks/week", value: optionLabel(for: "sugary-drinks",    id: sp?.sugaryDrinksPerWeek))
            divider
            row("Water intake/day",   value: optionLabel(for: "water-intake",     id: sp?.waterIntakeDaily))
            divider
            row("Stress level",       value: sp?.stressLevel.map { "\($0) / 10" })
            divider
            row("Alcohol/week",       value: optionLabel(for: "alcohol",          id: sp?.alcoholDrinksPerWeek))
            divider
            row("Recreational drugs", value: sp?.usesRecreationalDrugs.map { $0 == "none" ? "None" : $0 })
            divider
            row("Weight concern duration", value: optionLabel(for: "weight-concern", id: sp?.weightConcernDuration))
            divider
            pillsRow("Past attempts", values: (sp?.pastWeightLossAttempts ?? []).compactMap { optionLabel(for: "past-attempts", id: $0) ?? $0 })
        }
    }

    // MARK: Verification

    private var verificationRows: some View {
        Group {
            HStack {
                Text("Photo ID")
                    .font(OngoFont.body())
                    .foregroundStyle(Color.ongoTextSecondary)
                Spacer()
                if sp?.photoIdUploaded == true {
                    OngoTagPill(label: "✓ Uploaded", color: Color.ongoSuccess, style: .tinted)
                } else {
                    Text("Not uploaded").font(OngoFont.body()).foregroundStyle(Color.ongoTextTertiary).italic()
                }
            }
            .padding(.vertical, 10)
            divider
            HStack {
                Text("Prescription/Rx photo")
                    .font(OngoFont.body())
                    .foregroundStyle(Color.ongoTextSecondary)
                Spacer()
                if sp?.glp1PhotoUploaded == true {
                    OngoTagPill(label: "✓ Uploaded", color: Color.ongoSuccess, style: .tinted)
                } else {
                    Text("Not uploaded").font(OngoFont.body()).foregroundStyle(Color.ongoTextTertiary).italic()
                }
            }
            .padding(.vertical, 10)
            divider
            row("Sign-up method", value: "Email")
        }
    }

    // MARK: - Row helpers

    private func row(_ label: String, value: String?) -> some View {
        HStack(alignment: .top) {
            Text(label)
                .font(OngoFont.body())
                .foregroundStyle(Color.ongoTextSecondary)
            Spacer()
            if let value, !value.isEmpty {
                Text(value)
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(Color.ongoTextPrimary)
                    .multilineTextAlignment(.trailing)
            } else {
                Text("Not provided")
                    .font(OngoFont.body())
                    .foregroundStyle(Color.ongoTextTertiary)
                    .italic()
            }
        }
        .padding(.vertical, 10)
    }

    private func pillsRow(_ label: String, values: [String]) -> some View {
        HStack(alignment: .top, spacing: OngoSpacing.sm) {
            Text(label)
                .font(OngoFont.body())
                .foregroundStyle(Color.ongoTextSecondary)
            Spacer()
            if values.isEmpty {
                Text("Not provided")
                    .font(OngoFont.body())
                    .foregroundStyle(Color.ongoTextTertiary)
                    .italic()
            } else {
                VStack(alignment: .trailing, spacing: 4) {
                    ForEach(values, id: \.self) { v in
                        OngoTagPill(label: v, color: Color.ongoPrimary, style: .tinted)
                    }
                }
            }
        }
        .padding(.vertical, 10)
    }

    private var divider: some View {
        Divider()
    }

    // MARK: - Computed display strings

    private var heightString: String? {
        guard let ft = sp?.heightFeet, let ins = sp?.heightInches else { return nil }
        return "\(ft)'\(ins)\""
    }

    private var bmiString: String? {
        let bmi: Double
        if let b = sp?.bmi, b > 0 { bmi = b }
        else if let h = sp?.heightFeet, let hi = sp?.heightInches, let w = sp?.currentWeightLbs {
            let totalIn = Double(h * 12 + hi)
            guard totalIn > 0 else { return nil }
            bmi = (w / (totalIn * totalIn)) * 703
        } else { return nil }

        let category: String
        switch bmi {
        case ..<18.5: category = "Underweight"
        case ..<25:   category = "Healthy"
        case ..<30:   category = "Overweight"
        default:      category = "Obese"
        }
        return "\(Int(bmi.rounded())) (\(category))"
    }

    private var glp1String: String? {
        guard let med = sp?.currentGlp1, !med.isEmpty else { return nil }
        if let dose = sp?.currentGlp1Dose, !dose.isEmpty { return "\(med) · \(dose)" }
        return med
    }

    private func boolLabel(_ value: String?, yes: String, no: String) -> String? {
        guard let value else { return nil }
        return value == "yes" ? yes : (value == "no" ? no : value.capitalized)
    }

    // MARK: - Option label lookup (reads from SurveyQuestions)

    @MainActor
    private func optionLabel(for questionId: String, id: String?) -> String? {
        guard let id, !id.isEmpty else { return nil }
        return SurveyQuestions.all
            .first(where: { $0.id == questionId })?
            .options
            .first(where: { $0.id == id })?
            .label
    }
}
