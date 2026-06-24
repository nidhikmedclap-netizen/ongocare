//
//  LoginView.swift
//  TwilioCallApp
//

import SwiftUI

struct LoginView: View {
    @ObservedObject var session: FirebaseSessionManager
    @State private var email = ""
    @State private var password = ""

    var body: some View {
        ZStack {
            Theme.background.ignoresSafeArea()
            VStack(spacing: 18) {
                Spacer(minLength: 40)
                Text("Welcome")
                    .font(.system(size: 32, weight: .bold))
                    .foregroundStyle(Theme.textPrimary)
                Text("Sign in to sync your calls, messages, and contacts.")
                    .font(.system(size: 14))
                    .foregroundStyle(Theme.textDim)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 28)

                VStack(spacing: 12) {
                    TextField("Email", text: $email)
                        .textContentType(.emailAddress)
                        .keyboardType(.emailAddress)
                        .autocorrectionDisabled()
                        .textInputAutocapitalization(.never)
                        .padding(12)
                        .background(RoundedRectangle(cornerRadius: 10, style: .continuous).fill(Color.white.opacity(0.06)))

                    SecureField("Password", text: $password)
                        .textContentType(.password)
                        .padding(12)
                        .background(RoundedRectangle(cornerRadius: 10, style: .continuous).fill(Color.white.opacity(0.06)))

                    Button {
                        Task { await session.signInWithEmail(email: email, password: password) }
                    } label: {
                        Text("Sign in with Email")
                            .font(.system(size: 15, weight: .semibold))
                            .foregroundStyle(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 12)
                            .background(RoundedRectangle(cornerRadius: 12, style: .continuous).fill(Theme.primaryGradient))
                    }
                    .buttonStyle(.plain)
                    .disabled(session.isLoading)

                    Button {
                        Task { await session.signInWithGoogle() }
                    } label: {
                        HStack(spacing: 8) {
                            Image(systemName: "globe")
                            Text("Continue with Google")
                                .font(.system(size: 15, weight: .semibold))
                        }
                        .foregroundStyle(Theme.textPrimary)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 12)
                        .background(RoundedRectangle(cornerRadius: 12, style: .continuous).fill(Color.white.opacity(0.08)))
                    }
                    .buttonStyle(.plain)
                    .disabled(session.isLoading)
                }
                .padding(16)
                .glassCard()
                .padding(.horizontal, 18)

                if let msg = session.errorMessage, !msg.isEmpty {
                    Text(msg)
                        .font(.system(size: 12))
                        .foregroundStyle(Color(red: 1, green: 0.45, blue: 0.45))
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 24)
                }
                if session.isLoading {
                    ProgressView()
                        .tint(Theme.accentLavender)
                }
                Spacer()
            }
        }
    }
}

#Preview {
    LoginView(session: FirebaseSessionManager())
        .preferredColorScheme(.dark)
}
