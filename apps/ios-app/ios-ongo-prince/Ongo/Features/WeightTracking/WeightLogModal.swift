import SwiftUI

// Matches prototype #modalOverlay — quick weight entry bottom sheet
struct WeightLogModal: View {
    @Environment(\.dismiss) private var dismiss
    let userId: String

    @State private var weightText: String = ""
    @State private var note: String = ""
    @State private var isLoading: Bool = false
    @State private var error: String? = nil

    private var weightValue: Double? { Double(weightText) }

    var body: some View {
        NavigationStack {
            VStack(spacing: OngoSpacing.lg) {
                Text("Log Weight")
                    .font(OngoFont.headline(22))
                    .foregroundStyle(Color.ongoTextPrimary)
                    .frame(maxWidth: .infinity, alignment: .leading)

                VStack(alignment: .leading, spacing: OngoSpacing.xs) {
                    Text("Weight").ongoLabelStyle()
                    HStack {
                        TextField("e.g. 185.5", text: $weightText)
                            .keyboardType(.decimalPad)
                            .font(.system(size: 36, weight: .heavy))
                            .foregroundStyle(Color.ongoTextPrimary)
                        Text("lbs")
                            .font(OngoFont.subheadline())
                            .foregroundStyle(Color.ongoTextSecondary)
                    }
                    Divider()
                }

                VStack(alignment: .leading, spacing: OngoSpacing.xs) {
                    Text("Note (optional)").ongoLabelStyle()
                    TextField("How are you feeling?", text: $note)
                        .font(OngoFont.body())
                        .padding(OngoSpacing.sm)
                        .background(Color.ongoCardAlt)
                        .clipShape(RoundedRectangle(cornerRadius: OngoRadius.md))
                }

                Spacer()

                OngoPrimaryButton(
                    title: "Save",
                    isLoading: isLoading,
                    isDisabled: weightValue == nil
                ) {
                    save()
                }
            }
            .padding(OngoSpacing.lg)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button { dismiss() } label: {
                        Image(systemName: "xmark.circle.fill")
                            .foregroundStyle(Color.ongoTextSecondary)
                    }
                }
            }
        }
        .errorBanner(message: $error)
    }

    private func save() {
        guard let weight = weightValue, !userId.isEmpty else { return }
        isLoading = true
        Task {
            let entry = WeightEntry(
                userId: userId,
                weightLbs: weight,
                note: note.isEmpty ? nil : note,
                loggedAt: Date()
            )
            do {
                try await FirestoreService.shared.add(entry, collection: WeightEntry.collectionPath)
                AnalyticsService.logWeightLogged()
                await MainActor.run { dismiss() }
            } catch {
                await MainActor.run {
                    self.error = error.localizedDescription
                    isLoading = false
                }
            }
        }
    }
}
