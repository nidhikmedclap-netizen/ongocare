import SwiftUI

// MARK: - WhatsApp-style chat bubble (.bk-bubble pattern)
struct ChatBubble: View {
    let text: String
    var isFromUser: Bool = false
    var timestamp: Date? = nil

    var body: some View {
        HStack(alignment: .bottom, spacing: OngoSpacing.xs) {
            if isFromUser { Spacer(minLength: 60) }

            VStack(alignment: isFromUser ? .trailing : .leading, spacing: 4) {
                Text(text)
                    .font(OngoFont.body())
                    .foregroundStyle(isFromUser ? Color.white : Color.ongoTextPrimary)
                    .padding(.horizontal, OngoSpacing.sm)
                    .padding(.vertical, OngoSpacing.xs)
                    .background(isFromUser ? Color.ongoPrimary : Color.ongoCardAlt)
                    .clipShape(
                        RoundedCornerShape(
                            radius: 18,
                            corners: isFromUser
                                ? [.topLeft, .topRight, .bottomLeft]
                                : [.topLeft, .topRight, .bottomRight]
                        )
                    )

                if let ts = timestamp {
                    Text(ts, style: .time)
                        .font(OngoFont.caption(10))
                        .foregroundStyle(Color.ongoTextTertiary)
                }
            }

            if !isFromUser { Spacer(minLength: 60) }
        }
    }
}

// MARK: - Rounded corner helper (only specific corners)
struct RoundedCornerShape: Shape {
    var radius: CGFloat
    var corners: UIRectCorner

    func path(in rect: CGRect) -> Path {
        let path = UIBezierPath(
            roundedRect: rect,
            byRoundingCorners: corners,
            cornerRadii: CGSize(width: radius, height: radius)
        )
        return Path(path.cgPath)
    }
}

// MARK: - Typing indicator (three-dot animation)
struct TypingIndicator: View {
    @State private var phase: Int = 0

    var body: some View {
        HStack(spacing: 5) {
            ForEach(0..<3, id: \.self) { i in
                Circle()
                    .fill(Color.ongoTextSecondary)
                    .frame(width: 8, height: 8)
                    .scaleEffect(phase == i ? 1.3 : 1.0)
                    .animation(
                        .easeInOut(duration: 0.4)
                            .repeatForever()
                            .delay(Double(i) * 0.15),
                        value: phase
                    )
            }
        }
        .padding(.horizontal, OngoSpacing.sm)
        .padding(.vertical, OngoSpacing.xs)
        .background(Color.ongoCardAlt)
        .clipShape(RoundedCornerShape(radius: 18, corners: [.topLeft, .topRight, .bottomRight]))
        .onAppear {
            phase = 0
            withAnimation { phase = 2 }
        }
    }
}

// MARK: - Day separator pill ("Today", "Yesterday")
struct ChatDayPill: View {
    let label: String

    var body: some View {
        Text(label)
            .font(OngoFont.caption(11))
            .foregroundStyle(Color.ongoTextSecondary)
            .padding(.horizontal, OngoSpacing.sm)
            .padding(.vertical, OngoSpacing.xxs)
            .background(Color.ongoCardAlt)
            .clipShape(Capsule())
    }
}
