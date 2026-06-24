//
//  ActiveCallView.swift
//  TwilioCallApp
//
//  In-call screen with controls. Business banner stays pinned at the top
//  so context never gets lost mid-conversation.
//

import SwiftUI

struct ActiveCallView: View {
    let context: CallContext
    @Environment(AppState.self) private var appState

    @State private var isMuted = false

    /// `activeCall` is mutated in place while ringing / connected; follow `AppState` for live voice state.
    private var live: CallContext {
        if let a = appState.activeCall, a.id == context.id { return a }
        return context
    }
    @State private var onSpeaker = false
    @State private var keypadOpen = false
    @State private var elapsed: Int = 0
    @State private var timer: Timer?

    private var business: Business? { appState.business(live.businessId) }

    var body: some View {
        ZStack {
            background.ignoresSafeArea()
            VStack(spacing: 0) {
                topMeta
                    .padding(.top, 60)

                bigAvatar
                    .padding(.top, 28)
                    .padding(.bottom, 18)

                Text(live.displayName)
                    .font(.system(size: 30, weight: .bold))
                Text(live.number)
                    .font(.system(size: 13))
                    .foregroundStyle(Theme.textDim)

                Spacer()

                controlsGrid
                    .padding(.horizontal, 30)
                    .padding(.bottom, 22)

                endButton
                    .padding(.bottom, 50)
            }
        }
        .onAppear {
            if live.voiceState == .connected {
                startTimer()
            }
        }
        .onChange(of: live.voiceState) { _, new in
            if new == .connected {
                elapsed = 0
                startTimer()
            } else if new != .connected {
                timer?.invalidate()
            }
        }
        .onDisappear { timer?.invalidate() }
    }

    private var statusTitle: String {
        switch live.voiceState {
        case .idle: return "CALL"
        case .connecting: return "CONNECTING…"
        case .ringing: return "RINGING…"
        case .connected: return "CONNECTED · \(formattedElapsed)"
        case .reconnecting: return "RECONNECTING…"
        case .failed(let reason):
            let short = reason.count > 42 ? String(reason.prefix(39)) + "…" : reason
            return "FAILED · \(short)"
        }
    }

    private var background: some View {
        ZStack {
            LinearGradient(
                colors: [
                    Color(red: 0.10, green: 0.04, blue: 0.18),
                    Color(red: 0.04, green: 0.02, blue: 0.10)
                ],
                startPoint: .top, endPoint: .bottom
            )
            RadialGradient(colors: [Color(red: 0.49, green: 0.23, blue: 0.93).opacity(0.45), .clear],
                           center: UnitPoint(x: 0.3, y: 0.2),
                           startRadius: 0, endRadius: 380)
            RadialGradient(colors: [Color(red: 0.93, green: 0.28, blue: 0.60).opacity(0.35), .clear],
                           center: UnitPoint(x: 0.7, y: 0.8),
                           startRadius: 0, endRadius: 380)
        }
    }

    private var topMeta: some View {
        VStack(spacing: 10) {
            if let biz = business {
                HStack(spacing: 8) {
                    Circle()
                        .fill(biz.tint.color)
                        .frame(width: 8, height: 8)
                        .shadow(color: biz.tint.color, radius: 8)
                    Text(biz.name)
                        .font(.system(size: 12, weight: .semibold))
                }
                .padding(.horizontal, 14)
                .padding(.vertical, 6)
                .background(
                    Capsule().fill(biz.tint.softFill)
                        .overlay(Capsule().strokeBorder(biz.tint.color.opacity(0.4), lineWidth: 1))
                )
            }
            CallStatusCapsule(title: statusTitle)
        }
    }

    private var bigAvatar: some View {
        let contact = appState.contacts.first(where: { $0.primaryNumber == live.number })
        return ZStack {
            AvatarView(
                initials: contact?.initials ?? String(live.displayName.prefix(2)).uppercased(),
                gradientIndex: contact?.gradientIndex ?? 0,
                size: 120
            )
            .shadow(color: Color(red: 0.49, green: 0.23, blue: 0.93).opacity(0.6), radius: 18, y: 12)
            PulseRing().frame(width: 136, height: 136)
        }
    }

    private var controlsGrid: some View {
        let columns = [GridItem(.flexible()), GridItem(.flexible()), GridItem(.flexible())]
        return LazyVGrid(columns: columns, spacing: 18) {
            controlButton(label: "Mute",
                          system: isMuted ? "mic.slash.fill" : "mic.fill",
                          active: isMuted) {
                isMuted.toggle()
                appState.setVoiceMuted(isMuted)
            }
            controlButton(label: "Keypad",
                          system: "circle.grid.3x3.fill",
                          active: keypadOpen) { keypadOpen.toggle() }
            controlButton(label: "Speaker",
                          system: onSpeaker ? "speaker.wave.3.fill" : "speaker.wave.2.fill",
                          active: onSpeaker) {
                onSpeaker.toggle()
                VoiceAudioSession.setSpeaker(onSpeaker)
            }
            controlButton(label: "Add", system: "person.badge.plus", active: false) {}
            controlButton(label: "Hold", system: "pause.circle.fill", active: false) {}
            controlButton(label: "Transfer", system: "arrow.uturn.right", active: false) {}
        }
    }

    private func controlButton(label: String, system: String, active: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            VStack(spacing: 6) {
                Image(systemName: system)
                    .font(.system(size: 20))
                    .foregroundStyle(active ? Color(red: 0.10, green: 0.04, blue: 0.18) : .white)
                    .frame(width: 60, height: 60)
                    .background(
                        Circle()
                            .fill(active ? Color.white.opacity(0.95) : Color.white.opacity(0.1))
                            .overlay(
                                Circle().strokeBorder(Color.white.opacity(active ? 0.0 : 0.15), lineWidth: 1)
                            )
                    )
                Text(label).font(.system(size: 11, weight: .medium)).foregroundStyle(Theme.textDim)
            }
        }
        .buttonStyle(.plain)
    }

    private var endButton: some View {
        Button {
            appState.endActiveCall()
        } label: {
            Image(systemName: "phone.down.fill")
                .font(.system(size: 26))
                .foregroundStyle(.white)
                .frame(width: 68, height: 68)
                .background(Theme.endGradient)
                .clipShape(Circle())
                .shadow(color: Color(red: 0.94, green: 0.27, blue: 0.27).opacity(0.55),
                        radius: 18, y: 10)
        }
        .buttonStyle(.plain)
    }

    private var formattedElapsed: String {
        let m = elapsed / 60
        let s = elapsed % 60
        return String(format: "%02d:%02d", m, s)
    }

    private func startTimer() {
        timer?.invalidate()
        timer = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { _ in
            // Hop to MainActor — closure is @Sendable in MainActor-default isolation.
            Task { @MainActor in
                elapsed += 1
            }
        }
    }
}

#Preview {
    let state = AppState.previewMock()
    let biz = state.businesses.first!
    let contact = state.contacts.first!
    return ActiveCallView(context: CallContext(
        displayName: contact.name,
        number: contact.primaryNumber,
        businessId: biz.id,
        direction: .incoming,
        startedAt: Date(),
        voiceState: .connected
    ))
    .environment(state)
    .preferredColorScheme(.dark)
}
