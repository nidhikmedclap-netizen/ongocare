import SwiftUI

// Matches prototype #trackerPage — monthly weight tracker calendar + chart
struct TrackerCalendarView: View {
    let userId: String
    @State private var entries: [WeightEntry] = []
    @State private var isLoading: Bool = true
    @State private var selectedMonth: Date = Date()
    @State private var showLogModal: Bool = false
    @State private var period: Period = .monthly

    enum Period: String, CaseIterable { case monthly = "Monthly"; case quarterly = "Quarterly"; case yearly = "Yearly" }

    private var calendar: Calendar { Calendar.current }

    private var monthLabel: String {
        let fmt = DateFormatter(); fmt.dateFormat = "MMMM yyyy"
        return fmt.string(from: selectedMonth)
    }

    // Dates with weight entries this month
    private var entryDates: Set<String> {
        Set(entries.map { $0.loggedAt.firestoreDateKey })
    }

    private var daysInMonth: [Date] {
        guard let range = calendar.range(of: .day, in: .month, for: selectedMonth),
              let firstDay = calendar.date(from: calendar.dateComponents([.year, .month], from: selectedMonth))
        else { return [] }
        return range.compactMap { calendar.date(byAdding: .day, value: $0 - 1, to: firstDay) }
    }

    private var firstWeekday: Int {
        let first = daysInMonth.first ?? Date()
        return (calendar.component(.weekday, from: first) - calendar.firstWeekday + 7) % 7
    }

