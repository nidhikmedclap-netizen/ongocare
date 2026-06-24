//
//  BusinessDetailView.swift
//  TwilioCallApp
//
//  Per-business config: color, ringtone, greeting prompt, hours, routing.
//  All of this lives keyed by the Twilio number so inbound calls can
//  surface the right context immediately.
//

import SwiftUI

struct BusinessDetailView: View {
    let business: Business
    @State private var voicemailEnabled: Bool = true

    var body: some View {
        ZStack {
            Theme.background.ignoresSafeArea()
            ScrollView {
                VStack(spacing: 14) {
                    hero
                    statsGrid
                        .padding(.horizontal, 16)
                    section("Display") {
                        row(icon: "drop.fill",
                            iconBg: business.tint.color,
                            label: "Color",
                            value: business.tint.rawValue.capitalized,
                            valueColor: business.tint.color)
                        divider
                        row(icon: "music.note",
                            iconBg: nil,
                            label: "Custom Ringtone",
                            value: "\(business.ringtoneName) ›")
                    }
                    section("Greeting & Hours") {
                        VStack(alignment: .leading, spacing: 4) {
                            HStack(spacing: 12) {
                                iconBubble(system: "message.fill",
                                           bg: LinearGradient(colors: [Color(red: 0.13, green: 0.77, blue: 0.37), Color(red: 0.09, green: 0.64, blue: 0.29)],
                                                              startPoint: .topLeading, endPoint: .bottomTrailing))
                                Text("Greeting prompt")
                                    .font(.system(size: 14))
                                Spacer()
                            }
                            Text("\u{201C}\(business.greetingPrompt)\u{201D}")
                                .font(.system(size: 12))
                                .foregroundStyle(Theme.textDim)
                                .padding(.leading, 42)
                                .padding(.bottom, 6)
                        }
                        divider
                        row(icon: "clock.fill",
                            iconBg: nil,
                            label: "Business hours",
                            value: "\(business.businessHours) ›")
                        divider
                        toggleRow(icon: "envelope.badge.fill",
                                  label: "After-hours voicemail",
                                  isOn: $voicemailEnabled)
                    }
                    section("Routing") {
                        row(icon: "shippingbox.fill",
                            iconBg: nil,
                            label: "Forward when busy",
                            value: "Voicemail ›")
                    }
                    Spacer(minLength: 30)
                }
                .padding(.bottom, 30)
            }
        }
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button("Edit") {}
                    .tint(Theme.accentLavender)
            }
        }
    }

    private var hero: some View {
        VStack(spacing: 14) {
            Text(business.initials)
                .font(.system(size: 28, weight: .bold))
                .foregroundStyle(.white)
                .frame(width: 80, height: 80)
                .background(
                    RoundedRectangle(cornerRadius: 22, style: .continuous)
                        .fill(LinearGradient(
                            colors: [business.tint.color, business.tint.color.opacity(0.7)],
                            startPoint: .topLeading, endPoint: .bottomTrailing
                        ))
                )
                .shadow(color: business.tint.color.opacity(0.4), radius: 16, y: 12)

            Text(business.name)
                .font(.system(size: 22, weight: .bold))

            HStack(spacing: 6) {
                Text(business.twilioNumber)
                    .font(.system(size: 13))
                    .foregroundStyle(Theme.textFade)
                Text("·")
                    .foregroundStyle(Theme.textFade)
                HStack(spacing: 4) {
                    Circle()
                        .fill(business.isActive ? Color(red: 0.13, green: 0.77, blue: 0.37) : Color(red: 0.96, green: 0.62, blue: 0.04))
                        .frame(width: 6, height: 6)
                    Text(business.isActive ? "Active" : "After hours")
                        .font(.system(size: 13))
                        .foregroundStyle(business.isActive ? Color(red: 0.13, green: 0.77, blue: 0.37) : Color(red: 0.96, green: 0.62, blue: 0.04))
                }
            }
        }
        .padding(.top, 20)
    }

    private var statsGrid: some View {
        HStack(spacing: 10) {
            statCard(value: "\(business.todayCallCount)", label: "Calls today")
            statCard(value: "\(business.todayMessageCount)", label: "Messages")
            statCard(value: "2", label: "Missed")
        }
    }

    private func statCard(value: String, label: String) -> some View {
        VStack(spacing: 2) {
            Text(value).font(.system(size: 20, weight: .bold))
            Text(label.uppercased())
                .font(.system(size: 10, weight: .semibold))
                .tracking(0.7)
                .foregroundStyle(Theme.textFade)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 10)
        .glassCard(corner: 12)
    }

    @ViewBuilder
    private func section<Content: View>(_ title: String, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            SectionTitle(text: title)
                .padding(.horizontal, 22)
            VStack(spacing: 0) {
                content()
            }
            .padding(.vertical, 4)
            .glassCard()
            .padding(.horizontal, 16)
        }
    }

    private func row(icon: String,
                     iconBg: Color?,
                     label: String,
                     value: String,
                     valueColor: Color = Theme.textFade) -> some View {
        HStack(spacing: 12) {
            iconBubble(system: icon,
                       bg: iconBg.map { LinearGradient(colors: [$0, $0.opacity(0.7)], startPoint: .topLeading, endPoint: .bottomTrailing) }
                            ?? Theme.primaryGradient)
            Text(label).font(.system(size: 14))
            Spacer()
            Text(value).font(.system(size: 13)).foregroundStyle(valueColor)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 12)
    }

    private func toggleRow(icon: String, label: String, isOn: Binding<Bool>) -> some View {
        HStack(spacing: 12) {
            iconBubble(system: icon, bg: Theme.primaryGradient)
            Text(label).font(.system(size: 14))
            Spacer()
            Toggle("", isOn: isOn)
                .labelsHidden()
                .tint(Theme.accentLavender)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 12)
    }

    private func iconBubble(system: String, bg: LinearGradient) -> some View {
        Image(systemName: system)
            .font(.system(size: 13))
            .foregroundStyle(.white)
            .frame(width: 30, height: 30)
            .background(RoundedRectangle(cornerRadius: 8, style: .continuous).fill(bg))
    }

    private var divider: some View {
        Rectangle().fill(Color.white.opacity(0.05)).frame(height: 1)
    }
}

#Preview {
    let state = AppState.previewMock()
    return NavigationStack {
        BusinessDetailView(business: state.businesses.first!)
    }
    .environment(state)
    .preferredColorScheme(.dark)
}
