import SwiftUI

// Matches prototype #accountTab + #accountPage — full sub-pages in Phase 17
struct AccountView: View {
    @Environment(AppState.self) private var appState
    @State private var expandedSection: AccountSection? = nil
    @State private var showSignOut = false
    @State private var showDeleteAccount = false

    enum AccountSection: String, CaseIterable {
        case identity    = "Identity"
        case body        = "Body & Health"
        case medical     = "Medical"
        case lifestyle   = "Lifestyle"
        case verification = "ID Verification"

        var icon: String {
            switch self {
            case .identity:     return "person.fill"
            case .body:         return "heart.fill"
            case .medical:      return "cross.case.fill"
            case .lifestyle:    return "leaf.fill"
            case .verification: return "checkmark.shield.fill"
            }
        }
    }

    var body: some View {
        ScrollView {
            VStack(spacing: OngoSpacing.sm) {
                // Profile header
                profileHeader

                // Navigation rows
                accountRow(icon: "creditcard.fill",  title: "Subscriptions & Payments",
                           destination: SubscriptionsView(userId: appState.ongoUser?.id ?? ""))
                accountRow(icon: "bell.fill",    title: "Notifications",
                           destination: NotificationsView(userId: appState.ongoUser?.id ?? ""))
                accountRow(icon: "iphone",        title: "Connected Devices",
                           destination: DevicesView())
                accountRow(icon: "doc.text.fill", title: "Documents",
                           destination: ReportsView(userId: appState.ongoUser?.id ?? ""))
                accountRow(icon: "chart.bar.fill",title: "Reports",
                           destination: ReportsView(userId: appState.ongoUser?.id ?? ""))

                Divider().padding(.horizontal, OngoSpacing.md)

                // Survey data accordion
                ForEach(AccountSection.allCases, id: \.self) { section in
                    accordionRow(section: section)
                }

                Divider().padding(.horizontal, OngoSpacing.md)

                accountRow(icon: "questionmark.circle", title: "Help & Support", destination: HelpView())
                accountRow(icon: "info.circle",         title: "About Ongo",     destination: AboutView())

                // Sign out
                Button {
                    showSignOut = true
                } label: {
                    HStack {
                        Image(systemName: "arrow.right.square")
                            .foregroundStyle(Color.ongoError)
                        Text("Sign out")
                            .font(OngoFont.subheadline())
                            .foregroundStyle(Color.ongoError)
                        Spacer()
                    }
                    .padding(OngoSpacing.md)
                    .background(Color.ongoCard)
                    .clipShape(RoundedRectangle(cornerRadius: OngoRadius.md))
                }
                .padding(.horizontal, OngoSpacing.md)

                // Delete account
                accountRow(
                    icon: "trash.fill",
                    title: "Delete Account",
                    destination: DeleteAccountView()
                )
                .environment(appState)
            }
            .padding(.top, OngoSpacing.md)
            .padding(.bottom, 100)
        }
        .background(Color.ongoBackground)
        .navigationTitle("Account")
        .navigationBarTitleDisplayMode(.large)
        .confirmationDialog("Sign out of Ongo?", isPresented: $showSignOut, titleVisibility: .visible) {
            Button("Sign out", role: .destructive) { appState.signOut() }
            Button("Stay signed in", role: .cancel) { }
        }
    }

    private var profileHeader: some View {
        VStack(spacing: OngoSpacing.sm) {
            OngoAvatarView(
                initials: appState.ongoUser?.initials ?? "?",
                size: 72
            )
            Text(appState.ongoUser?.displayName ?? "")
                .font(OngoFont.headline(22))
            Text(appState.ongoUser?.email ?? "")
                .font(OngoFont.caption())
                .foregroundStyle(Color.ongoTextSecondary)
            OngoTagPill(
                label: appState.ongoUser?.planTier.rawValue.capitalized ?? "No Plan",
                color: Color.ongoPrimary,
                style: .tinted
            )
        }
        .frame(maxWidth: .infinity)
        .padding(OngoSpacing.lg)
        .background(Color.ongoCard)
        .clipShape(RoundedRectangle(cornerRadius: OngoRadius.lg))
        .padding(.horizontal, OngoSpacing.md)
        .ongoCardShadow()
    }

