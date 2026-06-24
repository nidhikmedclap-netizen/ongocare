import SwiftUI

struct AuthView: View {
    @Environment(AppState.self) private var appState
    let mode: AuthMode

    @State private var path: [AuthMethod] = []
    @State private var error: String? = nil

    private var isSignUp: Bool { mode == .signUp }

    enum AuthMethod: Hashable { case email }

    var body: some View {
        if isSignUp {
            SignUpView(error: $error)
        } else {
            NavigationStack(path: $path) {
                signInSelectionView
                    .navigationDestination(for: AuthMethod.self) { _ in
                        EmailAuthView(mode: .signIn, error: $error)
                    }
            }
            .errorBanner(message: $error)
        }
    }

    // MARK: - Sign-in method selection

    private var signInSelectionView: some View {
        VStack(spacing: 0) {
            HStack {
                Button {
                    withAnimation { appState.rootDestination = .welcome }
                } label: {
                    Image(systemName: "chevron.left")
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundStyle(Color.ongoTextPrimary)
                        .frame(width: 38, height: 38)
                        .background(Color.ongoCard)
                        .clipShape(Circle())
                }
                Spacer()
            }
            .padding(.horizontal, OngoSpacing.lg)
            .padding(.top, OngoSpacing.sm)

            ScrollView(showsIndicators: false) {
                VStack(alignment: .leading, spacing: 0) {
                    ZStack {
                        Circle()
                            .fill(Color.ongoPrimary)
                            .frame(width: 64, height: 64)
                        Image(systemName: "checkmark.shield.fill")
                            .font(.system(size: 28))
                            .foregroundStyle(.white)
                    }
                    .padding(.top, OngoSpacing.xl)
                    .padding(.bottom, OngoSpacing.md)

                    Text("Welcome back")
                        .font(.system(size: 30, weight: .heavy))
                        .foregroundStyle(Color.ongoTextPrimary)

                    Text("Log in to continue your weight loss journey.")
                        .font(.system(size: 16))
                        .foregroundStyle(Color.ongoTextSecondary)
                        .padding(.top, 6)
                        .padding(.bottom, OngoSpacing.xl)
                        .fixedSize(horizontal: false, vertical: true)

                    VStack(spacing: 12) {
                        signInMethodRow(
                            icon: "envelope.fill",
                            iconBg: Color.ongoPrimary,
                            iconColor: .white,
                            title: "Log in with Email"
                        ) { path.append(.email) }

                        googleSignInRow(label: "Continue with Google")
                    }

                    HStack(spacing: 4) {
                        Text("New to Ongo?")
                            .font(.system(size: 14))
                            .foregroundStyle(Color.ongoTextSecondary)
                        Button("Create account") {
                            withAnimation { appState.rootDestination = .auth(mode: .signUp) }
                        }
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(Color.ongoPrimary)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.top, OngoSpacing.lg)

                    Text("By continuing, you agree to our **Terms of Service** and **Privacy Policy**. Your data is HIPAA-protected and never shared without your consent.")
                        .font(.system(size: 12))
                        .foregroundStyle(Color.ongoTextTertiary)
                        .multilineTextAlignment(.center)
                        .frame(maxWidth: .infinity)
                        .padding(.top, OngoSpacing.lg)
                }
                .padding(.horizontal, OngoSpacing.lg)
                .padding(.bottom, OngoSpacing.xxxl)
            }
        }
        .background(Color.ongoBackground.ignoresSafeArea())
        .navigationBarHidden(true)
    }

