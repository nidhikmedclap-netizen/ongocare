import SwiftUI

// The compound height + weight screen (#height-weight question)
// Shows live BMI preview as user types
struct SurveyHeightWeightView: View {
    @Binding var profile: SurveyProfile

    @State private var feet: String = ""
    @State private var inches: String = ""
    @State private var weight: String = ""

    private var computedBMI: Double? {
        guard let w = Double(weight),
              let ft = Double(feet) else { return nil }
        let totalInches = (Double(inches) ?? 0) + ft * 12
        guard totalInches > 0 else { return nil }
        return (w / (totalInches * totalInches)) * 703
    }

    var body: some View {
        VStack(spacing: OngoSpacing.md) {
            // Height
            VStack(alignment: .leading, spacing: OngoSpacing.xs) {
                Text("Height").ongoLabelStyle()
                HStack(spacing: OngoSpacing.sm) {
                    OngoTextField(placeholder: "5", text: $feet, keyboardType: .numberPad)
                    Text("ft").font(OngoFont.subheadline()).foregroundStyle(Color.ongoTextSecondary).frame(width: 22)
                    OngoTextField(placeholder: "7", text: $inches, keyboardType: .numberPad)
                    Text("in").font(OngoFont.subheadline()).foregroundStyle(Color.ongoTextSecondary).frame(width: 22)
                }
            }

            // Weight
            VStack(alignment: .leading, spacing: OngoSpacing.xs) {
                Text("Current weight").ongoLabelStyle()
                HStack(spacing: OngoSpacing.sm) {
                    OngoTextField(placeholder: "185", text: $weight, keyboardType: .numberPad)
                    Text("lbs").font(OngoFont.subheadline()).foregroundStyle(Color.ongoTextSecondary).frame(width: 36)
                }
            }

            // Live BMI preview
            if let bmi = computedBMI {
                bmiCard(bmi: bmi)
                    .transition(.scale(scale: 0.9).combined(with: .opacity))
            }
        }
        .animation(.spring(response: 0.35), value: computedBMI)
        .onChange(of: feet)    { updateProfile() }
        .onChange(of: inches)  { updateProfile() }
        .onChange(of: weight)  { updateProfile() }
        .onAppear {
            if let f = profile.heightFeet   { feet   = "\(f)" }
            if let i = profile.heightInches { inches = "\(i)" }
            if let w = profile.currentWeightLbs { weight = "\(Int(w))" }
        }
    }

    private func updateProfile() {
        profile.heightFeet     = Int(feet)
        profile.heightInches   = Int(inches) ?? 0
        profile.currentWeightLbs = Double(weight)
        profile.bmi            = computedBMI
    }

    private func bmiCard(bmi: Double) -> some View {
        HStack(spacing: OngoSpacing.lg) {
            VStack(alignment: .leading, spacing: 4) {
                Text("Your BMI")
                    .font(OngoFont.caption())
                    .foregroundStyle(Color.ongoTextSecondary)
                Text(String(format: "%.1f", bmi))
                    .font(.system(size: 40, weight: .heavy))
                    .foregroundStyle(Color.bmiCategoryColor(for: bmi))
            }
            VStack(alignment: .leading, spacing: 4) {
                Text(bmiCategory(for: bmi))
                    .font(OngoFont.subheadline())
                    .foregroundStyle(Color.bmiCategoryColor(for: bmi))
                Text(bmi >= 27
                     ? "Clinically eligible for GLP-1"
                     : "May qualify — your doctor will confirm")
                    .font(OngoFont.caption())
                    .foregroundStyle(Color.ongoTextSecondary)
            }
            Spacer()
            OngoTagPill(
                label: bmi >= 27 ? "Eligible" : "Review",
                color: bmi >= 27 ? Color.ongoSuccess : Color.ongoOrange,
                style: .tinted
            )
        }
        .padding(OngoSpacing.md)
        .background(Color.bmiCategoryColor(for: bmi).opacity(0.08))
        .clipShape(RoundedRectangle(cornerRadius: OngoRadius.md))
    }

    private func bmiCategory(for bmi: Double) -> String {
        switch bmi {
        case ..<18.5: return "Underweight"
        case 18.5..<25: return "Normal weight"
        case 25..<30: return "Overweight"
        default: return "Obese"
        }
    }
}
