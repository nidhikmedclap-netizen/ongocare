import SwiftUI

// Matches prototype #workoutTab — full implementation in Phase 14
struct WorkoutView: View {
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: OngoSpacing.md) {
                Text("Workout")
                    .ongoHeadlineStyle()
                    .padding(.horizontal, OngoSpacing.lg)
                    .padding(.top, OngoSpacing.md)

                Text("Your personalized workout plan will appear here after your first doctor visit.")
                    .font(OngoFont.body())
                    .foregroundStyle(Color.ongoTextSecondary)
                    .padding(.horizontal, OngoSpacing.lg)
            }
            .padding(.bottom, 100)
        }
        .background(Color.ongoBackground)
        .navigationTitle("Workout")
        .navigationBarTitleDisplayMode(.large)
    }
}
