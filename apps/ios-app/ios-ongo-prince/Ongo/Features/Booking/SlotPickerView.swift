import SwiftUI

// Matches prototype #calPage — time slot calendar picker
struct SlotPickerView: View {
    let slots: [AvailabilitySlot]
    let onSelect: (AvailabilitySlot) -> Void
    @Environment(\.dismiss) private var dismiss

    @State private var selectedDate: Date? = nil

    private var groupedSlots: [Date: [AvailabilitySlot]] {
        Dictionary(grouping: slots) { slot in
            Calendar.current.startOfDay(for: slot.startTime)
        }
    }

    private var sortedDates: [Date] {
        groupedSlots.keys.sorted()
    }

    var body: some View {
        NavigationStack {
            if slots.isEmpty {
                emptyState
            } else {
                ScrollView {
                    VStack(alignment: .leading, spacing: OngoSpacing.md) {
                        // Date selector strip
                        dateStrip

                        // Time slots for selected date
                        if let date = selectedDate,
                           let daySlots = groupedSlots[date] {
                            timeSlotsSection(slots: daySlots, date: date)
                        } else if let first = sortedDates.first,
                                  let daySlots = groupedSlots[first] {
                            timeSlotsSection(slots: daySlots, date: first)
                        }
                    }
                    .padding(.horizontal, OngoSpacing.md)
                    .padding(.bottom, OngoSpacing.xxxl)
                }
            }
        }
        .background(Color.ongoBackground)
        .navigationTitle("Pick a Time")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarLeading) {
                Button("Cancel") { dismiss() }
                    .foregroundStyle(Color.ongoTextSecondary)
            }
        }
    }

    // MARK: - Horizontal date strip
    private var dateStrip: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: OngoSpacing.xs) {
                ForEach(sortedDates, id: \.self) { date in
                    let isSelected = selectedDate == date || (selectedDate == nil && date == sortedDates.first)
                    Button {
                        withAnimation(.easeInOut(duration: 0.15)) { selectedDate = date }
                    } label: {
                        VStack(spacing: 2) {
                            Text(date.formatted(.dateTime.weekday(.abbreviated)).uppercased())
                                .font(OngoFont.label(10))
                                .foregroundStyle(isSelected ? .white : Color.ongoTextSecondary)
                            Text(date.formatted(.dateTime.day()))
                                .font(OngoFont.headline(18))
                                .foregroundStyle(isSelected ? .white : Color.ongoTextPrimary)
                            Text(date.formatted(.dateTime.month(.abbreviated)))
                                .font(OngoFont.label(10))
                                .foregroundStyle(isSelected ? .white.opacity(0.8) : Color.ongoTextTertiary)
                        }
                        .frame(width: 56, height: 72)
                        .background(isSelected ? Color.ongoPrimary : Color.ongoCard)
                        .clipShape(RoundedRectangle(cornerRadius: OngoRadius.md))
                        .ongoCardShadow()
                    }
                }
            }
            .padding(.vertical, OngoSpacing.xs)
        }
    }

    // MARK: - Time slots grid
    private func timeSlotsSection(slots: [AvailabilitySlot], date: Date) -> some View {
        VStack(alignment: .leading, spacing: OngoSpacing.sm) {
            Text(date.mediumDate)
                .ongoHeadlineStyle(size: 18)

            let sorted = slots.sorted { $0.startTime < $1.startTime }
            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible()),
                GridItem(.flexible())
            ], spacing: OngoSpacing.xs) {
                ForEach(sorted) { slot in
                    Button {
                        onSelect(slot)
                    } label: {
                        VStack(spacing: 3) {
                            Text(slot.startTime.timeOnly)
                                .font(OngoFont.subheadline(14))
                                .foregroundStyle(Color.ongoPrimary)
                            Text(slot.visitType.displayName)
                                .font(OngoFont.label(10))
                                .foregroundStyle(Color.ongoTextSecondary)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, OngoSpacing.sm)
                        .background(Color.ongoGreenMuted)
                        .clipShape(RoundedRectangle(cornerRadius: OngoRadius.md))
                        .overlay(
                            RoundedRectangle(cornerRadius: OngoRadius.md)
                                .stroke(Color.ongoPrimary.opacity(0.3), lineWidth: 1)
                        )
                    }
                }
            }
        }
    }

    private var emptyState: some View {
        VStack(spacing: OngoSpacing.md) {
            Image(systemName: "calendar.badge.exclamationmark")
                .font(.system(size: 48))
                .foregroundStyle(Color.ongoTextTertiary)
            Text("No slots available")
                .font(OngoFont.headline(20))
            Text("Check back soon or contact support.")
                .font(OngoFont.body())
                .foregroundStyle(Color.ongoTextSecondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .padding(OngoSpacing.xl)
    }
}
