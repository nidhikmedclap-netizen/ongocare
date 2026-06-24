import SwiftUI

struct MainTabView: View {
    @Environment(AppState.self) private var appState
    @State private var selectedTab: Tab = .home

    enum Tab: Int, CaseIterable {
        case home, workout, diet, shop, account

        var icon: String {
            switch self {
            case .home:    return "house.fill"
            case .workout: return "figure.run"
            case .diet:    return "fork.knife"
            case .shop:    return "bag.fill"
            case .account: return "person.fill"
            }
        }

        var label: String {
            switch self {
            case .home:    return "Home"
            case .workout: return "Workout"
            case .diet:    return "Diet"
            case .shop:    return "Shop"
            case .account: return "Account"
            }
        }
    }

    var body: some View {
        ZStack(alignment: .bottom) {
            TabView(selection: $selectedTab) {
                NavigationStack {
                    HomeView()
                }
                .tag(Tab.home)

                NavigationStack {
                    WorkoutView()
                }
                .tag(Tab.workout)

                NavigationStack {
                    DietView()
                }
                .tag(Tab.diet)

                NavigationStack {
                    ShopView()
                }
                .tag(Tab.shop)

                NavigationStack {
                    AccountView()
                }
                .tag(Tab.account)
            }
            // Hide default tab bar — we draw our own
            .tabViewStyle(.page(indexDisplayMode: .never))

            customTabBar
        }
        .ignoresSafeArea(edges: .bottom)
        .onChange(of: appState.notifications.fcmToken) { _, token in
            guard let token, let userId = appState.ongoUser?.id else { return }
            Task { try? await FirestoreService.shared.updateFCMToken(token, userId: userId) }
        }
        .onChange(of: appState.notifications.pendingDeepLink) { _, action in
            guard let action else { return }
            withAnimation(.easeInOut(duration: 0.15)) {
                switch action {
                case "openAppointment", "openVisit", "openRx", "openNotifications":
                    selectedTab = .account
                case "openChat", "openCall":
                    selectedTab = .home
                case "openShop", "openCheckout":
                    selectedTab = .shop
                case "openDiet", "openMeal":
                    selectedTab = .diet
                case "openWorkout":
                    selectedTab = .workout
                default:
                    break
                }
            }
            appState.notifications.pendingDeepLink = nil
        }
    }

    private var customTabBar: some View {
        HStack(spacing: 0) {
            ForEach(Tab.allCases, id: \.rawValue) { tab in
                Button {
                    withAnimation(.easeInOut(duration: 0.15)) { selectedTab = tab }
                } label: {
                    VStack(spacing: 4) {
                        Image(systemName: tab.icon)
                            .font(.system(size: 22, weight: selectedTab == tab ? .bold : .regular))
                            .foregroundStyle(selectedTab == tab ? Color.ongoPrimary : Color.ongoTextTertiary)
                        Text(tab.label)
                            .font(OngoFont.label(10))
                            .foregroundStyle(selectedTab == tab ? Color.ongoPrimary : Color.ongoTextTertiary)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, OngoSpacing.xs)
                }
            }
        }
        .padding(.horizontal, OngoSpacing.xs)
        .background(
            Color.ongoCard
                .shadow(color: .black.opacity(0.08), radius: 12, x: 0, y: -4)
        )
        .padding(.bottom, bottomPadding)
    }

    private var bottomPadding: CGFloat {
        (UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .first?.windows.first?.safeAreaInsets.bottom ?? 0)
    }
}
