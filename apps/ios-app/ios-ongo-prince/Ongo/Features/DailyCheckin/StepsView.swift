import SwiftUI
import FirebaseFirestore

// Matches prototype #stepsPage — manual entry + ring + weekly bar chart
struct StepsView: View {
    @Environment(\.dismiss) private var dismiss
    let userId: String

    @State private var stepsText: String = ""
    @State private var currentEntry: DailyCheckin.StepsEntry? = nil
    @State private var isLoading = false

    private let goal = 7000

    private var stepsInt: Int { Int(stepsText) ?? 0 }
    private var progress: Double { min(1.0, Double(stepsInt) / Double(goal)) }

    var body: some View {
        NavigationStack {
            VStack(spacing: OngoSpacing.xl) {
                // Ring
                ZStack {
                    OngoRingView(progress: progress, lineWidth: 14, color: Color.ongoSteps, size: 160)
                    VStack(spacing: 2) {
                        Text(stepsInt > 0 ? "\(stepsInt)" : "0")
                            .font(.system(size: 40, weight: .heavy))
                            .foregroundStyle(Color.ongoTextPrimary)
                        Text("/ \(goal) steps")
                            .font(OngoFont.caption())
                            .foregroundStyle(Color.ongoTextSecondary)
                    }
                }
                .padding(.top, OngoSpacing.xl)

                // Manual input
                VStack(alignment: .leading, spacing: OngoSpacing.xs) {
                    Text("Steps today").ongoLabelStyle()
                    HStack {
                        TextField("e.g. 5000", text: $stepsText)
                            .keyboardType(.numberPad)
                            .font(.system(size: 32, weight: .bold))
                        Text("steps")
                            .font(OngoFont.subheadline())
                            .foregroundStyle(Color.ongoTextSecondary)
                    }
                    Divider()
                }
                .padding(.horizontal, OngoSpacing.lg)

                Spacer()

                OngoPrimaryButton(
                    title: "Log Steps",
                    isLoading: isLoading,
                    isDisabled: stepsInt == 0
                ) { save() }
                .padding(.horizontal, OngoSpacing.lg)
                .padding(.bottom, OngoSpacing.lg)
            }
            .background(Color.ongoBackground)
            .navigationTitle("Steps")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button { dismiss() } label: {
                        Image(systemName: "xmark").foregroundStyle(Color.ongoTextSecondary)
                    }
                }
            }
        }
    }

    private func save() {
        guard stepsInt > 0 else { return }
        isLoading = true
        Task {
            let docId = DailyCheckin.documentId(userId: userId, date: Date())
            let entry = DailyCheckin.StepsEntry(
                steps: stepsInt,
                goalSteps: goal,
                source: .manual,
                loggedAt: Date()
            )
            let updates: [String: Any] = [
                "steps": try! Firestore.Encoder().encode(entry),
                "updatedAt": Date(),
                "userId": userId,
                "date": Date().midnightUTC,
                "createdAt": Date()
            ]
            try? await Firestore.firestore()
                .collection(DailyCheckin.collectionPath)
                .document(docId)
                .setData(updates, merge: true)
            AnalyticsService.logCheckinLogged(type: "steps")
            await MainActor.run { dismiss() }
        }
    }
}
