import SwiftUI

// Replaces the stub CalorieTrackerView — matches prototype #calPage in full
struct CalorieTrackerFullView: View {
    @Environment(AppState.self) private var appState
    @State private var vm = CalorieTrackerViewModel()
    @State private var showDatePicker = false

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(spacing: OngoSpacing.md) {
                summaryCard
                aiToolsRow
                mealListCard
            }
            .padding(.horizontal, OngoSpacing.md)
            .padding(.top, OngoSpacing.md)
            .padding(.bottom, 120)
        }
        .background(Color.ongoBackground)
        .navigationTitle("Calorie Tracker")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button {
                    showDatePicker = true
                } label: {
                    HStack(spacing: 4) {
                        Image(systemName: "calendar")
                        Text(vm.selectedDate.relativeDay)
                            .font(OngoFont.caption())
                    }
                    .foregroundStyle(Color.ongoPrimary)
                }
            }
        }
        .sheet(isPresented: $showDatePicker) {
            DatePicker("Select date", selection: $vm.selectedDate, in: ...Date(), displayedComponents: [.date])
                .datePickerStyle(.graphical)
                .tint(Color.ongoPrimary)
                .padding()
                .presentationDetents([.medium])
                .onChange(of: vm.selectedDate) { _, date in
                    guard let userId = appState.ongoUser?.id else { return }
                    vm.changeDate(to: date, userId: userId)
                    showDatePicker = false
                }
        }
        .sheet(isPresented: $vm.showLogMeal) {
            LogMealSheet(userId: appState.ongoUser?.id ?? "", onSave: { entry in
                // Optimistic insert — listener will reconcile
                vm.entries.append(entry)
            })
            .presentationDetents([.large])
            .presentationDragIndicator(.visible)
        }
        .sheet(isPresented: $vm.showMealPlan) {
            MealPlanView()
                .presentationDetents([.large])
        }
        .task {
            if let userId = appState.ongoUser?.id {
                vm.load(userId: userId, user: appState.ongoUser)
            }
        }
        .onDisappear { vm.cleanup() }
    }

    // MARK: - Summary card (calories left + macro rings)
    private var summaryCard: some View {
        OngoCard(cornerRadius: OngoRadius.lg) {
            VStack(spacing: OngoSpacing.md) {
                // Calories left row
                HStack(alignment: .firstTextBaseline) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Calories left")
                            .font(OngoFont.caption())
                            .foregroundStyle(Color.ongoTextSecondary)
                        HStack(alignment: .lastTextBaseline, spacing: 4) {
                            Text("\(vm.caloriesLeft)")
                                .font(.system(size: 44, weight: .heavy))
                                .foregroundStyle(Color.ongoTextPrimary)
                                .contentTransition(.numericText())
                            Text("kcal")
                                .font(OngoFont.subheadline())
                                .foregroundStyle(Color.ongoTextSecondary)
                        }
                    }
                    Spacer()
                    // Calorie flame progress
                    ZStack {
                        OngoRingView(progress: vm.caloriesProgress, lineWidth: 10, color: Color.ongoOrange, size: 64)
                        Image(systemName: "flame.fill")
                            .font(.system(size: 22))
                            .foregroundStyle(Color.ongoOrange)
                    }
                }

                // Progress bar
                OngoProgressBar(progress: vm.caloriesProgress, color: Color.ongoOrange, height: 6)

                // Macro rings row
                HStack(spacing: 0) {
                    macroRing(label: "Protein",
                              current: Int(vm.totalProtein),
                              goal: vm.goal.protein,
                              progress: vm.proteinProgress,
                              color: Color(hex: "#5c6bc0"))
                    macroRing(label: "Carbs",
                              current: Int(vm.totalCarbs),
                              goal: vm.goal.carbs,
                              progress: vm.carbsProgress,
                              color: Color(hex: "#26a69a"))
                    macroRing(label: "Fat",
                              current: Int(vm.totalFat),
                              goal: vm.goal.fat,
                              progress: vm.fatProgress,
                              color: Color(hex: "#ef5350"))
                }
            }
        }
    }

    private func macroRing(label: String, current: Int, goal: Int, progress: Double, color: Color) -> some View {
        VStack(spacing: OngoSpacing.xs) {
            ZStack {
                OngoRingView(progress: progress, lineWidth: 7, color: color, size: 60)
                Text("\(Int(progress * 100))%")
                    .font(OngoFont.label(11))
                    .foregroundStyle(Color.ongoTextPrimary)
            }
            Text(label)
                .font(OngoFont.caption(11))
                .foregroundStyle(Color.ongoTextSecondary)
            Text("\(current)/\(goal)g")
                .font(OngoFont.label(10))
                .foregroundStyle(Color.ongoTextTertiary)
        }
        .frame(maxWidth: .infinity)
    }

    // MARK: - AI tools row (beta waitlist per Q5 decision)
    private var aiToolsRow: some View {
        HStack(spacing: OngoSpacing.sm) {
            aiBetaCard(
                icon: "camera.fill",
                title: "Snap Meal",
                sub: "Photo → instant calories",
                feature: "snap_meal"
            )
            aiBetaCard(
                icon: "doc.text.fill",
                title: "Meal Plan",
                sub: "Personalized for your goals",
                feature: "meal_plan"
            )
        }
    }

    private func aiBetaCard(icon: String, title: String, sub: String, feature: String) -> some View {
        Button {
            if feature == "meal_plan" {
                vm.showMealPlan = true
            } else {
                AnalyticsService.logAIBetaWaitlistJoined(feature: feature)
            }
        } label: {
            VStack(alignment: .leading, spacing: OngoSpacing.xs) {
                Image(systemName: icon)
                    .font(.system(size: 22))
                    .foregroundStyle(Color.ongoPrimary)
                HStack(spacing: 4) {
                    Text(title).font(OngoFont.subheadline(13))
                    OngoTagPill(label: "AI", color: Color.ongoOrange, style: .tinted)
                }
                Text(sub)
                    .font(OngoFont.caption(11))
                    .foregroundStyle(Color.ongoTextSecondary)
                    .lineLimit(2)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(OngoSpacing.sm)
            .background(Color.ongoCard)
            .clipShape(RoundedRectangle(cornerRadius: OngoRadius.md))
            .ongoCardShadow()
        }
    }

    // MARK: - Meal list card
    private var mealListCard: some View {
        VStack(alignment: .leading, spacing: OngoSpacing.sm) {
            // Category filter tabs
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: OngoSpacing.xs) {
                    categoryTab(label: "All", category: nil)
                    ForEach(CalorieEntry.MealCategory.allCases, id: \.self) { cat in
                        categoryTab(label: cat.displayName, category: cat)
                    }
                }
                .padding(.horizontal, OngoSpacing.xxs)
            }

            // Entries
            if vm.filteredEntries.isEmpty {
                emptyMealState
            } else {
                ForEach(vm.filteredEntries) { entry in
                    mealRow(entry: entry)
                }
            }
        }
        .padding(OngoSpacing.md)
        .background(Color.ongoCard)
        .clipShape(RoundedRectangle(cornerRadius: OngoRadius.md))
        .ongoCardShadow()
        .overlay(alignment: .bottomTrailing) {
            logMealFAB
        }
    }

    private func categoryTab(label: String, category: CalorieEntry.MealCategory?) -> some View {
        Button {
            withAnimation(.easeInOut(duration: 0.15)) { vm.selectedCategory = category }
        } label: {
            Text(label)
                .font(OngoFont.subheadline(13))
                .foregroundStyle(vm.selectedCategory == category ? Color.white : Color.ongoTextSecondary)
                .padding(.horizontal, OngoSpacing.sm)
                .padding(.vertical, OngoSpacing.xxs)
                .background(vm.selectedCategory == category ? Color.ongoPrimary : Color.ongoCardAlt)
                .clipShape(Capsule())
        }
    }

    @ViewBuilder private func mealRow(entry: CalorieEntry) -> some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text(entry.foodName)
                    .font(OngoFont.subheadline(14))
                    .foregroundStyle(Color.ongoTextPrimary)
                HStack(spacing: OngoSpacing.xs) {
                    Text(entry.mealCategory.displayName)
                        .font(OngoFont.label(10))
                        .foregroundStyle(Color.ongoTextTertiary)
                    if let serving = entry.servingSize {
                        Text("· \(serving)")
                            .font(OngoFont.label(10))
                            .foregroundStyle(Color.ongoTextTertiary)
                    }
                }
            }
            Spacer()
            VStack(alignment: .trailing, spacing: 2) {
                Text("\(entry.calories) kcal")
                    .font(OngoFont.subheadline(13))
                    .foregroundStyle(Color.ongoOrange)
                Text("P \(Int(entry.protein))g · C \(Int(entry.carbs))g · F \(Int(entry.fat))g")
                    .font(OngoFont.caption(10))
                    .foregroundStyle(Color.ongoTextTertiary)
            }
        }
        .padding(.vertical, OngoSpacing.xs)
        Divider()
    }

    private var emptyMealState: some View {
        VStack(spacing: OngoSpacing.xs) {
            Image(systemName: "fork.knife.circle")
                .font(.system(size: 36))
                .foregroundStyle(Color.ongoTextTertiary)
            Text("No meals logged yet")
                .font(OngoFont.body())
                .foregroundStyle(Color.ongoTextSecondary)
            Text("Tap the + button to log your first meal today.")
                .font(OngoFont.caption())
                .foregroundStyle(Color.ongoTextTertiary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(OngoSpacing.xl)
    }

    private var logMealFAB: some View {
        Button { vm.showLogMeal = true } label: {
            Image(systemName: "plus")
                .font(.system(size: 22, weight: .bold))
                .foregroundStyle(.white)
                .frame(width: 52, height: 52)
                .background(Color.ongoPrimary)
                .clipShape(Circle())
                .ongoElevatedShadow()
        }
        .padding(OngoSpacing.sm)
    }
}