    private var latestEntry: WeightEntry? { entries.sorted { $0.loggedAt > $1.loggedAt }.first }

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(spacing: OngoSpacing.md) {
                // Period selector
                Picker("Period", selection: $period) {
                    ForEach(Period.allCases, id: \.self) { Text($0.rawValue).tag($0) }
                }
                .pickerStyle(.segmented)

                // Summary card
                summaryCard

                // Month nav + calendar
                calendarCard

                // Recent readings
                if !entries.isEmpty {
                    readingsCard
                }
            }
            .padding(.horizontal, OngoSpacing.md)
            .padding(.vertical, OngoSpacing.md)
            .padding(.bottom, 120)
        }
        .background(Color.ongoBackground)
        .navigationTitle("Weight Tracker")
        .navigationBarTitleDisplayMode(.inline)
        .overlay(alignment: .bottomTrailing) {
            Button { showLogModal = true } label: {
                Image(systemName: "plus")
                    .font(.system(size: 22, weight: .bold))
                    .foregroundStyle(.white)
                    .frame(width: 52, height: 52)
                    .background(Color.ongoPrimary)
                    .clipShape(Circle())
                    .ongoElevatedShadow()
            }
            .padding(OngoSpacing.md)
        }
        .task { await loadEntries() }
        .sheet(isPresented: $showLogModal, onDismiss: { Task { await loadEntries() } }) {
            WeightLogModal(userId: userId)
                .presentationDetents([.medium])
        }
    }

    // MARK: - Summary card

    private var summaryCard: some View {
        OngoCard(cornerRadius: OngoRadius.md) {
            HStack(spacing: 0) {
                if let latest = latestEntry {
                    metricCell(label: "Current", value: String(format: "%.1f", latest.weightLbs), unit: "lb")
                } else {
                    metricCell(label: "Current", value: "—", unit: "")
                }
                Divider().frame(height: 40)
                metricCell(label: "Logged", value: "\(entries.count)", unit: "entries")
                Divider().frame(height: 40)
                metricCell(label: "This month", value: "\(daysInMonth.filter { entryDates.contains($0.firestoreDateKey) }.count)", unit: "days")
            }
        }
    }

    private func metricCell(label: String, value: String, unit: String) -> some View {
        VStack(spacing: 2) {
            HStack(alignment: .lastTextBaseline, spacing: 2) {
                Text(value).font(.system(size: 22, weight: .bold)).foregroundStyle(Color.ongoTextPrimary)
                if !unit.isEmpty {
                    Text(unit).font(OngoFont.caption(11)).foregroundStyle(Color.ongoTextSecondary)
                }
            }
            Text(label).font(OngoFont.caption(10)).foregroundStyle(Color.ongoTextTertiary)
        }
        .frame(maxWidth: .infinity)
    }

    // MARK: - Calendar card

    private var calendarCard: some View {
        OngoCard {
            VStack(spacing: OngoSpacing.sm) {
                // Month navigation
                HStack {
                    Button {
                        selectedMonth = calendar.date(byAdding: .month, value: -1, to: selectedMonth) ?? selectedMonth
                        Task { await loadEntries() }
                    } label: {
                        Image(systemName: "chevron.left").foregroundStyle(Color.ongoPrimary)
                    }
                    Spacer()
                    Text(monthLabel).font(OngoFont.subheadline())
                    Spacer()
                    Button {
                        let next = calendar.date(byAdding: .month, value: 1, to: selectedMonth) ?? selectedMonth
                        if next <= Date() {
                            selectedMonth = next
                            Task { await loadEntries() }
                        }
                    } label: {
                        Image(systemName: "chevron.right")
                            .foregroundStyle(calendar.date(byAdding: .month, value: 1, to: selectedMonth)! <= Date()
                                             ? Color.ongoPrimary : Color.ongoTextTertiary)
                    }
                }

                // Day headers
                let dayLetters = ["S", "M", "T", "W", "T", "F", "S"]
                HStack {
                    ForEach(dayLetters, id: \.self) { d in
                        Text(d).font(OngoFont.label(11))
                            .foregroundStyle(Color.ongoTextTertiary)
                            .frame(maxWidth: .infinity)
                    }
                }

                // Days grid
                LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 7), spacing: OngoSpacing.xs) {
                    // Padding cells for offset
                    ForEach(0..<firstWeekday, id: \.self) { _ in Color.clear.frame(height: 32) }
                    // Day cells
                    ForEach(daysInMonth, id: \.self) { date in
                        dayCell(date: date)
                    }
                }
            }
        }
    }

    private func dayCell(date: Date) -> some View {
        let hasEntry = entryDates.contains(date.firestoreDateKey)
        let isToday = calendar.isDateInToday(date)
        let dayNum = calendar.component(.day, from: date)

        return ZStack {
            if hasEntry {
                Circle().fill(Color.ongoPrimary)
            } else if isToday {
                Circle().stroke(Color.ongoPrimary, lineWidth: 1.5)
            }
            Text("\(dayNum)")
                .font(OngoFont.label(12))
                .foregroundStyle(hasEntry ? .white : (isToday ? Color.ongoPrimary : Color.ongoTextPrimary))
        }
        .frame(height: 32)
    }

    // MARK: - Readings list

    private var readingsCard: some View {
        VStack(alignment: .leading, spacing: OngoSpacing.xs) {
            Text("Your Readings").font(OngoFont.subheadline(14))
                .padding(.horizontal, OngoSpacing.xxs)
            OngoCard {
                VStack(spacing: 0) {
                    ForEach(entries.prefix(10)) { entry in
                        HStack {
                            VStack(alignment: .leading, spacing: 2) {
                                Text(String(format: "%.1f lb", entry.weightLbs))
                                    .font(OngoFont.subheadline(14))
                                Text(entry.loggedAt.mediumDate)
                                    .font(OngoFont.caption(11))
                                    .foregroundStyle(Color.ongoTextTertiary)
                            }
                            Spacer()
                            Text(String(format: "%.1f kg", entry.weightKg))
                                .font(OngoFont.caption()).foregroundStyle(Color.ongoTextTertiary)
                        }
                        .padding(.vertical, OngoSpacing.xs)
                        if entry.id != entries.prefix(10).last?.id { Divider() }
                    }
                }
            }
        }
    }

    // MARK: - Firestore

    private func loadEntries() async {
        isLoading = true
        entries = (try? await FirestoreService.shared.query(
            WeightEntry.self,
            collection: WeightEntry.collectionPath,
            filters: [("userId", .isEqualTo, userId)],
            orderBy: ("loggedAt", descending: true)
        )) ?? []
        isLoading = false
    }
}
