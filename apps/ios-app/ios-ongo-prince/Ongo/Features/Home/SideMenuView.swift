import SwiftUI

struct SideMenuView: View {
    @Environment(AppState.self) private var appState
    @Binding var isShowing: Bool

    @State private var showSignOutConfirm = false
    @State private var activeSheet: MenuSheet?

    enum MenuSheet: String, Identifiable {
        case editProfile, orders, medicalReports, connectedDevices,
             about, subscriptions, help, reminders
        var id: String { rawValue }
    }

    var body: some View {
        ZStack(alignment: .leading) {
            // Tap-to-dismiss scrim
            Color.ongoScrim
                .ignoresSafeArea()
                .onTapGesture { close() }

            // Menu panel
            ScrollView(showsIndicators: false) {
                VStack(alignment: .leading, spacing: 0) {
                    headerSection
                    healthAssessmentCard
                        .padding(.horizontal, OngoSpacing.md)
                        .padding(.bottom, OngoSpacing.xl)
                    menuRows
                }
            }
            .frame(width: UIScreen.main.bounds.width * 0.82)
            .background(Color.white.ignoresSafeArea())
        }
        .confirmationDialog("Sign out of Ongo?", isPresented: $showSignOutConfirm, titleVisibility: .visible) {
            Button("Sign out", role: .destructive) { appState.signOut() }
            Button("Cancel", role: .cancel) { }
        }
        .sheet(item: $activeSheet) { sheet in
            NavigationStack { sheetContent(for: sheet) }
        }
    }

    private func close() {
        withAnimation(.easeInOut(duration: 0.25)) { isShowing = false }
    }

    // MARK: - Header

    private var headerSection: some View {
        HStack(alignment: .center, spacing: OngoSpacing.sm) {
            ZStack {
                Circle()
                    .fill(Color.ongoPrimary)
                    .frame(width: 64, height: 64)
                Text(String(appState.ongoUser?.firstName.prefix(1) ?? "?").uppercased())
                    .font(.system(size: 26, weight: .bold))
                    .foregroundStyle(.white)
            }

            VStack(alignment: .leading, spacing: 2) {
                Text(appState.ongoUser?.displayName ?? "")
                    .font(.system(size: 17, weight: .bold))
                    .foregroundStyle(Color.ongoTextPrimary)
                    .lineLimit(1)
                Text(appState.ongoUser?.email ?? "")
                    .font(OngoFont.caption())
                    .foregroundStyle(Color.ongoTextSecondary)
                    .lineLimit(1)
                    .truncationMode(.middle)
            }

            Spacer()

            Button { close() } label: {
                Image(systemName: "xmark")
                    .font(.system(size: 15, weight: .medium))
                    .foregroundStyle(Color.ongoTextSecondary)
                    .frame(width: 32, height: 32)
            }
        }
        .padding(.horizontal, OngoSpacing.lg)
        .padding(.top, 56)
        .padding(.bottom, OngoSpacing.lg)
    }

    // MARK: - Health Assessment Card