    private func accountRow<Dest: View>(icon: String, title: String, destination: Dest) -> some View {
        NavigationLink(destination: destination) {
            HStack(spacing: OngoSpacing.sm) {
                Image(systemName: icon)
                    .font(.system(size: 16))
                    .foregroundStyle(Color.ongoPrimary)
                    .frame(width: 28)
                Text(title)
                    .font(OngoFont.subheadline())
                    .foregroundStyle(Color.ongoTextPrimary)
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.system(size: 12))
                    .foregroundStyle(Color.ongoTextTertiary)
            }
            .padding(OngoSpacing.md)
            .background(Color.ongoCard)
            .clipShape(RoundedRectangle(cornerRadius: OngoRadius.md))
        }
        .padding(.horizontal, OngoSpacing.md)
    }

    private func accordionRow(section: AccountSection) -> some View {
        VStack(spacing: 0) {
            Button {
                withAnimation(.spring(response: 0.35)) {
                    expandedSection = expandedSection == section ? nil : section
                }
            } label: {
                HStack(spacing: OngoSpacing.sm) {
                    Image(systemName: section.icon)
                        .font(.system(size: 16))
                        .foregroundStyle(Color.ongoPrimary)
                        .frame(width: 28)
                    Text(section.rawValue)
                        .font(OngoFont.subheadline())
                        .foregroundStyle(Color.ongoTextPrimary)
                    Spacer()
                    Image(systemName: expandedSection == section ? "chevron.up" : "chevron.down")
                        .font(.system(size: 12))
                        .foregroundStyle(Color.ongoTextTertiary)
                }
                .padding(OngoSpacing.md)
                .background(Color.ongoCard)
            }

            if expandedSection == section {
                accordionContent(for: section)
            }
        }
        .clipShape(RoundedRectangle(cornerRadius: OngoRadius.md))
        .padding(.horizontal, OngoSpacing.md)
    }

    // MARK: - Accordion content by section

    @ViewBuilder
    private func accordionContent(for section: AccountSection) -> some View {
        VStack(alignment: .leading, spacing: 0) {
            switch section {
            case .body:
                accordionLink(icon: "scalemass.fill", title: "BMI Calculator",
                              destination: BMIView())
                Divider().padding(.leading, 52)
                accordionLink(icon: "figure.arms.open", title: "Body Fat Calculator",
                              destination: BodyFatView())
            case .medical:
                accordionLink(icon: "pills.fill", title: "My Prescriptions",
                              destination: RxView(userId: appState.ongoUser?.id ?? ""))
                Divider().padding(.leading, 52)
                accordionLink(icon: "clock.arrow.circlepath", title: "Visit History",
                              destination: CounsellingView(userId: appState.ongoUser?.id ?? ""))
            default:
                HStack(spacing: OngoSpacing.sm) {
                    Text("Coming soon")
                        .font(OngoFont.caption()).foregroundStyle(Color.ongoTextSecondary)
                }
                .padding(OngoSpacing.md)
            }
        }
        .background(Color.ongoCardAlt)
        .transition(.move(edge: .top).combined(with: .opacity))
    }

    private func accordionLink<Dest: View>(icon: String, title: String, destination: Dest) -> some View {
        NavigationLink(destination: destination) {
            HStack(spacing: OngoSpacing.sm) {
                Image(systemName: icon)
                    .font(.system(size: 14))
                    .foregroundStyle(Color.ongoPrimary)
                    .frame(width: 28)
                Text(title)
                    .font(OngoFont.body())
                    .foregroundStyle(Color.ongoTextPrimary)
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.system(size: 11))
                    .foregroundStyle(Color.ongoTextTertiary)
            }
            .padding(OngoSpacing.md)
        }
    }
}
