//
//  ConversationView.swift
//  TwilioCallApp
//
//  Single thread. Header shows business identity; composer placeholder
//  reminds the user which line they're replying as.
//

import SwiftUI

struct ConversationView: View {
    let conversationId: UUID
    @Environment(AppState.self) private var appState
    @State private var draft: String = ""

    private var convo: Conversation? {
        appState.conversations.first(where: { $0.id == conversationId })
    }
    private var business: Business? {
        convo.flatMap { appState.business($0.businessId) }
    }
    private var contact: Contact? {
        convo.flatMap { appState.contact($0.contactId) }
    }

    var body: some View {
        ZStack {
            Theme.background.ignoresSafeArea()
            VStack(spacing: 0) {
                header
                Divider().background(Color.white.opacity(0.06))

                ScrollView {
                    VStack(alignment: .leading, spacing: 8) {
                        if let messages = convo?.messages {
                            ForEach(messages) { m in
                                BubbleRow(message: m)
                            }
                        }
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 14)
                }

                composer
            }
        }
        .navigationBarBackButtonHidden(true)
        .toolbar(.hidden, for: .navigationBar)
    }

    @Environment(\.dismiss) private var dismiss

    private var header: some View {
        HStack(spacing: 10) {
            Button { dismiss() } label: {
                Image(systemName: "chevron.left")
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundStyle(Theme.accentLavender)
            }
            .padding(.trailing, 4)

            AvatarView(initials: contact?.initials ?? "·",
                       gradientIndex: contact?.gradientIndex ?? 5,
                       size: 36,
                       businessDotColor: business?.tint.color)

            VStack(alignment: .leading, spacing: 2) {
                Text(convo?.displayName ?? "")
                    .font(.system(size: 15, weight: .semibold))
                HStack(spacing: 6) {
                    if let biz = business {
                        BusinessChip(business: biz, compact: true)
                    }
                    Text(convo?.rawNumber ?? "")
                        .font(.system(size: 11))
                        .foregroundStyle(Theme.textFade)
                }
            }
            Spacer()
            Button {
                if let convo, let biz = business {
                    appState.outboundBusinessId = biz.id
                    appState.dialedNumber = convo.rawNumber
                    appState.startOutboundCall()
                }
            } label: {
                Image(systemName: "phone.fill")
                    .font(.system(size: 14))
                    .foregroundStyle(Color(red: 0.13, green: 0.77, blue: 0.37))
                    .frame(width: 34, height: 34)
                    .background(Circle().fill(Color(red: 0.13, green: 0.77, blue: 0.37).opacity(0.15)))
            }
        }
        .padding(.horizontal, 16)
        .padding(.top, 6)
        .padding(.bottom, 12)
    }

    private var composer: some View {
        HStack(spacing: 10) {
            Image(systemName: "plus")
                .font(.system(size: 18, weight: .semibold))
                .foregroundStyle(Theme.accentLavender)

            TextField(text: $draft) {
                Text("Reply as \(business?.name ?? "")…")
                    .foregroundStyle(Theme.textFade)
            }
            .textFieldStyle(.plain)
            .padding(.horizontal, 14)
            .padding(.vertical, 10)
            .background(
                Capsule()
                    .fill(Color.white.opacity(0.08))
                    .overlay(Capsule().strokeBorder(Color.white.opacity(0.1), lineWidth: 1))
            )

            Button {
                guard !draft.isEmpty else { return }
                appState.sendMessage(in: conversationId, body: draft)
                draft = ""
            } label: {
                Image(systemName: "paperplane.fill")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(.white)
                    .frame(width: 34, height: 34)
                    .background(Theme.primaryGradient)
                    .clipShape(Circle())
            }
            .opacity(draft.isEmpty ? 0.5 : 1)
            .disabled(draft.isEmpty)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
        .background(
            Color(red: 0.04, green: 0.02, blue: 0.08).opacity(0.7)
        )
        .overlay(
            Rectangle().fill(Color.white.opacity(0.08)).frame(height: 1),
            alignment: .top
        )
    }
}

private struct BubbleRow: View {
    let message: Message

    var body: some View {
        HStack(alignment: .bottom) {
            if message.direction == .outbound { Spacer(minLength: 40) }
            VStack(alignment: message.direction == .outbound ? .trailing : .leading, spacing: 4) {
                Text(message.body)
                    .font(.system(size: 14))
                    .foregroundStyle(.white)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 10)
                    .background(bubbleBackground)
                    .clipShape(BubbleShape(direction: message.direction))
                if message.direction == .outbound {
                    outboundStatusLabel
                }
            }
            .layoutPriority(1)
            if message.direction == .inbound { Spacer(minLength: 40) }
        }
    }

    @ViewBuilder
    private var outboundStatusLabel: some View {
        switch message.status {
        case .sending:
            Text("Sending…")
                .font(.system(size: 11))
                .foregroundStyle(Theme.textFade)
        case .failed:
            Text("Not sent — check Messaging alert or Settings bearer token")
                .font(.system(size: 11))
                .foregroundStyle(Color(red: 1, green: 0.45, blue: 0.45))
                .multilineTextAlignment(.trailing)
        case .sent:
            Text("Sent")
                .font(.system(size: 11))
                .foregroundStyle(Theme.textFade)
        case .delivered:
            Text("Delivered")
                .font(.system(size: 11))
                .foregroundStyle(Theme.textFade)
        }
    }

    @ViewBuilder
    private var bubbleBackground: some View {
        if message.direction == .outbound {
            Theme.primaryGradient
        } else {
            Color.white.opacity(0.08)
        }
    }
}

private struct BubbleShape: Shape {
    let direction: Message.Direction
    func path(in rect: CGRect) -> Path {
        let radius: CGFloat = 20
        let small: CGFloat = 6
        let tl = direction == .inbound ? radius : radius
        let tr = direction == .inbound ? radius : radius
        let bl = direction == .inbound ? small : radius
        let br = direction == .inbound ? radius : small

        var p = Path()
        p.move(to: CGPoint(x: rect.minX + tl, y: rect.minY))
        p.addLine(to: CGPoint(x: rect.maxX - tr, y: rect.minY))
        p.addArc(center: CGPoint(x: rect.maxX - tr, y: rect.minY + tr),
                 radius: tr, startAngle: .degrees(-90), endAngle: .degrees(0), clockwise: false)
        p.addLine(to: CGPoint(x: rect.maxX, y: rect.maxY - br))
        p.addArc(center: CGPoint(x: rect.maxX - br, y: rect.maxY - br),
                 radius: br, startAngle: .degrees(0), endAngle: .degrees(90), clockwise: false)
        p.addLine(to: CGPoint(x: rect.minX + bl, y: rect.maxY))
        p.addArc(center: CGPoint(x: rect.minX + bl, y: rect.maxY - bl),
                 radius: bl, startAngle: .degrees(90), endAngle: .degrees(180), clockwise: false)
        p.addLine(to: CGPoint(x: rect.minX, y: rect.minY + tl))
        p.addArc(center: CGPoint(x: rect.minX + tl, y: rect.minY + tl),
                 radius: tl, startAngle: .degrees(180), endAngle: .degrees(270), clockwise: false)
        p.closeSubpath()
        return p
    }
}

#Preview {
    let state = AppState.previewMock()
    return NavigationStack {
        ConversationView(conversationId: state.conversations.first!.id)
    }
    .environment(state)
    .preferredColorScheme(.dark)
}
