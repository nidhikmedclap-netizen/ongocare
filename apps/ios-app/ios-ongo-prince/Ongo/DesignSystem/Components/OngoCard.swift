import SwiftUI

// MARK: - Standard Card Container
struct OngoCard<Content: View>: View {
    var padding: CGFloat = OngoSpacing.md
    var cornerRadius: CGFloat = OngoRadius.md
    @ViewBuilder let content: () -> Content

    var body: some View {
        content()
            .padding(padding)
            .background(Color.ongoCard)
            .clipShape(RoundedRectangle(cornerRadius: cornerRadius))
            .ongoCardShadow()
    }
}

// MARK: - Hero Card (green gradient, e.g. ATF card)
struct OngoHeroCard<Content: View>: View {
    @ViewBuilder let content: () -> Content

    var body: some View {
        content()
            .padding(OngoSpacing.lg)
            .background(
                LinearGradient(
                    colors: [Color.ongoPrimary, Color.ongoGreenDark],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
            )
            .clipShape(RoundedRectangle(cornerRadius: OngoRadius.lg))
            .ongoElevatedShadow()
    }
}

// MARK: - Section Header
struct OngoSectionHeader: View {
    let title: String
    var actionLabel: String? = nil
    var action: (() -> Void)? = nil

    var body: some View {
        HStack(alignment: .firstTextBaseline) {
            Text(title)
                .font(OngoFont.headline(18))
                .foregroundStyle(Color.ongoTextPrimary)
            Spacer()
            if let label = actionLabel, let action {
                Button(action: action) {
                    Text(label)
                        .font(OngoFont.caption())
                        .foregroundStyle(Color.ongoPrimary)
                }
            }
        }
    }
}

// MARK: - Daily Action Row Card
struct DailyActionCard: View {
    let icon: String
    let iconColor: Color
    let headline: String
    let status: String
    let ctaLabel: String
    var isDone: Bool = false
    let onTap: () -> Void

    var body: some View {
        HStack(spacing: OngoSpacing.sm) {
            ZStack {
                RoundedRectangle(cornerRadius: OngoRadius.sm)
                    .fill(iconColor.opacity(0.12))
                    .frame(width: 44, height: 44)
                Image(systemName: icon)
                    .font(.system(size: 20))
                    .foregroundStyle(iconColor)
            }

            VStack(alignment: .leading, spacing: 2) {
                Text(headline)
                    .font(OngoFont.subheadline())
                    .foregroundStyle(Color.ongoTextPrimary)
                Text(status)
                    .font(OngoFont.caption())
                    .foregroundStyle(Color.ongoTextSecondary)
            }

            Spacer()

            Button(action: onTap) {
                Text(isDone ? "Done ✓" : "\(ctaLabel) →")
                    .font(OngoFont.label())
                    .foregroundStyle(isDone ? Color.ongoSuccess : Color.ongoPrimary)
                    .padding(.horizontal, OngoSpacing.sm)
                    .padding(.vertical, OngoSpacing.xxs)
                    .background(
                        (isDone ? Color.ongoSuccess : Color.ongoPrimary).opacity(0.1)
                    )
                    .clipShape(Capsule())
            }
        }
        .padding(OngoSpacing.sm)
        .background(Color.ongoCard)
        .clipShape(RoundedRectangle(cornerRadius: OngoRadius.md))
        .ongoCardShadow()
    }
}
