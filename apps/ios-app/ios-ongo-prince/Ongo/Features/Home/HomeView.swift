import SwiftUI

struct HomeView: View {
    @Environment(AppState.self) private var appState
    @State private var vm = HomeViewModel()
    @State private var showSideMenu = false

    var body: some View {
        ZStack(alignment: .leading) {
            mainContent
            if showSideMenu {
                SideMenuView(isShowing: $showSideMenu)
                    .transition(.move(edge: .leading))
                    .zIndex(1)
            }
        }
        .navigationBarHidden(true)
        .task {
            if let user = appState.ongoUser {
                await vm.load(user: user)
            }
        }
        .onDisappear { vm.cleanup() }
        .sheet(isPresented: $vm.showWeightLogModal) {
            WeightLogModal(userId: appState.ongoUser?.id ?? "")
                .presentationDetents([.medium])
                .presentationDragIndicator(.visible)
        }
        .confirmationDialog("Sign out?", isPresented: $vm.showSignOutConfirm, titleVisibility: .visible) {
            Button("Sign out", role: .destructive) { appState.signOut() }
            Button("Stay signed in", role: .cancel) { }
        }
    }

    // MARK: - Main scroll content
    private var mainContent: some View {
        ScrollView(showsIndicators: false) {
            VStack(spacing: 0) {
                atfSection
                    .padding(.bottom, OngoSpacing.md)

                if let user = appState.ongoUser, user.hasActivePlan {
                    activePlanContent
                } else {
                    newUserContent
                }
            }
            .padding(.bottom, 100)  // tab bar clearance
        }
        .background(Color.ongoBackground)
    }

