import SwiftUI

// MARK: - Spacing tokens (extracted from prototype CSS)
enum OngoSpacing {
    static let xxs: CGFloat = 4
    static let xs: CGFloat  = 8
    static let sm: CGFloat  = 12
    static let md: CGFloat  = 16
    static let lg: CGFloat  = 20
    static let xl: CGFloat  = 24
    static let xxl: CGFloat = 32
    static let xxxl: CGFloat = 48
}

// MARK: - Border radius tokens
enum OngoRadius {
    static let sm: CGFloat   = 8
    static let md: CGFloat   = 14    // standard card
    static let lg: CGFloat   = 22    // hero card
    static let xl: CGFloat   = 32    // CTA button
    static let pill: CGFloat = 999   // full pill / avatar
}

// MARK: - Shadow style
extension View {
    func ongoCardShadow() -> some View {
        self.shadow(color: .black.opacity(0.06), radius: 8, x: 0, y: 2)
    }

    func ongoElevatedShadow() -> some View {
        self.shadow(color: .black.opacity(0.12), radius: 16, x: 0, y: 4)
    }
}
