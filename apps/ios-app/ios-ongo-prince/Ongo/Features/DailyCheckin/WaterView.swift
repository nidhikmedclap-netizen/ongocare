import SwiftUI
import FirebaseFirestore

// Matches prototype #waterPage — cup tap tracker
struct WaterView: View {
    @Environment(\.dismiss) private var dismiss
    let userId: String

    @State private var cupsLogged: Int = 0
    @State private var isLoading = false
    private let goal = 8

    private var progress: Double { Double(cupsLogged) / Double(goal) }

    var body: some View {
        NavigationStack {
            VStack(spacing: OngoSpacing.xl) {
                // Progress arc
                ZStack {
                    OngoRingView(progress: progress, lineWidth: 14, color: Color.ongoWater, size: 160)
                    VStack(spacing: 2) {
                        Text("\(cupsLogged)")
                            .font(.system(size: 48, weight: .heavy))
                            .foregroundStyle(Color.ongoWater)
                        Text("/ \(goal) cups")
                            .font(OngoFont.caption())
                            .foregroundStyle(Color.ongoTextSecondary)
                    }
                }
                .padding(.top, OngoSpacing.xl)

                // Cup grid (tap to log)
                LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 12), count: 4), spacing: 12) {
                    ForEach(1...goal, id: \.self) { i in
                        cupCell(index: i)
                    }
                }
                .padding(.horizontal, OngoSpacing.xl)
                .animation(.spring(response: 0.3), value: cupsLogged)

                Text("Tap each cup as you drink it")
                    .font(OngoFont.caption())
                    .foregroundStyle(Color.ongoTextSecondary)

                Spacer()

                OngoPrimaryButton(title: "Save", isLoading: isLoading) { save() }
                    .padding(.horizontal, OngoSpacing.lg)
                    .padding(.bottom, OngoSpacing.lg)
            }
            .background(Color.ongoBackground)
            .navigationTitle("Water")
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

    private func cupCell(index: Int) -> some View {
        let isFilled = index <= cupsLogged
        return Button {
            withAnimation(.spring(response: 0.25)) {
                cupsLogged = cupsLogged == index ? index - 1 : index
            }
        } label: {
            VStack(spacing: 4) {
                Image(systemName: isFilled ? "drop.fill" : "drop")
                    .font(.system(size: 28))
                    .foregroundStyle(isFilled ? Color.ongoWater : Color.ongoBorder)
                Text("8 oz")
                    .font(OngoFont.label(10))
                    .foregroundStyle(isFilled ? Color.ongoWater : Color.ongoTextTertiary)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, OngoSpacing.sm)
            .background(isFilled ? Color.ongoWater.opacity(0.1) : Color.ongoCardAlt)
            .clipShape(RoundedRectangle(cornerRadius: OngoRadius.md))
        }
    }

    private func save() {
        isLoading = true
        Task {
            let docId = DailyCheckin.documentId(userId: userId, date: Date())
            let entry = DailyCheckin.WaterEntry(cupsLogged: cupsLogged, goalCups: goal, loggedAt: Date())
            let updates: [String: Any] = [
                "water": try! Firestore.Encoder().encode(entry),
                "updatedAt": Date(), "userId": userId,
                "date": Date().midnightUTC, "createdAt": Date()
            ]
            try? await Firestore.firestore()
                .collection(DailyCheckin.collectionPath).document(docId)
                .setData(updates, merge: true)
            AnalyticsService.logCheckinLogged(type: "water")
            await MainActor.run { dismiss() }
        }
    }
}
