//
//  Theme.swift
//  TwilioCallApp
//
//  Centralized colors, gradients, and reusable view modifiers for the
//  glassmorphism + deep-purple aesthetic established in the design mockup.
//

import SwiftUI

enum Theme {

    // MARK: Brand gradient (used for FABs, send button, primary accents)
    static let primaryGradient = LinearGradient(
        colors: [
            Color(red: 0.49, green: 0.23, blue: 0.93),  // #7C3AED
            Color(red: 0.93, green: 0.28, blue: 0.60)   // #EC4899
        ],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )

    static let answerGradient = LinearGradient(
        colors: [
            Color(red: 0.13, green: 0.77, blue: 0.37),
            Color(red: 0.09, green: 0.64, blue: 0.29)
        ],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )

    static let endGradient = LinearGradient(
        colors: [
            Color(red: 0.94, green: 0.27, blue: 0.27),
            Color(red: 0.86, green: 0.15, blue: 0.15)
        ],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )

    // MARK: App background
    static let background = LinearGradient(
        colors: [
            Color(red: 0.118, green: 0.067, blue: 0.275),  // #1E1147
            Color(red: 0.055, green: 0.039, blue: 0.149),  // #0E0A26
            Color(red: 0.086, green: 0.027, blue: 0.122)   // #16071F
        ],
        startPoint: .top,
        endPoint: .bottom
    )

    // MARK: Active call radial background
    static let callBackground = RadialGradient(
        gradient: Gradient(colors: [
            Color(red: 0.49, green: 0.23, blue: 0.93).opacity(0.5),
            .clear
        ]),
        center: UnitPoint(x: 0.3, y: 0.2),
        startRadius: 0,
        endRadius: 380
    )

    // MARK: Solid accents
    static let accentLavender = Color(red: 0.769, green: 0.710, blue: 0.992)  // #C4B5FD
    static let accentPink     = Color(red: 0.94, green: 0.66, blue: 0.97)
    /// Primary body text on dark surfaces (labels, field values).
    static let textPrimary    = Color.white.opacity(0.92)
    static let textDim        = Color.white.opacity(0.65)
    static let textFade       = Color.white.opacity(0.45)

    // MARK: Avatar gradient palette (deterministic by Contact.gradientIndex)
    static let avatarGradients: [LinearGradient] = [
        LinearGradient(colors: [Color(red: 0.49, green: 0.23, blue: 0.93), Color(red: 0.93, green: 0.28, blue: 0.60)],
                       startPoint: .topLeading, endPoint: .bottomTrailing),
        LinearGradient(colors: [Color(red: 0.02, green: 0.71, blue: 0.83), Color(red: 0.49, green: 0.23, blue: 0.93)],
                       startPoint: .topLeading, endPoint: .bottomTrailing),
        LinearGradient(colors: [Color(red: 0.96, green: 0.62, blue: 0.04), Color(red: 0.93, green: 0.28, blue: 0.60)],
                       startPoint: .topLeading, endPoint: .bottomTrailing),
        LinearGradient(colors: [Color(red: 0.13, green: 0.77, blue: 0.37), Color(red: 0.02, green: 0.71, blue: 0.83)],
                       startPoint: .topLeading, endPoint: .bottomTrailing),
        LinearGradient(colors: [Color(red: 0.93, green: 0.28, blue: 0.60), Color(red: 0.96, green: 0.62, blue: 0.04)],
                       startPoint: .topLeading, endPoint: .bottomTrailing),
        LinearGradient(colors: [Color(red: 0.55, green: 0.36, blue: 0.96), Color(red: 0.02, green: 0.71, blue: 0.83)],
                       startPoint: .topLeading, endPoint: .bottomTrailing)
    ]

    static func avatarGradient(for index: Int) -> LinearGradient {
        avatarGradients[((index % avatarGradients.count) + avatarGradients.count) % avatarGradients.count]
    }
}

// MARK: - Reusable modifiers

struct GlassCardModifier: ViewModifier {
    var corner: CGFloat = 16
    func body(content: Content) -> some View {
        content
            .background(
                RoundedRectangle(cornerRadius: corner, style: .continuous)
                    .fill(Color.white.opacity(0.05))
                    .overlay(
                        RoundedRectangle(cornerRadius: corner, style: .continuous)
                            .strokeBorder(Color.white.opacity(0.10), lineWidth: 1)
                    )
            )
    }
}

struct GlassCircleModifier: ViewModifier {
    func body(content: Content) -> some View {
        content
            .background(
                Circle()
                    .fill(.ultraThinMaterial)
                    .overlay(Circle().strokeBorder(Color.white.opacity(0.15), lineWidth: 1))
            )
    }
}

extension View {
    func glassCard(corner: CGFloat = 16) -> some View { modifier(GlassCardModifier(corner: corner)) }
    func glassCircle() -> some View { modifier(GlassCircleModifier()) }

    /// Sets the dark deep-purple background that all top-level screens share.
    func appBackground() -> some View {
        ZStack {
            Theme.background.ignoresSafeArea()
            self
        }
    }
}