    private var healthAssessmentCard: some View {
        HStack(alignment: .center, spacing: OngoSpacing.md) {
            VStack(alignment: .leading, spacing: OngoSpacing.xs) {
                Text("Get your free Health Assessment")
                    .font(.system(size: 15, weight: .bold))
                    .foregroundStyle(Color.ongoTextPrimary)
                    .fixedSize(horizontal: false, vertical: true)

                Text("Click here to analyze your body within a matter of few minutes.")
                    .font(.system(size: 13))
                    .foregroundStyle(Color.ongoTextSecondary)
                    .fixedSize(horizontal: false, vertical: true)

                Button { } label: {
                    Text("TAKE THE TEST")
                        .font(.system(size: 11, weight: .bold))
                        .tracking(0.8)
                        .foregroundStyle(Color.ongoPrimary)
                        .padding(.horizontal, 14)
                        .padding(.vertical, 7)
                        .background(Color.ongoGreenMuted)
                        .clipShape(Capsule())
                }
                .buttonStyle(.plain)
                .padding(.top, 2)
            }

            Spacer(minLength: 0)

            ZStack {
                Circle()
                    .fill(Color.ongoPrimary)
                    .frame(width: 64, height: 64)
                Image(systemName: "doc.text.fill")
                    .font(.system(size: 24))
                    .foregroundStyle(.white)
            }
        }
        .padding(OngoSpacing.md)
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: OngoRadius.md))
        .overlay(RoundedRectangle(cornerRadius: OngoRadius.md).stroke(Color.ongoBorder, lineWidth: 1))
        .ongoCardShadow()
    }

    // MARK: - Menu Rows

    private var menuRows: some View {
        VStack(spacing: 0) {
            menuRow(icon: "gearshape",                           label: "Edit Profile")              { activeSheet = .editProfile }
            Divider().padding(.leading, 56)
            menuRow(icon: "cart",                                label: "Your Orders")               { activeSheet = .orders }
            Divider().padding(.leading, 56)
            menuRow(icon: "cross.case",                          label: "Medical Reports")           { activeSheet = .medicalReports }
            Divider().padding(.leading, 56)
            menuRow(icon: "network",                             label: "Connected Devices")         { activeSheet = .connectedDevices }
            Divider().padding(.leading, 56)
            menuRow(icon: "info.circle",                         label: "About Us")                  { activeSheet = .about }
            Divider().padding(.leading, 56)
            menuRow(icon: "creditcard",                          label: "Subscriptions & Payments")  { activeSheet = .subscriptions }
            Divider().padding(.leading, 56)
            menuRow(icon: "questionmark.circle",                 label: "Help and Support")          { activeSheet = .help }
            Divider().padding(.leading, 56)
            menuRow(icon: "bell",                                label: "Reminders")                 { activeSheet = .reminders }
            Divider().padding(.leading, 56)
            menuRow(icon: "rectangle.portrait.and.arrow.right",  label: "Sign Out")                  { showSignOutConfirm = true }
        }
        .padding(.bottom, OngoSpacing.xxxl)
    }

    private func menuRow(icon: String, label: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: OngoSpacing.md) {
                Image(systemName: icon)
                    .font(.system(size: 20))
                    .foregroundStyle(Color.ongoTextPrimary)
                    .frame(width: 28)
                Text(label)
                    .font(.system(size: 16))
                    .foregroundStyle(Color.ongoTextPrimary)
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(Color.ongoTextTertiary)
            }
            .padding(.horizontal, OngoSpacing.lg)
            .padding(.vertical, OngoSpacing.md)
        }
        .buttonStyle(.plain)
    }

    // MARK: - Sheet Destinations

    @ViewBuilder
    private func sheetContent(for sheet: MenuSheet) -> some View {
        switch sheet {
        case .editProfile:
            MyProfileView()
                .environment(appState)
        case .orders:
            ComingSoonView(title: "Your Orders", icon: "cart")
        case .medicalReports:
            ReportsView(userId: appState.ongoUser?.id ?? "")
        case .connectedDevices:
            DevicesView()
        case .about:
            AboutView()
        case .subscriptions:
            SubscriptionsView(userId: appState.ongoUser?.id ?? "")
        case .help:
            HelpView()
        case .reminders:
            NotificationsView(userId: appState.ongoUser?.id ?? "")
        }
    }
}

// MARK: - Placeholder for unbuilt screens

private struct ComingSoonView: View {
    let title: String
    let icon: String

    var body: some View {
        VStack(spacing: OngoSpacing.md) {
            Image(systemName: icon)
                .font(.system(size: 44))
                .foregroundStyle(Color.ongoPrimary.opacity(0.3))
            Text(title)
                .font(OngoFont.headline())
                .foregroundStyle(Color.ongoTextPrimary)
            Text("Coming soon")
                .font(OngoFont.body())
                .foregroundStyle(Color.ongoTextSecondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.ongoBackground)
        .navigationTitle(title)
        .navigationBarTitleDisplayMode(.inline)
    }
}
