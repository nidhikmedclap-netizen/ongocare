import SwiftUI

// MARK: - Type Scale
// Extracted from prototype CSS. All weights use SF Pro via system font.
enum OngoFont {
    // Display — hero headlines on onboarding, survey results
    static func display(_ size: CGFloat = 36) -> Font {
        .system(size: size, weight: .heavy, design: .default)
    }

    // Headline — section titles, card headlines
    static func headline(_ size: CGFloat = 24) -> Font {
        .system(size: size, weight: .heavy, design: .default)
    }

    // Title — tab titles, page titles
    static func title(_ size: CGFloat = 20) -> Font {
        .system(size: size, weight: .bold, design: .default)
    }

    // Subheadline — card subtitles, secondary labels
    static func subheadline(_ size: CGFloat = 15) -> Font {
        .system(size: size, weight: .semibold, design: .default)
    }

    // Body — primary readable text
    static func body(_ size: CGFloat = 14) -> Font {
        .system(size: size, weight: .medium, design: .default)
    }

    // Caption — metadata, timestamps
    static func caption(_ size: CGFloat = 12) -> Font {
        .system(size: size, weight: .medium, design: .default)
    }

    // Label — all-caps tag pills, section eyebrows
    static func label(_ size: CGFloat = 11) -> Font {
        .system(size: size, weight: .bold, design: .default)
    }

    // Mono — numbers in trackers, BMI values
    static func mono(_ size: CGFloat = 14) -> Font {
        .system(size: size, weight: .semibold, design: .monospaced)
    }
}

// MARK: - Tracking / Letter Spacing helpers
extension View {
    func ongoDisplayStyle(size: CGFloat = 36) -> some View {
        self.font(OngoFont.display(size))
            .tracking(-1.5)
            .foregroundStyle(Color.ongoTextPrimary)
    }

    func ongoHeadlineStyle(size: CGFloat = 24) -> some View {
        self.font(OngoFont.headline(size))
            .tracking(-0.6)
            .foregroundStyle(Color.ongoTextPrimary)
    }

    func ongoLabelStyle(size: CGFloat = 11) -> some View {
        self.font(OngoFont.label(size))
            .tracking(1.0)
            .textCase(.uppercase)
            .foregroundStyle(Color.ongoTextSecondary)
    }
}
