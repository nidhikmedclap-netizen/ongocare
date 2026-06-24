import SwiftUI

// Matches prototype #dietTab — full implementation in Phase 15
struct DietView: View {
    @State private var showCalorieTracker = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: OngoSpacing.md) {
                    Text("Today's Nutrition")
                        .ongoHeadlineStyle()
                        .padding(.horizontal, OngoSpacing.lg)
                        .padding(.top, OngoSpacing.md)

                    // Quick nav to calorie tracker
                    Button {
                        showCalorieTracker = true
                    } label: {
                        OngoCard {
                            HStack {
                                Image(systemName: "flame.fill")
                                    .foregroundStyle(Color.ongoOrange)
                                VStack(alignment: .leading) {
                                    Text("Calorie Tracker")
                                        .font(OngoFont.subheadline())
                                    Text("Log today's meals")
                                        .font(OngoFont.caption())
                                        .foregroundStyle(Color.ongoTextSecondary)
                                }
                                Spacer()
                                Image(systemName: "chevron.right")
                                    .foregroundStyle(Color.ongoTextTertiary)
                            }
                        }
                    }
                    .padding(.horizontal, OngoSpacing.md)

                    // AI features stub (beta waitlist — Q5 decision)
                    OngoCard {
                        VStack(alignment: .leading, spacing: OngoSpacing.sm) {
                            HStack {
                                Image(systemName: "camera.fill")
                                    .foregroundStyle(Color.ongoPrimary)
                                Text("Snap Meal")
                                    .font(OngoFont.subheadline())
                                OngoTagPill(label: "AI", color: Color.ongoOrange, style: .tinted)
                            }
                            Text("Take a photo of your meal for an instant calorie estimate.")
                                .font(OngoFont.caption())
                                .foregroundStyle(Color.ongoTextSecondary)
                            OngoPrimaryButton(title: "Join the AI Beta") {
                                AnalyticsService.logAIBetaWaitlistJoined(feature: "snap_meal")
                            }
                        }
                    }
                    .padding(.horizontal, OngoSpacing.md)

                    OngoCard {
                        VStack(alignment: .leading, spacing: OngoSpacing.sm) {
                            HStack {
                                Image(systemName: "doc.text.fill")
                                    .foregroundStyle(Color.ongoPrimary)
                                Text("Meal Plan AI")
                                    .font(OngoFont.subheadline())
                                OngoTagPill(label: "AI", color: Color.ongoOrange, style: .tinted)
                            }
                            Text("Get a personalized weekly meal plan tailored to your GLP-1 goals.")
                                .font(OngoFont.caption())
                                .foregroundStyle(Color.ongoTextSecondary)
                            OngoPrimaryButton(title: "Request Early Access") {
                                AnalyticsService.logAIBetaWaitlistJoined(feature: "meal_plan")
                            }
                        }
                    }
                    .padding(.horizontal, OngoSpacing.md)
                }
                .padding(.bottom, 100)
            }
            .background(Color.ongoBackground)
            .navigationTitle("Diet")
            .navigationBarTitleDisplayMode(.large)
            .navigationDestination(isPresented: $showCalorieTracker) {
                CalorieTrackerFullView()
            }
        }
    }
}