    // MARK: - ATF Section (hero area)
    private var atfSection: some View {
        ZStack(alignment: .bottom) {
            // Green gradient backdrop (matches prototype .atf)
            LinearGradient(
                colors: [Color.ongoPrimary, Color.ongoGreenDark],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .frame(height: 260)

            VStack(spacing: 0) {
                // Greeting row
                HStack {
                    Button {
                        withAnimation(.easeInOut) { showSideMenu = true }
                    } label: {
                        OngoAvatarView(
                            initials: appState.ongoUser?.initials ?? "?",
                            size: 38,
                            backgroundColor: .white.opacity(0.2)
                        )
                    }

                    VStack(alignment: .leading, spacing: 1) {
                        Text("Hello!")
                            .font(OngoFont.caption())
                            .foregroundStyle(.white.opacity(0.7))
                        Text(appState.ongoUser?.firstName ?? "Friend")
                            .font(OngoFont.headline(20))
                            .foregroundStyle(.white)
                    }
                    Spacer()
                }
                .padding(.horizontal, OngoSpacing.lg)
                .padding(.top, OngoSpacing.lg)

                Spacer()

                // Smart ATF carousel
                if !vm.atfMessages.isEmpty {
                    smartATFCard
                        .padding(.horizontal, OngoSpacing.md)
                        .padding(.bottom, OngoSpacing.md)
                } else {
                    defaultHeroCard
                        .padding(.horizontal, OngoSpacing.md)
                        .padding(.bottom, OngoSpacing.md)
                }
            }
        }
        .frame(height: 260)
        .clipShape(RoundedRectangle(cornerRadius: 0))
    }

    // MARK: - Smart ATF card (rotates every 6s)
    private var smartATFCard: some View {
        let messages = vm.atfMessages
        let idx = min(vm.currentATFIndex, messages.count - 1)
        let msg = messages[idx]
        let firstName = appState.ongoUser?.firstName ?? "there"

        return OngoCard(padding: OngoSpacing.md, cornerRadius: OngoRadius.md) {
            HStack(alignment: .top, spacing: OngoSpacing.sm) {
                VStack(alignment: .leading, spacing: OngoSpacing.xs) {
                    OngoTagPill(label: msg.tier.rawValue.uppercased(),
                                color: tierColor(msg.tier),
                                style: .tinted)
                    Text(msg.resolvedText(firstName: firstName))
                        .font(OngoFont.subheadline(14))
                        .foregroundStyle(Color.ongoTextPrimary)
                        .lineLimit(3)
                    if let ctaLabel = msg.ctaLabel {
                        Text(ctaLabel + " →")
                            .font(OngoFont.label())
                            .foregroundStyle(Color.ongoPrimary)
                    }
                }
                Spacer()
                // Carousel dots
                VStack(spacing: 4) {
                    Spacer()
                    ForEach(0..<min(3, messages.count), id: \.self) { i in
                        Circle()
                            .fill(i == idx % 3 ? Color.ongoPrimary : Color.ongoBorder)
                            .frame(width: 6, height: 6)
                    }
                }
            }
        }
        .ongoCardShadow()
    }

    private var defaultHeroCard: some View {
        OngoCard(padding: OngoSpacing.md) {
            VStack(alignment: .leading, spacing: OngoSpacing.xs) {
                Text("Ready to Begin?")
                    .font(OngoFont.headline(22))
                    .foregroundStyle(Color.ongoTextPrimary)
                Text("Complete your profile to unlock your personalized care plan.")
                    .font(OngoFont.body())
                    .foregroundStyle(Color.ongoTextSecondary)
            }
        }
    }

    private func tierColor(_ tier: SmartATFMessage.MessageTier) -> Color {
        switch tier {
        case .urgent:    return Color.ongoError
        case .nudge:     return Color.ongoOrange
        case .celebrate: return Color.ongoSuccess
        case .tip:       return Color.ongoPrimary
        }
    }

    // MARK: - Active plan content
    private var activePlanContent: some View {
        VStack(spacing: OngoSpacing.md) {
            dailyActionsSection
                .padding(.horizontal, OngoSpacing.md)

            if vm.upcomingVisit != nil || vm.activePrescription != nil || vm.assignedDoctor != nil {
                careSection
                    .padding(.horizontal, OngoSpacing.md)
            }

            weightCard
                .padding(.horizontal, OngoSpacing.md)
        }
        .padding(.top, OngoSpacing.md)
    }

    // MARK: - New user content
    private var newUserContent: some View {
        VStack(spacing: OngoSpacing.md) {
            // "Let's get started" nudge cards
            OngoCard {
                VStack(alignment: .leading, spacing: OngoSpacing.xs) {
                    OngoSectionHeader(title: "What's next")
                    VStack(spacing: OngoSpacing.xs) {
                        nextStepRow(icon: "calendar.badge.plus", title: "Book your first visit",
                                    desc: "Meet your Ongo doctor", action: {})
                        nextStepRow(icon: "scale.3d", title: "Log your starting weight",
                                    desc: "Track your progress", action: { vm.showWeightLogModal = true })
                    }
                }
            }
            .padding(.horizontal, OngoSpacing.md)
        }
        .padding(.top, OngoSpacing.md)
    }

    private func nextStepRow(icon: String, title: String, desc: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: OngoSpacing.sm) {
                Image(systemName: icon)
                    .font(.system(size: 20))
                    .foregroundStyle(Color.ongoPrimary)
                    .frame(width: 36)
                VStack(alignment: .leading, spacing: 2) {
                    Text(title).font(OngoFont.subheadline()).foregroundStyle(Color.ongoTextPrimary)
                    Text(desc).font(OngoFont.caption()).foregroundStyle(Color.ongoTextSecondary)
                }
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.system(size: 12))
                    .foregroundStyle(Color.ongoTextTertiary)
            }
        }
    }

    // MARK: - Today's Actions
    private var dailyActionsSection: some View {
        VStack(alignment: .leading, spacing: OngoSpacing.sm) {
            OngoSectionHeader(title: "Today's Actions")
            VStack(spacing: OngoSpacing.xs) {
                dailyActionRow(
                    icon: "drop.fill",
                    color: Color.ongoWater,
                    headline: "Water",
                    status: waterStatus,
                    ctaLabel: "Log",
                    isDone: (todayWaterCups ?? 0) >= 8,
                    action: {}
                )
                dailyActionRow(
                    icon: "face.smiling",
                    color: Color.ongoMood,
                    headline: "Mood",
                    status: moodStatus,
                    ctaLabel: "Check in",
                    isDone: vm.todayCheckin?.mood != nil,
                    action: {}
                )
                dailyActionRow(
                    icon: "figure.walk",
                    color: Color.ongoSteps,
                    headline: "Steps",
                    status: stepsStatus,
                    ctaLabel: "Log",
                    isDone: (vm.todayCheckin?.steps?.steps ?? 0) >= 7000,
                    action: {}
                )
                dailyActionRow(
                    icon: "cross.case.fill",
                    color: Color.ongoMeds,
                    headline: "Medication",
                    status: medsStatus,
                    ctaLabel: "Mark taken",
                    isDone: vm.todayCheckin?.meds?.taken == true,
                    action: {}
                )
            }
        }
    }

    private func dailyActionRow(icon: String, color: Color, headline: String, status: String,
                                 ctaLabel: String, isDone: Bool, action: @escaping () -> Void) -> some View {
        DailyActionCard(icon: icon, iconColor: color, headline: headline,
                        status: status, ctaLabel: ctaLabel, isDone: isDone, onTap: action)
    }

    private var todayWaterCups: Int? { vm.todayCheckin?.water?.cupsLogged }
    private var waterStatus: String {
        if let cups = todayWaterCups { return "\(cups)/8 cups" }
        return "Not logged yet"
    }
    private var moodStatus: String {
        if let mood = vm.todayCheckin?.mood?.score { return "Feeling \(moodLabel(mood))" }
        return "How are you feeling?"
    }
    private var stepsStatus: String {
        if let s = vm.todayCheckin?.steps?.steps { return "\(s) steps today" }
        return "Not logged yet"
    }
    private var medsStatus: String {
        if vm.todayCheckin?.meds?.taken == true { return "Taken ✓" }
        if let rx = vm.activePrescription { return rx.medicationName }
        return "No active prescription"
    }

    private func moodLabel(_ score: Int) -> String {
        ["", "rough", "low", "okay", "good", "great"][safe: score] ?? "okay"
    }

    // MARK: - Care section (doctor, appointment, Rx cards)
    private var careSection: some View {
        VStack(alignment: .leading, spacing: OngoSpacing.sm) {
            OngoSectionHeader(title: "Your Care")

            if let visit = vm.upcomingVisit {
                appointmentCard(visit: visit)
            }
            if let rx = vm.activePrescription {
                prescriptionCard(rx: rx)
            }
        }
    }

    private func appointmentCard(visit: Visit) -> some View {
        OngoCard {
            HStack(spacing: OngoSpacing.sm) {
                Image(systemName: visit.visitType.icon)
                    .font(.system(size: 22))
                    .foregroundStyle(Color.ongoPrimary)
                    .frame(width: 40, height: 40)
                    .background(Color.ongoGreenMuted)
                    .clipShape(Circle())

                VStack(alignment: .leading, spacing: 2) {
                    Text("Upcoming \(visit.visitType.displayName)")
                        .font(OngoFont.subheadline())
                        .foregroundStyle(Color.ongoTextPrimary)
                    Text(visit.scheduledAt.dayMonthYear + " at " + visit.scheduledAt.timeOnly)
                        .font(OngoFont.caption())
                        .foregroundStyle(Color.ongoTextSecondary)
                    Text("with \(visit.doctorName)")
                        .font(OngoFont.caption())
                        .foregroundStyle(Color.ongoTextTertiary)
                }
                Spacer()
                OngoTagPill(label: "Join", color: Color.ongoPrimary, style: .filled)
            }
        }
    }

    private func prescriptionCard(rx: Prescription) -> some View {
        OngoCard {
            HStack(spacing: OngoSpacing.sm) {
                Image(systemName: "pill.fill")
                    .font(.system(size: 22))
                    .foregroundStyle(Color.ongoMeds)
                    .frame(width: 40, height: 40)
                    .background(Color.ongoMeds.opacity(0.12))
                    .clipShape(Circle())

                VStack(alignment: .leading, spacing: 2) {
                    Text(rx.medicationName)
                        .font(OngoFont.subheadline())
                        .foregroundStyle(Color.ongoTextPrimary)
                    Text("\(rx.dose) · \(rx.frequency)")
                        .font(OngoFont.caption())
                        .foregroundStyle(Color.ongoTextSecondary)
                    Text("\(rx.refillsRemaining) refills remaining")
                        .font(OngoFont.caption())
                        .foregroundStyle(rx.refillsRemaining == 0 ? Color.ongoError : Color.ongoTextTertiary)
                }
                Spacer()
                OngoTagPill(label: rx.status.rawValue.capitalized,
                            color: rx.isActive ? Color.ongoSuccess : Color.ongoTextSecondary,
                            style: .tinted)
            }
        }
    }

    // MARK: - Weight card
    private var weightCard: some View {
        OngoCard {
            HStack(spacing: OngoSpacing.sm) {
                Image(systemName: "scalemass.fill")
                    .font(.system(size: 22))
                    .foregroundStyle(Color.ongoPrimary)
                    .frame(width: 40, height: 40)
                    .background(Color.ongoGreenMuted)
                    .clipShape(Circle())

                VStack(alignment: .leading, spacing: 2) {
                    Text("Weight")
                        .font(OngoFont.subheadline())
                        .foregroundStyle(Color.ongoTextPrimary)
                    if let w = vm.latestWeight {
                        Text("\(String(format: "%.1f", w.weightLbs)) lbs · \(w.loggedAt.relativeDay)")
                            .font(OngoFont.caption())
                            .foregroundStyle(Color.ongoTextSecondary)
                    } else {
                        Text("No entries yet")
                            .font(OngoFont.caption())
                            .foregroundStyle(Color.ongoTextSecondary)
                    }
                }
                Spacer()
                Button("Log →") { vm.showWeightLogModal = true }
                    .font(OngoFont.label())
                    .foregroundStyle(Color.ongoPrimary)
            }
        }
    }

}

// Safe subscript for arrays
private extension Array {
    subscript(safe index: Int) -> Element? {
        indices.contains(index) ? self[index] : nil
    }
}
