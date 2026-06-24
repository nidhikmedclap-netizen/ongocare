import SwiftUI

// Matches prototype #bmiPage — interactive BMI calculator with arc gauge
struct BMIView: View {
    @State private var heightStr: String = ""
    @State private var weightStr: String = ""
    @State private var useMetric: Bool = true
    @State private var bmi: Double? = nil
    @Environment(AppState.self) private var appState

    private var bmiCategory: (label: String, color: Color)? {
        guard let bmi else { return nil }
        switch bmi {
        case ..<18.5: return ("Underweight", Color(hex: "#5b9bd5"))
        case ..<25:   return ("Healthy weight", Color(hex: "#70ad47"))
        case ..<30:   return ("Overweight", Color(hex: "#ed7d31"))
        default:      return ("Obese", Color(hex: "#c00000"))
        }
    }

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(spacing: OngoSpacing.md) {
                // Gauge card
                OngoCard(cornerRadius: OngoRadius.md) {
                    VStack(spacing: OngoSpacing.md) {
                        // Arc gauge
                        BMIArcGauge(bmi: bmi ?? 22, size: 240)
                            .frame(height: 130)

                        // Result display
                        if let bmi, let cat = bmiCategory {
                            VStack(spacing: 4) {
                                Text(String(format: "%.1f", bmi))
                                    .font(.system(size: 48, weight: .heavy))
                                    .foregroundStyle(cat.color)
                                Text(cat.label)
                                    .font(OngoFont.subheadline())
                                    .foregroundStyle(cat.color)
                            }
                        } else {
                            Text("Enter your measurements below")
                                .font(OngoFont.caption())
                                .foregroundStyle(Color.ongoTextTertiary)
                        }
                    }
                    .padding(.top, OngoSpacing.sm)
                }

                // Input card
                OngoCard {
                    VStack(spacing: OngoSpacing.md) {
                        // Unit toggle
                        HStack {
                            Text("Units").font(OngoFont.body()).foregroundStyle(Color.ongoTextSecondary)
                            Spacer()
                            Picker("Units", selection: $useMetric) {
                                Text("cm / kg").tag(true)
                                Text("in / lb").tag(false)
                            }
                            .pickerStyle(.segmented)
                            .frame(width: 160)
                        }

                        Divider()

                        VStack(alignment: .leading, spacing: 4) {
                            Text(useMetric ? "Height (cm)" : "Height (in)").font(OngoFont.caption()).foregroundStyle(Color.ongoTextSecondary)
                            OngoTextField(placeholder: useMetric ? "e.g. 170" : "e.g. 67", text: $heightStr, keyboardType: .decimalPad)
                        }

                        VStack(alignment: .leading, spacing: 4) {
                            Text(useMetric ? "Weight (kg)" : "Weight (lb)").font(OngoFont.caption()).foregroundStyle(Color.ongoTextSecondary)
                            OngoTextField(placeholder: useMetric ? "e.g. 75" : "e.g. 165", text: $weightStr, keyboardType: .decimalPad)
                        }

                        OngoPrimaryButton(title: "Calculate BMI", isDisabled: heightStr.isEmpty || weightStr.isEmpty) {
                            calculate()
                        }
                    }
                }

                // Legend card
                OngoCard {
                    VStack(spacing: OngoSpacing.xs) {
                        ForEach([
                            (color: Color(hex: "#5b9bd5"), label: "Underweight", range: "< 18.5"),
                            (color: Color(hex: "#70ad47"), label: "Healthy weight", range: "18.5 – 24.9"),
                            (color: Color(hex: "#ed7d31"), label: "Overweight", range: "25.0 – 29.9"),
                            (color: Color(hex: "#c00000"), label: "Obese", range: "≥ 30.0"),
                        ], id: \.label) { zone in
                            HStack(spacing: OngoSpacing.sm) {
                                RoundedRectangle(cornerRadius: 3)
                                    .fill(zone.color)
                                    .frame(width: 12, height: 12)
                                Text(zone.label)
                                    .font(OngoFont.body())
                                Spacer()
                                Text(zone.range)
                                    .font(OngoFont.caption())
                                    .foregroundStyle(Color.ongoTextTertiary)
                            }
                        }
                    }
                }

                // Info tips
                OngoCard {
                    VStack(alignment: .leading, spacing: OngoSpacing.sm) {
                        infoRow(icon: "info.circle", text: "BMI is a screening tool, not a diagnostic measure. It doesn't account for muscle mass or fat distribution.")
                        Divider()
                        infoRow(icon: "stethoscope", text: "GLP-1 medications typically require a BMI ≥ 27 with a related condition, or ≥ 30.")
                        Divider()
                        infoRow(icon: "person.fill.questionmark", text: "Speak to your Ongo doctor for a personalized assessment.")
                    }
                }
            }
            .padding(.horizontal, OngoSpacing.md)
            .padding(.vertical, OngoSpacing.md)
            .padding(.bottom, 100)
        }
        .background(Color.ongoBackground)
        .navigationTitle("BMI Calculator")
        .navigationBarTitleDisplayMode(.inline)
        .dismissKeyboardOnTap()
        .onAppear { prefillFromProfile() }
    }

    private func calculate() {
        guard let h = Double(heightStr), let w = Double(weightStr), h > 0 else { return }
        let heightM = useMetric ? h / 100 : h * 0.0254
        let weightKg = useMetric ? w : w * 0.453592
        withAnimation(.spring(response: 0.5)) {
            bmi = weightKg / (heightM * heightM)
        }
    }

    private func prefillFromProfile() {
        guard let quiz = appState.ongoUser?.quizAnswers else { return }
        if let w = quiz.currentWeight {
            weightStr = useMetric ? String(format: "%.0f", w * 0.453592) : String(format: "%.0f", w)
        }
        if let ft = quiz.heightFeet, let ins = quiz.heightInches {
            let totalInches = ft * 12 + ins
            heightStr = useMetric ? String(format: "%.0f", Double(totalInches) * 2.54) : "\(totalInches)"
        }
    }

    private func infoRow(icon: String, text: String) -> some View {
        HStack(alignment: .top, spacing: OngoSpacing.sm) {
            Image(systemName: icon)
                .font(.system(size: 14))
                .foregroundStyle(Color.ongoPrimary)
                .frame(width: 20, alignment: .top)
                .padding(.top, 2)
            Text(text)
                .font(OngoFont.caption())
                .foregroundStyle(Color.ongoTextSecondary)
        }
    }
}

