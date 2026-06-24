import SwiftUI

struct ProfileSetupView: View {
    var onComplete: (() -> Void)? = nil
    @Environment(AppState.self) private var appState

    @State private var step = 1
    @State private var firstName = ""
    @State private var lastName = ""
    @State private var dateOfBirth: Date? = nil
    @State private var showDateSheet = false
    @State private var zipCode = ""
    @State private var phone = ""
    @State private var address = ""
    @State private var isComplete = false
    @State private var isSaving = false

    private let totalSteps = 6

    var body: some View {
        if isComplete {
            profileCompleteView
        } else {
            formView
        }
    }

    // MARK: - Form

    private var formView: some View {
        VStack(spacing: 0) {
            progressBar
                .padding(.horizontal, OngoSpacing.lg)
                .padding(.top, 12)
                .padding(.bottom, 8)

            if step > 1 {
                HStack {
                    Button {
                        withAnimation(.easeInOut(duration: 0.2)) { step -= 1 }
                    } label: {
                        HStack(spacing: 4) {
                            Image(systemName: "chevron.left")
                                .font(.system(size: 13, weight: .semibold))
                            Text("Back")
                                .font(.system(size: 15, weight: .medium))
                        }
                        .foregroundStyle(Color.ongoTextSecondary)
                    }
                    Spacer()
                }
                .padding(.horizontal, OngoSpacing.lg)
                .padding(.top, 8)
            } else {
                Spacer().frame(height: OngoSpacing.xl)
            }

            ScrollView(showsIndicators: false) {
                VStack(alignment: .leading, spacing: OngoSpacing.md) {
                    stepContent
                }
                .padding(.horizontal, OngoSpacing.lg)
                .padding(.top, OngoSpacing.sm)
                .padding(.bottom, 120)
            }
            .overlay(alignment: .bottom) { ctaBar }
        }
        .background(Color.ongoBackground.ignoresSafeArea())
        .dismissKeyboardOnTap()
        .sheet(isPresented: $showDateSheet) { datePickerSheet }
        .animation(.easeInOut(duration: 0.22), value: step)
    }

    // MARK: - Progress bar

    private var progressBar: some View {
        HStack(spacing: 4) {
            ForEach(1...totalSteps, id: \.self) { i in
                Capsule()
                    .fill(i <= step ? Color.ongoPrimary : Color(white: 0.84))
                    .frame(height: 4)
            }
        }
    }

    // MARK: - Step content

    @ViewBuilder
    private var stepContent: some View {
        switch step {
        case 1:
            stepHeader(step: 1, title: "What's your first name?",
                       subtitle: "Your care team will use this to personalize your experience.")
            profileField(placeholder: "e.g. Sarah", text: $firstName)

        case 2:
            stepHeader(step: 2, title: "And your last name?",
                       subtitle: "Required for your medical records and prescriptions.")
            profileField(placeholder: "e.g. Johnson", text: $lastName)

        case 3:
            stepHeader(step: 3, title: "When were you born?",
                       subtitle: "Needed to verify your eligibility and customize dosing.")
            dateField
            hintRow(icon: "info.circle", text: "You must be 18 or older to use Ongo.")

        case 4:
            stepHeader(step: 4, title: "What's your ZIP code?",
                       subtitle: "We use this to match you with a licensed clinician in your state.")
            profileField(placeholder: "e.g. 90210", text: $zipCode, keyboard: .numberPad)
            hintRow(icon: "mappin.circle", text: "We only serve patients in licensed US states.")

        case 5:
            stepHeader(step: 5, title: "Your phone number?",
                       subtitle: "Your clinician may reach out before or after your visit.")
            phoneField
            hintRow(icon: "phone", text: "We'll only contact you for appointment reminders.")

        case 6:
            stepHeader(step: 6, title: "Almost done —\nyour home address?",
                       subtitle: "Required for prescription delivery and your medical record.")
            profileField(placeholder: "123 Main St, Apt 4B", text: $address)
            hintRow(icon: "house", text: "We ship your medication directly to this address.")

        default:
            EmptyView()
        }
    }

