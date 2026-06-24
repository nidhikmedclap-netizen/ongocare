import SwiftUI

// MARK: - User avatar (initials fallback, photo when available)
struct OngoAvatarView: View {
    var initials: String = "?"
    var photoURL: URL? = nil
    var size: CGFloat = 40
    var backgroundColor: Color = .ongoPrimary

    var body: some View {
        ZStack {
            Circle()
                .fill(backgroundColor)
                .frame(width: size, height: size)

            if let url = photoURL {
                AsyncImage(url: url) { phase in
                    switch phase {
                    case .success(let img):
                        img.resizable()
                            .scaledToFill()
                            .frame(width: size, height: size)
                            .clipShape(Circle())
                    default:
                        initialsView
                    }
                }
            } else {
                initialsView
            }
        }
    }

    private var initialsView: some View {
        Text(initials.prefix(2).uppercased())
            .font(.system(size: size * 0.38, weight: .bold, design: .default))
            .foregroundStyle(.white)
    }
}

// MARK: - Online presence dot
struct OnlineDot: View {
    var body: some View {
        Circle()
            .fill(Color.ongoSuccess)
            .frame(width: 10, height: 10)
            .overlay(
                Circle().stroke(Color.white, lineWidth: 2)
            )
    }
}

// MARK: - Tag pill (plan tier, visit type, status)
struct OngoTagPill: View {
    let label: String
    var color: Color = .ongoPrimary
    var style: Style = .filled

    enum Style { case filled, tinted, outlined }

    var body: some View {
        Text(label.uppercased())
            .font(OngoFont.label(10))
            .tracking(0.8)
            .foregroundStyle(foregroundColor)
            .padding(.horizontal, OngoSpacing.xs)
            .padding(.vertical, 3)
            .background(backgroundColor)
            .clipShape(Capsule())
            .overlay(
                style == .outlined ? Capsule().stroke(color, lineWidth: 1) : nil
            )
    }

    private var foregroundColor: Color {
        switch style {
        case .filled:   return .white
        case .tinted:   return color
        case .outlined: return color
        }
    }

    private var backgroundColor: Color {
        switch style {
        case .filled:   return color
        case .tinted:   return color.opacity(0.12)
        case .outlined: return .clear
        }
    }
}
