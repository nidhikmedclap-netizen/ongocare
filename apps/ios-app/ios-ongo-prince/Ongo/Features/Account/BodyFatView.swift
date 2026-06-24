import SwiftUI

// Matches prototype #fatPage — US Navy formula body fat calculator
struct BodyFatView: View {
    @State private var sex: String = "male"     // "male" | "female"
    @State private var heightStr: String = ""
    @State private var neckStr: String = ""
    @State private var waistStr: String = ""
    @State private var hipStr: String = ""      // female only
    @State private var useMetric: Bool = true
    @State private var result: Double? = nil
    @State private var resultCategory: BodyMeasurement.BodyFatCategory? = nil
    @State private var isSaving: Bool = false
    @Environment(AppState.self) private var appState

    private var isFemale: Bool { sex == "female" }
    private var isFormValid: Bool {
        !heightStr.isEmpty && !neckStr.isEmpty && !waistStr.isEmpty && (!isFemale || !hipStr.isEmpty)
    }

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(spacing: OngoSpacing.md) {
                // Result ring card
                resultCard

                // Input card
                inputCard

                // Category ranges card
                rangesCard
            }
            .padding(.horizontal, OngoSpacing.md)
            .padding(.vertical, OngoSpacing.md)
            .padding(.bottom, 100)
        }
        .background(Color.ongoBackground)
        .navigationTitle("Body Fat Calculator")
        .navigationBarTitleDisplayMode(.inline)
        .dismissKeyboardOnTap()
    }

    // MARK: - Result card

    private var resultCard: some View {
        OngoCard(cornerRadius: OngoRadius.md) {
            VStack(spacing: OngoSpacing.md) {
                if let percent = result, let cat = resultCategory {
                    let catColor = bodyFatColor(cat)
                    ZStack {
                        OngoRingView(progress: min(percent / 50.0, 1.0), lineWidth: 12, color: catColor, size: 100)
                        VStack(spacing: 2) {
                            Text(String(format: "%.1f%%", percent))
                                .font(.system(size: 22, weight: .bold))
                                .foregroundStyle(catColor)
                            Text(cat.rawValue)
                                .font(OngoFont.label(11))
                                .foregroundStyle(catColor)
                        }
                    }
                    .padding(.vertical, OngoSpacing.sm)

                    OngoPrimaryButton(title: isSaving ? "Saving…" : "Save measurement", isLoading: isSaving) {
                        Task { await saveMeasurement(percent: percent, category: cat) }
                    }
                } else {
                    Image(systemName: "figure.arms.open")
                        .font(.system(size: 44))
                        .foregroundStyle(Color.ongoTextTertiary)
                    Text("Enter your measurements below")
                        .font(OngoFont.caption())
                        .foregroundStyle(Color.ongoTextTertiary)
                }
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, OngoSpacing.sm)
        }
    }

    // MARK: - Input card

    private var inputCard: some View {
        OngoCard {
            VStack(spacing: OngoSpacing.md) {
                // Unit toggle
                HStack {
                    Text("Units").font(OngoFont.body()).foregroundStyle(Color.ongoTextSecondary)
                    Spacer()
                    Picker("Units", selection: $useMetric) {
                        Text("cm").tag(true)
                        Text("in").tag(false)
                    }
                    .pickerStyle(.segmented)
                    .frame(width: 100)
                }

                // Sex toggle
                HStack {
                    Text("Sex at birth").font(OngoFont.body()).foregroundStyle(Color.ongoTextSecondary)
                    Spacer()
                    HStack(spacing: 0) {
                        sexButton("Male", value: "male")
                        sexButton("Female", value: "female")
                    }
                    .background(Color.ongoCardAlt)
                    .clipShape(Capsule())
                }

                Divider()

                measurementField("Height", placeholder: useMetric ? "cm" : "in", value: $heightStr)
                measurementField("Neck (below larynx)", placeholder: useMetric ? "cm" : "in", value: $neckStr)
                measurementField(isFemale ? "Waist (narrowest)" : "Waist (at navel)", placeholder: useMetric ? "cm" : "in", value: $waistStr)
                if isFemale {
                    measurementField("Hips (widest)", placeholder: useMetric ? "cm" : "in", value: $hipStr)
                        .transition(.move(edge: .top).combined(with: .opacity))
                }

                OngoPrimaryButton(title: "Calculate", isDisabled: !isFormValid) {
                    calculate()
                }
            }
        }
    }

    private func sexButton(_ label: String, value: String) -> some View {
        Button { withAnimation { sex = value } } label: {
            Text(label)
                .font(OngoFont.label(13))
                .foregroundStyle(sex == value ? .white : Color.ongoPrimary)
                .padding(.horizontal, OngoSpacing.sm)
                .padding(.vertical, 8)
                .background(sex == value ? Color.ongoPrimary : Color.clear)
                .clipShape(Capsule())
        }
    }

    private func measurementField(_ label: String, placeholder: String, value: Binding<String>) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label).font(OngoFont.caption(11)).foregroundStyle(Color.ongoTextSecondary)
            OngoTextField(placeholder: placeholder, text: value, keyboardType: .decimalPad)
        }
    }

    // MARK: - Ranges card

    private var rangesCard: some View {
        OngoCard {
            VStack(alignment: .leading, spacing: OngoSpacing.sm) {
                Text("Categories — \(isFemale ? "Female" : "Male")")
                    .font(OngoFont.subheadline())

                let ranges = isFemale
                    ? [("Essential", "< 12%"), ("Athlete", "12–20%"), ("Fitness", "21–24%"), ("Average", "25–31%"), ("Obese", "≥ 32%")]
                    : [("Essential", "< 3%"), ("Athlete", "3–13%"), ("Fitness", "14–17%"), ("Average", "18–24%"), ("Obese", "≥ 25%")]

                ForEach(ranges, id: \.0) { cat, range in
                    HStack {
                        Text(cat).font(OngoFont.body())
                        Spacer()
                        Text(range).font(OngoFont.caption()).foregroundStyle(Color.ongoTextTertiary)
                    }
                }
            }
        }
    }

    // MARK: - Logic

    private func calculate() {
        guard let h = Double(heightStr), let neck = Double(neckStr), let waist = Double(waistStr), h > 0 else { return }
        let hIn = useMetric ? h / 2.54 : h
        let neckIn = useMetric ? neck / 2.54 : neck
        let waistIn = useMetric ? waist / 2.54 : waist
        var hipIn: Double? = nil
        if isFemale, let hip = Double(hipStr) {
            hipIn = useMetric ? hip / 2.54 : hip
        }
        let percent = BodyMeasurement.calculate(sexAtBirth: sex, heightInches: hIn, neckInches: neckIn, waistInches: waistIn, hipsInches: hipIn)
        withAnimation(.spring(response: 0.5)) {
            result = percent
            resultCategory = BodyMeasurement.category(for: percent, sexAtBirth: sex)
        }
    }

    private func saveMeasurement(percent: Double, category: BodyMeasurement.BodyFatCategory) async {
        guard let userId = appState.ongoUser?.id, let h = Double(heightStr) else { return }
        isSaving = true
        let hIn = useMetric ? h / 2.54 : h
        let neckIn = useMetric ? (Double(neckStr) ?? 0) / 2.54 : (Double(neckStr) ?? 0)
        let waistIn = useMetric ? (Double(waistStr) ?? 0) / 2.54 : (Double(waistStr) ?? 0)
        let hipIn: Double? = isFemale ? (useMetric ? (Double(hipStr) ?? 0) / 2.54 : Double(hipStr)) : nil

        let measurement = BodyMeasurement(
            userId: userId, sexAtBirth: sex,
            neckInches: neckIn, waistInches: waistIn, hipsInches: hipIn,
            bodyFatPercent: percent, bodyFatCategory: category, measuredAt: Date()
        )
        try? await FirestoreService.shared.add(measurement, collection: BodyMeasurement.collectionPath)
        isSaving = false
    }

    private func bodyFatColor(_ category: BodyMeasurement.BodyFatCategory) -> Color {
        switch category {
        case .essential: return Color(hex: "#5b9bd5")
        case .athlete:   return Color(hex: "#70ad47")
        case .fitness:   return Color.ongoPrimary
        case .average:   return Color(hex: "#ed7d31")
        case .obese:     return Color(hex: "#c00000")
        }
    }
}
