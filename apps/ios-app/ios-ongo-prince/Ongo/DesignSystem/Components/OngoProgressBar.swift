import SwiftUI

// MARK: - Linear progress bar (survey top bar, daily action progress)
struct OngoProgressBar: View {
    var progress: Double // 0.0 – 1.0
    var color: Color = .ongoPrimary
    var height: CGFloat = 4

    var body: some View {
        GeometryReader { geo in
            ZStack(alignment: .leading) {
                Capsule()
                    .fill(Color.ongoBorder)
                Capsule()
                    .fill(color)
                    .frame(width: max(0, geo.size.width * progress))
            }
        }
        .frame(height: height)
        .animation(.spring(response: 0.4, dampingFraction: 0.85), value: progress)
    }
}

// MARK: - Circular ring progress (step tracker, calorie macro rings)
struct OngoRingView: View {
    var progress: Double // 0.0 – 1.0
    var lineWidth: CGFloat = 8
    var color: Color = .ongoPrimary
    var size: CGFloat = 80

    var body: some View {
        ZStack {
            Circle()
                .stroke(color.opacity(0.15), lineWidth: lineWidth)
            Circle()
                .trim(from: 0, to: progress)
                .stroke(color, style: StrokeStyle(lineWidth: lineWidth, lineCap: .round))
                .rotationEffect(.degrees(-90))
                .animation(.spring(response: 0.5, dampingFraction: 0.8), value: progress)
        }
        .frame(width: size, height: size)
    }
}

// MARK: - Segmented section progress dots (survey section stepper)
struct SurveySectionStepper: View {
    let totalSections: Int
    let currentSection: Int

    var body: some View {
        HStack(spacing: OngoSpacing.xxs) {
            ForEach(0..<totalSections, id: \.self) { i in
                Capsule()
                    .fill(i <= currentSection ? Color.ongoPrimary : Color.ongoBorder)
                    .frame(width: i == currentSection ? 20 : 6, height: 6)
                    .animation(.spring(response: 0.35), value: currentSection)
            }
        }
    }
}
