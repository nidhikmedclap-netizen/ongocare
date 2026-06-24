import SwiftUI

extension Color {
    // MARK: - Brand Greens
    static let ongoPrimary      = Color(hex: "#357E5D")
    static let ongoGreenLight   = Color(hex: "#5ca87f")
    static let ongoGreenDark    = Color(hex: "#2a6a4d")
    static let ongoGreenMuted   = Color(hex: "#357E5D").opacity(0.12)

    // MARK: - Backgrounds
    static let ongoBackground   = Color(hex: "#f7f7f5")
    static let ongoCard         = Color(hex: "#ffffff")
    static let ongoCardAlt      = Color(hex: "#f0f0f0")
    static let ongoSurface      = Color(hex: "#f5f5f3")

    // MARK: - Accent
    static let ongoOrange       = Color(hex: "#E07A3C")
    static let ongoOrangeMuted  = Color(hex: "#E07A3C").opacity(0.12)

    // MARK: - Text
    static let ongoTextPrimary  = Color(hex: "#1a1a1a")
    static let ongoTextSecondary = Color(hex: "#777777")
    static let ongoTextTertiary = Color(hex: "#aaaaaa")
    static let ongoTextOnDark   = Color.white

    // MARK: - Semantic
    static let ongoError        = Color(hex: "#c0392b")
    static let ongoSuccess      = Color(hex: "#1f8a45")
    static let ongoWarning      = Color(hex: "#E07A3C")

    // MARK: - Daily Checkin Icons
    static let ongoWater        = Color(hex: "#3a9fd8")
    static let ongoMood         = Color(hex: "#f5a623")
    static let ongoSteps        = Color(hex: "#5ca87f")
    static let ongoMeds         = Color(hex: "#9b59b6")

    // MARK: - Borders
    static let ongoBorder       = Color(hex: "#e5e5e3")
    static let ongoBorderFocus  = Color(hex: "#357E5D")

    // MARK: - Overlays
    static let ongoScrim        = Color.black.opacity(0.45)
    static let ongoSheetHandle  = Color(hex: "#d0d0ce")
}

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3:
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6:
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8:
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (255, 0, 0, 0)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}