    // MARK: - Subcomponents

    private func stepHeader(step: Int, title: String, subtitle: String) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("STEP \(step) OF \(totalSteps)")
                .font(.system(size: 12, weight: .bold))
                .foregroundStyle(Color.ongoPrimary)
                .tracking(1.5)

            Text(title)
                .font(.system(size: 28, weight: .heavy))
                .foregroundStyle(Color.ongoTextPrimary)
                .fixedSize(horizontal: false, vertical: true)

            Text(subtitle)
                .font(.system(size: 15))
                .foregroundStyle(Color.ongoTextSecondary)
                .fixedSize(horizontal: false, vertical: true)
        }
    }

    private func profileField(placeholder: String, text: Binding<String>, keyboard: UIKeyboardType = .default) -> some View {
        TextField(placeholder, text: text)
            .keyboardType(keyboard)
            .autocorrectionDisabled()
            .textInputAutocapitalization(.words)
            .font(.system(size: 16))
            .padding(.horizontal, 16)
            .frame(height: 54)
            .background(Color.white)
            .clipShape(RoundedRectangle(cornerRadius: 14))
            .overlay(
                RoundedRectangle(cornerRadius: 14)
                    .stroke(!text.wrappedValue.isEmpty ? Color.ongoPrimary : Color(white: 0.88), lineWidth: 1.5)
            )
    }

    private var phoneField: some View {
        HStack(spacing: 12) {
            Image(systemName: "phone")
                .font(.system(size: 16))
                .foregroundStyle(Color.ongoTextTertiary)
            TextField("(555) 000-0000", text: $phone)
                .keyboardType(.phonePad)
                .font(.system(size: 16))
        }
        .padding(.horizontal, 16)
        .frame(height: 54)
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .stroke(!phone.isEmpty ? Color.ongoPrimary : Color(white: 0.88), lineWidth: 1.5)
        )
    }

    private var dateField: some View {
        Button { showDateSheet = true } label: {
            HStack {
                Text(dateOfBirth.map { formatDate($0) } ?? "MM / DD / YYYY")
                    .font(.system(size: 16))
                    .foregroundStyle(dateOfBirth != nil ? Color.ongoTextPrimary : Color.ongoTextTertiary)
                Spacer()
                Image(systemName: "calendar")
                    .font(.system(size: 16))
                    .foregroundStyle(Color.ongoTextTertiary)
            }
            .padding(.horizontal, 16)
            .frame(height: 54)
            .background(Color.white)
            .clipShape(RoundedRectangle(cornerRadius: 14))
            .overlay(
                RoundedRectangle(cornerRadius: 14)
                    .stroke(dateOfBirth != nil ? Color.ongoPrimary : Color(white: 0.88), lineWidth: 1.5)
            )
        }
        .buttonStyle(.plain)
    }

    private var datePickerSheet: some View {
        VStack(spacing: 0) {
            HStack {
                Text("Date of Birth")
                    .font(.system(size: 17, weight: .semibold))
                Spacer()
                Button("Done") { showDateSheet = false }
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(Color.ongoPrimary)
            }
            .padding(.horizontal, OngoSpacing.lg)
            .padding(.top, OngoSpacing.md)

            DatePicker(
                "",
                selection: Binding(
                    get: { dateOfBirth ?? Calendar.current.date(byAdding: .year, value: -30, to: Date()) ?? Date() },
                    set: { dateOfBirth = $0 }
                ),
                in: ...Calendar.current.date(byAdding: .year, value: -18, to: Date())!,
                displayedComponents: .date
            )
            .datePickerStyle(.graphical)
            .labelsHidden()
            .tint(Color.ongoPrimary)
            .padding(.horizontal, OngoSpacing.md)
        }
        .presentationDetents([.medium])
    }

    private func hintRow(icon: String, text: String) -> some View {
        HStack(alignment: .top, spacing: 6) {
            Image(systemName: icon)
                .font(.system(size: 13))
                .foregroundStyle(Color.ongoTextTertiary)
            Text(text)
                .font(.system(size: 13))
                .foregroundStyle(Color.ongoTextTertiary)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(.top, 2)
    }

    // MARK: - CTA button

    private var ctaBar: some View {
        Button { advance() } label: {
            HStack(spacing: 6) {
                Text(step == totalSteps ? "Complete Profile" : "Continue")
                    .font(.system(size: 16, weight: .semibold))
                Text("→")
                    .font(.system(size: 16))
            }
            .foregroundStyle(canAdvance ? .white : Color.ongoTextTertiary)
            .frame(maxWidth: .infinity)
            .frame(height: 56)
            .background(canAdvance ? Color.ongoPrimary.opacity(0.55) : Color(white: 0.87))
            .clipShape(RoundedRectangle(cornerRadius: 16))
        }
        .disabled(!canAdvance)
        .padding(.horizontal, OngoSpacing.lg)
        .padding(.bottom, OngoSpacing.xxxl)
        .background(Color.ongoBackground)
    }

    private var canAdvance: Bool {
        switch step {
        case 1: return !firstName.trimmingCharacters(in: .whitespaces).isEmpty
        case 2: return !lastName.trimmingCharacters(in: .whitespaces).isEmpty
        case 3:
            guard let dob = dateOfBirth else { return false }
            return Calendar.current.dateComponents([.year], from: dob, to: Date()).year ?? 0 >= 18
        case 4: return zipCode.count == 5
        case 5: return !phone.trimmingCharacters(in: .whitespaces).isEmpty
        case 6: return !address.trimmingCharacters(in: .whitespaces).isEmpty
        default: return false
        }
    }

    // MARK: - Advance

    private func advance() {
        if step < totalSteps {
            withAnimation(.easeInOut(duration: 0.22)) { step += 1 }
        } else {
            saveProfile()
        }
    }

    private func saveProfile() {
        isSaving = true
        Task { @MainActor in
            guard var user = appState.ongoUser else {
                isComplete = true
                isSaving = false
                return
            }
            user.firstName = firstName.trimmingCharacters(in: .whitespaces)
            user.lastName  = lastName.trimmingCharacters(in: .whitespaces)
            user.dateOfBirth = dateOfBirth
            user.zipCode  = zipCode
            user.phone    = phone.trimmingCharacters(in: .whitespaces)
            user.address  = address.trimmingCharacters(in: .whitespaces)
            user.surveyCompleted = true
            appState.ongoUser = user
            try? await appState.firestore.saveUser(user)
            isComplete = true
            isSaving = false
        }
    }

    // MARK: - Profile complete screen

    private var profileCompleteView: some View {
        VStack(spacing: 0) {
            Spacer()

            VStack(spacing: OngoSpacing.xl) {
                ZStack {
                    Circle()
                        .fill(Color.ongoPrimary)
                        .frame(width: 96, height: 96)
                    Image(systemName: "heart.fill")
                        .font(.system(size: 38, weight: .semibold))
                        .foregroundStyle(.white)
                }

                VStack(spacing: 12) {
                    Text("Hi \(firstName) 👋")
                        .font(.system(size: 32, weight: .heavy))
                        .foregroundStyle(Color.ongoTextPrimary)

                    Text("Nice to meet you. Let's continue building your personalized plan.")
                        .font(.system(size: 16))
                        .foregroundStyle(Color.ongoTextSecondary)
                        .multilineTextAlignment(.center)
                        .fixedSize(horizontal: false, vertical: true)
                        .padding(.horizontal, OngoSpacing.lg)
                }
            }

            Spacer()

            Button {
                if let onComplete {
                    onComplete()
                } else {
                    withAnimation { appState.rootDestination = .main }
                }
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
        .background(Color.ongoBackground.ignoresSafeArea())
    }

    // MARK: - Helpers

    private func formatDate(_ date: Date) -> String {
        let f = DateFormatter()
        f.dateFormat = "MM / dd / yyyy"
        return f.string(from: date)
    }
}
