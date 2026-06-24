import SwiftUI

// The "complete-profile" compound form: lastName, DOB, zip, phone, address
struct SurveyProfileFormView: View {
    @Binding var profile: SurveyProfile

    @State private var lastName: String = ""
    @State private var dob: Date = Calendar.current.date(byAdding: .year, value: -30, to: Date()) ?? Date()
    @State private var zipCode: String = ""
    @State private var phone: String = ""
    @State private var streetAddress: String = ""

    private var maxDOB: Date { Calendar.current.date(byAdding: .year, value: -18, to: Date()) ?? Date() }

    var body: some View {
        VStack(spacing: OngoSpacing.sm) {
            OngoTextField(placeholder: "Last name", text: $lastName)

            DatePicker("Date of birth", selection: $dob, in: ...maxDOB, displayedComponents: [.date])
                .font(OngoFont.body())
                .tint(Color.ongoPrimary)
                .padding(OngoSpacing.sm)
                .background(Color.ongoCard)
                .clipShape(RoundedRectangle(cornerRadius: OngoRadius.md))
                .overlay(
                    RoundedRectangle(cornerRadius: OngoRadius.md)
                        .stroke(Color.ongoBorder, lineWidth: 1.5)
                )

            OngoTextField(placeholder: "Phone number", text: $phone, keyboardType: .phonePad)
            OngoTextField(placeholder: "Street address", text: $streetAddress)
            OngoTextField(placeholder: "ZIP code", text: $zipCode, keyboardType: .numberPad)
        }
        .onChange(of: lastName)       { profile.firstName = profile.firstName }  // trigger canAdvance re-eval
        .onChange(of: dob)            { profile.dateOfBirth = dob }
        .onAppear {
            if let d = profile.dateOfBirth { dob = d }
        }
    }
}

// The "meds-allergies" form: current meds, allergies, preferred pharmacy
struct SurveyMedsFormView: View {
    @Binding var profile: SurveyProfile

    private func strBinding(_ kp: WritableKeyPath<SurveyProfile, String?>) -> Binding<String> {
        Binding(
            get: { profile[keyPath: kp] ?? "" },
            set: { profile[keyPath: kp] = $0.isEmpty ? nil : $0 }
        )
    }

    var body: some View {
        VStack(spacing: OngoSpacing.sm) {
            VStack(alignment: .leading, spacing: OngoSpacing.xxs) {
                Text("Current medications & supplements").ongoLabelStyle()
                TextEditor(text: strBinding(\.medications))
                    .font(OngoFont.body())
                    .frame(height: 80)
                    .padding(OngoSpacing.xs)
                    .background(Color.ongoCard)
                    .clipShape(RoundedRectangle(cornerRadius: OngoRadius.md))
                    .overlay(
                        RoundedRectangle(cornerRadius: OngoRadius.md)
                            .stroke(Color.ongoBorder, lineWidth: 1.5)
                    )
            }

            VStack(alignment: .leading, spacing: OngoSpacing.xxs) {
                Text("Known allergies").ongoLabelStyle()
                OngoTextField(placeholder: "e.g. penicillin, shellfish", text: strBinding(\.allergies))
            }

            VStack(alignment: .leading, spacing: OngoSpacing.xxs) {
                Text("Preferred pharmacy (optional)").ongoLabelStyle()
                OngoTextField(placeholder: "e.g. CVS Pharmacy, 123 Main St", text: strBinding(\.preferredPharmacy))
            }

            Text("This information is shared only with your prescribing doctor.")
                .font(OngoFont.caption(11))
                .foregroundStyle(Color.ongoTextTertiary)
        }
    }
}
