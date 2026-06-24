import SwiftUI

// Matches prototype #notificationsPage — per-tracker notification toggles
struct NotificationsView: View {
    let userId: String
    @State private var settings: NotificationSettings = .default
    @State private var isLoading: Bool = true
    @State private var saveTask: Task<Void, Never>? = nil

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(spacing: OngoSpacing.md) {
                if isLoading {
                    ProgressView().frame(maxWidth: .infinity).padding(.top, OngoSpacing.xxl)
                } else {
                    // Master toggle
                    masterCard

                    // Per-tracker cards
                    trackerCard(
                        icon: "drop.fill", iconColor: Color(hex: "#5b9bd5"),
                        title: "Water",
                        cadence: "4 reminders a day",
                        times: ["9:00 AM", "12:00 PM", "3:00 PM", "6:00 PM"],
                        isEnabled: $settings.waterEnabled
                    )
                    trackerCard(
                        icon: "face.smiling.inverse", iconColor: Color.ongoOrange,
                        title: "Mood Check-in",
                        cadence: "Once a day",
                        times: ["8:30 PM"],
                        isEnabled: $settings.moodEnabled
                    )
                    trackerCard(
                        icon: "figure.walk", iconColor: Color.ongoPrimary,
                        title: "Steps Reminder",
                        cadence: "Twice a day",
                        times: ["1:00 PM", "8:00 PM"],
                        isEnabled: $settings.stepsEnabled
                    )
                    trackerCard(
                        icon: "syringe.fill", iconColor: Color.ongoMeds,
                        title: "Medication Dose",
                        cadence: "Weekly · Sunday",
                        times: ["9:00 AM"],
                        isEnabled: $settings.medsEnabled
                    )

                    // Info note
                    OngoCard {
                        HStack(alignment: .top, spacing: OngoSpacing.sm) {
                            Image(systemName: "info.circle")
                                .font(.system(size: 14)).foregroundStyle(Color.ongoPrimary)
                            Text("Medication reminders automatically adjust to your prescription frequency (weekly or daily).")
                                .font(OngoFont.caption()).foregroundStyle(Color.ongoTextSecondary)
                        }
                    }
                }
            }
            .padding(.horizontal, OngoSpacing.md)
            .padding(.vertical, OngoSpacing.md)
            .padding(.bottom, 100)
        }
        .background(Color.ongoBackground)
        .navigationTitle("Reminders")
        .navigationBarTitleDisplayMode(.inline)
        .task { await loadSettings() }
        .onChange(of: settings.masterEnabled) { _, _ in scheduleSave() }
        .onChange(of: settings.waterEnabled) { _, _ in scheduleSave() }
        .onChange(of: settings.moodEnabled) { _, _ in scheduleSave() }
        .onChange(of: settings.stepsEnabled) { _, _ in scheduleSave() }
        .onChange(of: settings.medsEnabled) { _, _ in scheduleSave() }
    }

    // MARK: - Master toggle card

    private var masterCard: some View {
        OngoCard {
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text(settings.masterEnabled ? "Reminders are on" : "Enable reminders")
                        .font(OngoFont.subheadline())
                    Text(settings.masterEnabled
                         ? "You'll receive check-in and medication reminders."
                         : "Tap to turn on all health reminders.")
                        .font(OngoFont.caption()).foregroundStyle(Color.ongoTextSecondary)
                }
                Spacer()
                Toggle("", isOn: $settings.masterEnabled)
                    .tint(Color.ongoPrimary)
            }
        }
    }

    // MARK: - Per-tracker card

    private func trackerCard(
        icon: String, iconColor: Color, title: String,
        cadence: String, times: [String], isEnabled: Binding<Bool>
    ) -> some View {
        OngoCard {
            VStack(alignment: .leading, spacing: OngoSpacing.sm) {
                HStack {
                    ZStack {
                        Circle()
                            .fill(iconColor.opacity(0.15))
                            .frame(width: 36, height: 36)
                        Image(systemName: icon)
                            .font(.system(size: 16))
                            .foregroundStyle(iconColor)
                    }
                    VStack(alignment: .leading, spacing: 2) {
                        Text(title).font(OngoFont.subheadline())
                        Text(cadence).font(OngoFont.caption(11)).foregroundStyle(Color.ongoTextSecondary)
                    }
                    Spacer()
                    Toggle("", isOn: isEnabled)
                        .tint(Color.ongoPrimary)
                        .disabled(!settings.masterEnabled)
                        .opacity(settings.masterEnabled ? 1 : 0.4)
                }

                // Time pills
                if isEnabled.wrappedValue && settings.masterEnabled {
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: OngoSpacing.xs) {
                            ForEach(times, id: \.self) { time in
                                Text(time)
                                    .font(OngoFont.label(11))
                                    .foregroundStyle(Color.ongoPrimary)
                                    .padding(.horizontal, OngoSpacing.xs)
                                    .padding(.vertical, 4)
                                    .background(Color.ongoGreenMuted)
                                    .clipShape(Capsule())
                            }
                        }
                    }
                    .transition(.move(edge: .top).combined(with: .opacity))
                }
            }
        }
        .opacity(settings.masterEnabled ? 1 : 0.6)
    }

    // MARK: - Persistence

    private func loadSettings() async {
        isLoading = true
        settings = (try? await FirestoreService.shared.get(
            NotificationSettings.self,
            collection: NotificationSettings.collectionPath,
            documentId: userId
        )) ?? .default
        isLoading = false
    }

    private func scheduleSave() {
        saveTask?.cancel()
        saveTask = Task {
            try? await Task.sleep(for: .milliseconds(600))
            guard !Task.isCancelled else { return }
            try? await FirestoreService.shared.set(settings,
                                                    collection: NotificationSettings.collectionPath,
                                                    documentId: userId)
        }
    }
}