    private func signInMethodRow(icon: String, iconBg: Color, iconColor: Color, title: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: OngoSpacing.md) {
                ZStack {
                    Circle().fill(iconBg).frame(width: 44, height: 44)
                    Image(systemName: icon)
                        .font(.system(size: 18))
                        .foregroundStyle(iconColor)
                }
                Text(title)
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(Color.ongoTextPrimary)
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(Color.ongoTextTertiary)
            }
            .padding(OngoSpacing.md)
            .background(Color.white)
            .clipShape(RoundedRectangle(cornerRadius: OngoRadius.lg))
        }
        .buttonStyle(.plain)
    }

    private func googleSignInRow(label: String) -> some View {
        Button {
            error = "Google Sign-In coming soon."
        } label: {
            HStack(spacing: OngoSpacing.md) {
                ZStack {
                    Circle()
                        .fill(Color.white)
                        .frame(width: 44, height: 44)
                        .overlay(Circle().stroke(Color.ongoBorder, lineWidth: 1))
                    Text("G")
                        .font(.system(size: 20, weight: .bold))
                        .foregroundStyle(Color(hex: "#4285F4"))
                }
                Text(label)
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(Color.ongoTextPrimary)
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(Color.ongoTextTertiary)
            }
            .padding(OngoSpacing.md)
            .background(Color.white)
            .clipShape(RoundedRectangle(cornerRadius: OngoRadius.lg))
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Sign-up form

struct SignUpView: View {
    @Environment(AppState.self) private var appState
    @Binding var error: String?

    @State private var email = ""
    @State private var password = ""
    @State private var showPassword = false
    @State private var hipaaChecked = false
    @State private var termsChecked = false
    @State private var isLoading = false

    private var canContinue: Bool {
        !email.isEmpty && !password.isEmpty && hipaaChecked && termsChecked
    }

    var body: some View {
        VStack(spacing: 0) {
            // "Ongo Weight Loss" nav bar
            HStack {
                Spacer()
                HStack(spacing: 4) {
                    Text("Ongo")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundStyle(Color.ongoPrimary)
                    Text("Weight Loss")
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundStyle(Color.ongoTextPrimary)
                }
                Spacer()
            }
            .padding(.vertical, 14)
            .overlay(alignment: .leading) {
                Button {
                    withAnimation { appState.rootDestination = .onboarding }
                } label: {
                    Image(systemName: "chevron.left")
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundStyle(Color.ongoTextPrimary)
                        .padding(.leading, OngoSpacing.lg)
                }
            }

            Divider()

            ScrollView(showsIndicators: false) {
                VStack(alignment: .leading, spacing: OngoSpacing.lg) {
                    // Heading
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Find the right treatment for you")
                            .font(.system(size: 28, weight: .heavy))
                            .foregroundStyle(Color.ongoTextPrimary)
                            .fixedSize(horizontal: false, vertical: true)

                        Text("Enter your email and create a password. You'll use these to sign in to your dashboard later.")
                            .font(.system(size: 15))
                            .foregroundStyle(Color.ongoTextSecondary)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    .padding(.top, OngoSpacing.md)

                    // Fields
                    VStack(spacing: 10) {
                        signUpField(placeholder: "Email", text: $email, keyboard: .emailAddress)
                        passwordField
                    }

                    // Consent checkboxes
                    VStack(spacing: 10) {
                        consentRow(isChecked: $hipaaChecked) {
                            Group {
                                Text("I agree to the ") +
                                Text("HIPAA Authorization")
                                    .foregroundColor(Color.ongoPrimary)
                            }
                            .font(.system(size: 14))
                        }

                        consentRow(isChecked: $termsChecked) {
                            Group {
                                Text("I agree to the ") +
                                Text("Telehealth Consent")
                                    .foregroundColor(Color.ongoPrimary) +
                                Text(", ") +
                                Text("Terms of Use")
                                    .foregroundColor(Color.ongoPrimary) +
                                Text(" and ") +
                                Text("Privacy Policy")
                                    .foregroundColor(Color.ongoPrimary)
                            }
                            .font(.system(size: 14))
                        }
                    }

                    // Buttons
                    VStack(spacing: 0) {
                        Button { submit() } label: {
                            ZStack {
                                HStack(spacing: 6) {
                                    Text("Continue")
                                    Text("→")
                                }
                                .font(.system(size: 16, weight: .semibold))
                                .foregroundStyle(canContinue ? .white : Color.ongoTextTertiary)
                                .opacity(isLoading ? 0 : 1)

                                if isLoading {
                                    ProgressView()
                                        .tint(.white)
                                }
                            }
                            .frame(maxWidth: .infinity)
                            .frame(height: 54)
                            .background(canContinue ? Color.ongoPrimary : Color(white: 0.87))
                            .clipShape(RoundedRectangle(cornerRadius: 14))
                        }
                        .disabled(!canContinue || isLoading)

                        orDivider
                            .padding(.vertical, OngoSpacing.md)

                        googleButton
                    }
                }
                .padding(.horizontal, OngoSpacing.lg)
                .padding(.bottom, OngoSpacing.xxxl)
            }
        }
        .background(Color.ongoBackground.ignoresSafeArea())
        .dismissKeyboardOnTap()
        .errorBanner(message: $error)
    }

    // MARK: - Field components

    private func signUpField(placeholder: String, text: Binding<String>, keyboard: UIKeyboardType) -> some View {
        TextField(placeholder, text: text)
            .keyboardType(keyboard)
            .autocorrectionDisabled()
            .textInputAutocapitalization(.never)
            .font(.system(size: 16))
            .padding(.horizontal, 16)
            .frame(height: 54)
            .background(Color.white)
            .clipShape(RoundedRectangle(cornerRadius: 12))
            .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.ongoBorder, lineWidth: 1))
    }

    private var passwordField: some View {
        HStack {
            Group {
                if showPassword {
                    TextField("Password", text: $password)
                } else {
                    SecureField("Password", text: $password)
                }
            }
            .font(.system(size: 16))
            .autocorrectionDisabled()
            .textInputAutocapitalization(.never)

            Button {
                showPassword.toggle()
            } label: {
                Image(systemName: showPassword ? "eye.slash" : "eye")
                    .font(.system(size: 18))
                    .foregroundStyle(Color.ongoTextTertiary)
            }
        }
        .padding(.horizontal, 16)
        .frame(height: 54)
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.ongoBorder, lineWidth: 1))
    }

    private func consentRow<Label: View>(isChecked: Binding<Bool>, @ViewBuilder label: () -> Label) -> some View {
        Button { isChecked.wrappedValue.toggle() } label: {
            HStack(alignment: .top, spacing: 12) {
                ZStack {
                    RoundedRectangle(cornerRadius: 4)
                        .stroke(isChecked.wrappedValue ? Color.ongoPrimary : Color.ongoBorder, lineWidth: 1.5)
                        .frame(width: 20, height: 20)
                    if isChecked.wrappedValue {
                        RoundedRectangle(cornerRadius: 4)
                            .fill(Color.ongoPrimary)
                            .frame(width: 20, height: 20)
                        Image(systemName: "checkmark")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundStyle(.white)
                    }
                }
                .padding(.top, 1)

                label()
                    .multilineTextAlignment(.leading)
                    .fixedSize(horizontal: false, vertical: true)

                Spacer()
            }
            .padding(16)
            .background(Color.white)
            .clipShape(RoundedRectangle(cornerRadius: 12))
        }
        .buttonStyle(.plain)
    }

    private var orDivider: some View {
        HStack(spacing: 12) {
            Rectangle().fill(Color.ongoBorder).frame(height: 1)
            Text("OR")
                .font(.system(size: 12, weight: .medium))
                .foregroundStyle(Color.ongoTextTertiary)
                .fixedSize()
            Rectangle().fill(Color.ongoBorder).frame(height: 1)
        }
    }

    private var googleButton: some View {
        Button {
            error = "Google Sign-In coming soon."
        } label: {
            HStack(spacing: 10) {
                Text("G")
                    .font(.system(size: 20, weight: .bold))
                    .foregroundStyle(Color(hex: "#4285F4"))
                Text("Continue with Google")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(Color.ongoTextPrimary)
            }
            .frame(maxWidth: .infinity)
            .frame(height: 54)
            .background(Color.white)
            .clipShape(RoundedRectangle(cornerRadius: 14))
            .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color.ongoBorder, lineWidth: 1))
        }
        .buttonStyle(.plain)
    }

    // MARK: - Submit

    private func submit() {
        guard canContinue, !isLoading else { return }
        isLoading = true
        Task { @MainActor in
            do {
                try await appState.auth.signUp(email: email, password: password)
                if let user = appState.auth.currentUser {
                    await appState.handleSignUpComplete(firebaseUser: user, email: email)
                }
            } catch {
                self.error = error.localizedDescription
            }
            isLoading = false
        }
    }
}

