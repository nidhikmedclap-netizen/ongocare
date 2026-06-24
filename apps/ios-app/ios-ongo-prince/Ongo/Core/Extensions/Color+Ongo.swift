import SwiftUI

extension Color {
    // MARK: - BMI category colors (bmiPage gauge)
    static func bmiCategoryColor(for bmi: Double) -> Color {
        switch bmi {
        case ..<18.5: return Color(hex: "#3a9fd8")  // underweight — blue
        case 18.5..<25: return Color.ongoSuccess    // normal — green
        case 25..<30: return Color.ongoOrange       // overweight — orange
        default: return Color.ongoError             // obese — red
        }
    }

    // MARK: - Body fat category colors (fatPage)
    static func bodyFatCategoryColor(for category: BodyMeasurement.BodyFatCategory) -> Color {
        switch category {
        case .essential: return Color(hex: "#3a9fd8")
        case .athlete:   return Color.ongoSuccess
        case .fitness:   return Color.ongoGreenLight
        case .average:   return Color.ongoOrange
        case .obese:     return Color.ongoError
        }
    }

    // MARK: - Visit status color
    static func visitStatusColor(for status: Visit.VisitStatus) -> Color {
        switch status {
        case .scheduled:  return Color.ongoPrimary
        case .inProgress: return Color.ongoOrange
        case .completed:  return Color.ongoSuccess
        case .cancelled, .noShow: return Color.ongoError
        }
    }

    // MARK: - Mood score colors (1–5)
    static func moodColor(for score: Int) -> Color {
        switch score {
        case 1: return Color(hex: "#c0392b")
        case 2: return Color(hex: "#e67e22")
        case 3: return Color.ongoOrange
        case 4: return Color.ongoGreenLight
        case 5: return Color.ongoSuccess
        default: return Color.ongoTextSecondary
        }
    }
}
