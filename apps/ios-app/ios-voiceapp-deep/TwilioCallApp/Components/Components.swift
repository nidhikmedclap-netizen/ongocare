//
//  Components.swift
//  TwilioCallApp
//
//  Small, reusable views: avatars, business chips, filter strips, glass dots.
//

import SwiftUI

// MARK: - Avatar

struct AvatarView: View {
    let initials: String
    var gradientIndex: Int = 0
    var size: CGFloat = 44
    /// If non-nil, draws a small business-color dot at the bottom-right.
    var businessDotColor: Color? = nil

    var body: some View {
        ZStack(alignment: .bottomTrailing) {
            Text(initials)
                .font(.system(size: size * 0.34, weight: .semibold))
                .foregroundStyle(.white)
                .frame(width: size, height: size)
                .background(Theme.avatarGradient(for: gradientIndex))
                .clipShape(Circle())

            if let dot = businessDotColor {
                Circle()
                    .fill(dot)
                    .frame(width: size * 0.32, height: size * 0.32)
                    .overlay(
                        Circle().strokeBorder(Color(red: 0.086, green: 0.027, blue: 0.122), lineWidth: 2)
                    )
                    .offset(x: 1, y: 1)
            }
        }
    }
}

// MARK: - Business chip

struct BusinessChip: View {
    let business: Business
    var compact: Bool = false

    var body: some View {
        HStack(spacing: 5) {
            Circle()
                .fill(business.tint.color)
                .frame(width: compact ? 5 : 6, height: compact ? 5 : 6)
            Text(business.name)
                .font(.system(size: compact ? 9 : 10, weight: .semibold))
                .foregroundStyle(business.tint.softText)
        }
        .padding(.horizontal, compact ? 7 : 8)
        .padding(.vertical, compact ? 1 : 2)
        .background(
            Capsule().fill(business.tint.softFill)
        )
    }
}

// MARK: - Business filter strip (horizontal)

struct BusinessFilterStrip: View {
    let businesses: [Business]
    @Binding var selection: UUID?

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 6) {
                FilterPill(label: "All",
                           dot: Theme.accentLavender,
                           isActive: selection == nil) {
                    selection = nil
                }
                ForEach(businesses) { biz in
                    FilterPill(label: biz.name,
                               dot: biz.tint.color,
                               isActive: selection == biz.id) {
                        selection = (selection == biz.id) ? nil : biz.id
                    }
                }
            }
            .padding(.horizontal, 16)
            .padding(.bottom, 10)
        }
    }
}

private struct FilterPill: View {
    let label: String
    let dot: Color
    let isActive: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 5) {
                Circle().fill(dot).frame(width: 7, height: 7)
                Text(label)
                    .font(.system(size: 11, weight: .semibold))
            }
            .padding(.horizontal, 11)
            .padding(.vertical, 5)
            .foregroundStyle(isActive ? .white : Theme.textDim)
            .background(
                Capsule()
                    .fill(Color.white.opacity(isActive ? 0.15 : 0.06))
                    .overlay(
                        Capsule().strokeBorder(Color.white.opacity(isActive ? 0.2 : 0.08), lineWidth: 1)
                    )
            )
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Pulsing ring (used on big call avatar)

struct PulseRing: View {
    @State private var animating = false

    var body: some View {
        Circle()
            .strokeBorder(Color.white.opacity(0.15), lineWidth: 2)
            .scaleEffect(animating ? 1.3 : 1.0)
            .opacity(animating ? 0 : 0.8)
            .onAppear {
                withAnimation(.easeOut(duration: 2).repeatForever(autoreverses: false)) {
                    animating = true
                }
            }
    }
}

// MARK: - Status bar capsule (small visual nicety; informational only)

struct CallStatusCapsule: View {
    let title: String   // e.g. "CONNECTED · 02:14"
    var body: some View {
        Text(title)
            .font(.system(size: 12, weight: .semibold))
            .tracking(0.6)
            .foregroundStyle(Theme.accentLavender)
    }
}

// MARK: - Section header used in Settings / Business Detail

struct SectionTitle: View {
    let text: String
    var body: some View {
        Text(text.uppercased())
            .font(.system(size: 11, weight: .semibold))
            .tracking(1.1)
            .foregroundStyle(Theme.textFade)
            .padding(.leading, 6)
            .padding(.bottom, 6)
            .frame(maxWidth: .infinity, alignment: .leading)
    }
}
