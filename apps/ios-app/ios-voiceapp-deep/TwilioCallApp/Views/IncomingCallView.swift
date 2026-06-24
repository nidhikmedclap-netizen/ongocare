//
//  IncomingCallView.swift
//  TwilioCallApp
//
//  Full-screen incoming call presentation. The business banner is the
//  first thing the user sees, plus a one-line greeting reminder so they
//  always know how to answer the right line.
//

import SwiftUI

struct IncomingCallView: View {
    let context: CallContext
    @Environment(AppState.self) private var appState

    private var business: Business? { appState.business(context.businessId) }
    private var contact: Contact? {
        appState.contacts.first(where: { $0.primaryNumber == context.number })
    }

    var body: some View {
        ZStack {
            backgroundLayer.ignoresSafeArea()

            VStack(spacing: 6) {
                Spacer().frame(height: 60)

                if let biz = business {
                    incomingBanner(business: biz)
                }
                Text("Line · \(business?.twilioNumber ?? context.number)")
                    .font(.system(size: 11))
                    .tracking(1)
                    .foregroundStyle(Color.white.opacity(0.55))
                    .padding(.top, 6)

                Text("INCOMING CALL")
                    .font(.system(size: 12, weight: .semibold))
                    .tracking(2)
                    .foregroundStyle(Color.white.opacity(0.7))
                    .padding(.top, 14)

                ZStack {
                    Circle()
                        .fill(business?.tint.color.opacity(0.0) ?? .clear)
                    AvatarView(
                        initials: contact?.initials ?? "·",
                        gradientIndex: contact?.gradientIndex ?? 3,
                        size: 130
                    )
                    PulseRing()
                        .frame(width: 146, height: 146)
                }
                .padding(.top, 18)
                .padding(.bottom, 18)

                Text(context.displayName)
                    .font(.system(size: 30, weight: .bold))
                Text("Mobile · \(context.number)")
                    .font(.system(size: 13))
                    .foregroundStyle(Theme.textDim)

                if let biz = business {
                    Text("Greeting: \u{201C}\(biz.greetingPrompt)\u{201D}")
                        .font(.system(size: 12))
                        .foregroundStyle(Color.white.opacity(0.8))
                        .multilineTextAlignment(.center)
                        .lineLimit(2)
                        .padding(.horizontal, 18)
                        .padding(.vertical, 10)
                        .glassCard(corner: 14)
                        .padding(.horizontal, 30)
                        .padding(.top, 14)
                }

                Spacer()

                actionRow
                    .padding(.horizontal, 36)
                    .padding(.bottom, 50)
            }
        }
        .onDisappear {
            IncomingRingtone.stop()
        }
    }

    private var backgroundLayer: some View {
        ZStack {
            LinearGradient(
                colors: [
                    Color(red: 0.04, green: 0.12, blue: 0.10),
                    Color(red: 0.04, green: 0.02, blue: 0.10)
                ],
                startPoint: .top, endPoint: .bottom
            )
            RadialGradient(
                colors: [Color(red: 0.13, green: 0.77, blue: 0.37).opacity(0.35), .clear],
                center: UnitPoint(x: 0.5, y: 0.25),
                startRadius: 0, endRadius: 320
            )
        }
    }

    private func incomingBanner(business: Business) -> some View {
        HStack(spacing: 10) {
            Circle()
                .fill(business.tint.color)
                .frame(width: 9, height: 9)
                .shadow(color: business.tint.color, radius: 12)
            Text(business.name.uppercased())
                .font(.system(size: 13, weight: .bold))
                .tracking(0.5)
        }
        .padding(.horizontal, 18)
        .padding(.vertical, 10)
        .background(
            Capsule()
                .fill(business.tint.softFill)
                .overlay(Capsule().strokeBorder(business.tint.color.opacity(0.5), lineWidth: 1.5))
        )
        .shadow(color: business.tint.color.opacity(0.4), radius: 24, y: 8)
    }

    private var actionRow: some View {
        HStack {
            VStack(spacing: 8) {
                Button {
                    appState.declineIncomingCall()
                } label: {
                    Image(systemName: "phone.down.fill")
                        .font(.system(size: 26))
                        .foregroundStyle(.white)
                        .frame(width: 70, height: 70)
                        .background(Theme.endGradient)
                        .clipShape(Circle())
                        .shadow(color: Color(red: 0.94, green: 0.27, blue: 0.27).opacity(0.55),
                                radius: 18, y: 10)
                }
                .buttonStyle(.plain)
                Text("Decline").font(.system(size: 11)).foregroundStyle(Theme.textDim)
            }

            Spacer()

            VStack(spacing: 8) {
                Button {
                    appState.acceptIncomingCall()
                } label: {
                    Image(systemName: "phone.fill")
                        .font(.system(size: 26))
                        .foregroundStyle(.white)
                        .frame(width: 70, height: 70)
                        .background(Theme.answerGradient)
                        .clipShape(Circle())
                        .shadow(color: Color(red: 0.13, green: 0.77, blue: 0.37).opacity(0.55),
                                radius: 18, y: 10)
                }
                .buttonStyle(.plain)
                .modifier(AcceptBounce())
                Text("Accept").font(.system(size: 11)).foregroundStyle(Theme.textDim)
            }
        }
    }
}

private struct AcceptBounce: ViewModifier {
    @State private var up = false
    func body(content: Content) -> some View {
        content
            .offset(y: up ? -6 : 0)
            .onAppear {
                withAnimation(.easeInOut(duration: 0.7).repeatForever()) {
                    up = true
                }
            }
    }
}

#Preview {
    let state = AppState.previewMock()
    let biz = state.businesses.first!
    let contact = state.contacts.first!
    return IncomingCallView(context: CallContext(
        displayName: contact.name,
        number: contact.primaryNumber,
        businessId: biz.id,
        direction: .incoming,
        startedAt: Date()
    ))
    .environment(state)
    .preferredColorScheme(.dark)
}
