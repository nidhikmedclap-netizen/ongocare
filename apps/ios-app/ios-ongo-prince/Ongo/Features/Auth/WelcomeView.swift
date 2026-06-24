import SwiftUI

#Preview {
    let state = AppState()
    state.rootDestination = .welcome
    return WelcomeView()
        .environment(state)
}

struct WelcomeView: View {
    @Environment(AppState.self) private var appState

    var body: some View {
        ZStack {
            // Full-screen green background
            Color.ongoPrimary.ignoresSafeArea()

            // Background blob decorations
            GeometryReader { geo in
                // Top-right large blob
                Circle()
                    .fill(Color.white.opacity(0.08))
                    .frame(width: geo.size.width * 0.85)
                    .offset(x: geo.size.width * 0.35, y: -geo.size.width * 0.25)

                // Center-left blob
                Circle()
                    .fill(Color.white.opacity(0.07))
                    .frame(width: geo.size.width * 0.75)
                    .offset(x: -geo.size.width * 0.3, y: geo.size.height * 0.28)
            }
            .ignoresSafeArea()

            VStack(spacing: 0) {
                Spacer()

                // Logo + headline
                VStack(spacing: OngoSpacing.lg) {
                    // Location pin icon in semi-transparent ring
                    ZStack {
                        Circle()
                            .fill(Color.white.opacity(0.15))
                            .frame(width: 100, height: 100)
                        Circle()
                            .stroke(Color.white.opacity(0.25), lineWidth: 1.5)
                            .frame(width: 100, height: 100)
                        Image(systemName: "mappin.circle.fill")
                            .font(.system(size: 44))
                            .foregroundStyle(.white)
                    }

                    // App name
                    Text("Ongo")
                        .font(.system(size: 52, weight: .heavy))
                        .tracking(-1.5)
                        .foregroundStyle(.white)

                    // Tagline
                    Text("Your personal weight loss journey,\nguided by board-certified doctors.")
                        .font(.system(size: 17, weight: .semibold))
                        .multilineTextAlignment(.center)
                        .foregroundStyle(.white)
                        .lineSpacing(3)
                        .padding(.horizontal, OngoSpacing.xxl)

                    // Trust badges
                    HStack(spacing: OngoSpacing.md) {
                        Label("HIPAA Secure", systemImage: "checkmark.shield")
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundStyle(.white.opacity(0.9))

                        Rectangle()
                            .fill(Color.white.opacity(0.4))
                            .frame(width: 1, height: 14)

                        Label("Licensed Doctors", systemImage: "checkmark.square")
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundStyle(.white.opacity(0.9))
                    }
                    .padding(.top, OngoSpacing.xxs)
                }

                Spacer()
                Spacer()

                // CTA buttons
                VStack(spacing: OngoSpacing.sm) {
                    // Primary: white filled
                    Button {
                        withAnimation {
                            appState.rootDestination = .onboarding
                        }
                    } label: {
                        HStack(spacing: OngoSpacing.xs) {
                            Text("Start My Journey")
                                .font(.system(size: 17, weight: .bold))
                            Image(systemName: "arrow.right")
                                .font(.system(size: 15, weight: .bold))
                        }
                        .frame(maxWidth: .infinity)
                        .frame(height: 56)
                        .background(Color.white)
                        .foregroundStyle(Color(hex: "#1a3a2a"))
                        .clipShape(RoundedRectangle(cornerRadius: OngoRadius.xl))
                    }

                    // Secondary: ghost white border
                    Button {
                        withAnimation {
                            appState.rootDestination = .auth(mode: .signIn)
                        }
                    } label: {
                        Text("Log In")
                            .font(.system(size: 17, weight: .semibold))
                            .frame(maxWidth: .infinity)
                            .frame(height: 56)
                            .foregroundStyle(.white)
                            .overlay(
                                RoundedRectangle(cornerRadius: OngoRadius.xl)
                                    .stroke(Color.white.opacity(0.5), lineWidth: 1.5)
                            )
                    }
                }
                .padding(.horizontal, OngoSpacing.lg)
                .padding(.bottom, OngoSpacing.xxxl)
            }
        }
    }
}