// MARK: - BMI Arc Gauge

private struct BMIArcGauge: View {
    let bmi: Double
    let size: CGFloat

    private let bmiMin = 10.0
    private let bmiMax = 42.0

    private var fraction: Double {
        (min(max(bmi, bmiMin), bmiMax) - bmiMin) / (bmiMax - bmiMin)
    }

    private func zoneFraction(_ val: Double) -> Double {
        (val - bmiMin) / (bmiMax - bmiMin)
    }

    // Needle rotation: -90° = leftmost BMI, +90° = rightmost BMI
    private var needleAngle: Angle {
        .degrees(-90 + fraction * 180)
    }

    private let lineWidth: CGFloat = 18

    var body: some View {
        ZStack {
            // Zone arcs (drawn as Circle segments rotated so left = 9 o'clock)
            // Circle().trim() starts at 3 o'clock and goes clockwise.
            // We want our gauge to span 9 o'clock → 12 o'clock → 3 o'clock (upper half).
            // That's trim from 0.5 to 1.0, with a rotationEffect of 0 (no extra rotation needed).
            // But: trim(from:0.5, to:1.0) spans from 6→12→6? No.
            // trim(from: 0, to: 0.5) = right half (3→6→9 o'clock)
            // trim(from: 0.5, to: 1.0) = left half (9→12→3 o'clock) = UPPER arc ✓

            // Full arc background (gray)
            Circle()
                .trim(from: 0.5, to: 1.0)
                .stroke(Color.ongoCardAlt, style: StrokeStyle(lineWidth: lineWidth, lineCap: .butt))

            // Underweight (blue)
            arcZone(from: 0, to: zoneFraction(18.5), color: Color(hex: "#5b9bd5"))
            // Healthy (green)
            arcZone(from: zoneFraction(18.5), to: zoneFraction(25), color: Color(hex: "#70ad47"))
            // Overweight (orange)
            arcZone(from: zoneFraction(25), to: zoneFraction(30), color: Color(hex: "#ed7d31"))
            // Obese (red)
            arcZone(from: zoneFraction(30), to: 1.0, color: Color(hex: "#c00000"))

            // Needle
            Capsule()
                .fill(Color.ongoTextPrimary)
                .frame(width: 2.5, height: size / 2 - lineWidth - 8)
                .offset(y: -(size / 4 - lineWidth / 2 - 4))
                .rotationEffect(needleAngle)

            // Center hub
            Circle()
                .fill(Color.ongoTextPrimary)
                .frame(width: 10, height: 10)
        }
        .frame(width: size, height: size)
        // Clip to upper half
        .frame(height: size / 2, alignment: .top)
        .clipped()
    }

    private func arcZone(from start: Double, to end: Double, color: Color) -> some View {
        // Map zone fractions [0,1] → trim range [0.5, 1.0]
        let trimStart = 0.5 + start * 0.5
        let trimEnd = 0.5 + end * 0.5
        return Circle()
            .trim(from: trimStart, to: trimEnd)
            .stroke(color, style: StrokeStyle(lineWidth: lineWidth, lineCap: .butt))
    }
}