// MARK: - Email sign-in form

struct EmailAuthView: View {
    @Environment(AppState.self) private var appState
    let mode: AuthMode
    @Binding var error: String?

    @State private var email = ""
    @State private var password = ""
    @State private var showPassword = false
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: OngoSpacing.lg) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Log in with Email")
                        .font(.system(size: 26, weight: .heavy))
                        .foregroundStyle(Color.ongoTextPrimary)
                    Text("Enter your email and password.")
                        .font(.system(size: 15))
                        .foregroundStyle(Color.ongoTextSecondary)
                }
                .padding(.top, OngoSpacing.sm)

                VStack(spacing: OngoSpacing.sm) {
                    OngoTextField(placeholder: "Email address", text: $email, keyboardType: .emailAddress)
                    passwordField
                    OngoPrimaryButton(title: "Sign in", isLoading: appState.auth.isLoading) {
                        submit()
                    }
                }

                Button("Forgot password?") {
                    Task { try? await appState.auth.resetPassword(email: email) }
                }
                .font(.system(size: 14))
                .foregroundStyle(Color.ongoTextSecondary)
                .frame(maxWidth: .infinity)
            }
            .padding(.horizontal, OngoSpacing.lg)
            .padding(.bottom, OngoSpacing.xxxl)
        }
        .background(Color.ongoBackground.ignoresSafeArea())
        .navigationBarBackButtonHidden(true)
        .toolbar {
            ToolbarItem(placement: .navigationBarLeading) {
                Button { dismiss() } label: {
                    Image(systemName: "chevron.left")
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundStyle(Color.ongoTextPrimary)
                        .frame(width: 38, height: 38)
                        .background(Color.ongoCard)
                        .clipShape(Circle())
                }
            }
        }
        .dismissKeyboardOnTap()
    }

    private var passwordField: some View {
        HStack {
            Group {
                if showPassword {
                    TextField("Password", text: $password)
                } else {
                    SecureField("Password", text: $password)
                }
            }
            .font(OngoFont.body())
            .autocorrectionDisabled()
            .textInputAutocapitalization(.never)

            Button { showPassword.toggle() } label: {
                Image(systemName: showPassword ? "eye.slash" : "eye")
                    .font(.system(size: 18))
                    .foregroundStyle(Color.ongoTextTertiary)
            }
        }
        .padding(OngoSpacing.sm)
        .background(Color.ongoCard)
        .clipShape(RoundedRectangle(cornerRadius: OngoRadius.md))
        .overlay(RoundedRectangle(cornerRadius: OngoRadius.md).stroke(Color.ongoBorder, lineWidth: 1.5))
    }

    private func submit() {
        guard !email.isEmpty, !password.isEmpty else {
            error = "Please fill in all fields."
            return
        }
        Task {
            do {
                try await appState.auth.signIn(email: email, password: password)
                if let user = appState.auth.currentUser {
                    await appState.loadUserAndRoute(firebaseUser: user)
                }
            } catch {
                self.error = error.localizedDescription
            }
        }
    }
}

// MARK: - Reusable text field

struct OngoTextField: View {
    let placeholder: String
    @Binding var text: String
    var isSecure: Bool = false
    var keyboardType: UIKeyboardType = .default

    var body: some View {
        Group {
            if isSecure {
                SecureField(placeholder, text: $text)
            } else {
                TextField(placeholder, text: $text)
                    .keyboardType(keyboardType)
                    .autocorrectionDisabled()
                    .textInputAutocapitalization(.never)
            }
        }
        .font(OngoFont.body())
        .padding(OngoSpacing.sm)
        .background(Color.ongoCard)
        .clipShape(RoundedRectangle(cornerRadius: OngoRadius.md))
        .overlay(
            RoundedRectangle(cornerRadius: OngoRadius.md)
                .stroke(Color.ongoBorder, lineWidth: 1.5)
        )
    }
}
