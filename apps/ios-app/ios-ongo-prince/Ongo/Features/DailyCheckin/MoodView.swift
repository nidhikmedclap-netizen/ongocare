import SwiftUI
import FirebaseFirestore

// Matches prototype #moodPage
struct MoodView: View {
    @Environment(\.dismiss) private var dismiss
    let userId: String

    @State private var selectedScore: Int? = nil
    @State private var note: String = ""
    @State private var isLoading = false

    private let moods: [(score: Int, emoji: String, label: String)] = [
        (1, "😞", "Rough"),
        (2, "😕", "Low"),
        (3, "😐", "Okay"),
        (4, "🙂", "Good"),
        (5, "😊", "Great")
    ]

    var body: some View {
        NavigationStack {
            VStack(spacing: OngoSpacing.xl) {
                Text("How are you feeling\ntoday?")
                    .ongoHeadlineStyle(size: 26)
                    .multilineTextAlignment(.center)
                    .padding(.top, OngoSpacing.xl)

                HStack(spacing: OngoSpacing.md) {
                    ForEach(moods, id: \.score) { mood in
                        VStack(spacing: OngoSpacing.xs) {
                            Text(mood.emoji)
                                .font(.system(size: 40))
                                .scaleEffect(selectedScore == mood.score ? 1.2 : 1.0)
                                .animation(.spring(response: 0.3), value: selectedScore)
                            Text(mood.label)
                                .font(OngoFont.caption(11))
                                .foregroundStyle(selectedScore == mood.score ? Color.ongoPrimary : Color.ongoTextSecondary)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, OngoSpacing.sm)
                        .background(selectedScore == mood.score ? Color.ongoGreenMuted : Color.clear)
                        .clipShape(RoundedRectangle(cornerRadius: OngoRadius.md))
                        .onTapGesture { withAnimation { selectedScore = mood.score } }
                    }
                }
                .padding(.horizontal, OngoSpacing.md)

                VStack(alignment: .leading, spacing: OngoSpacing.xs) {
                    Text("Add a note (optional)").ongoLabelStyle()
                    TextEditor(text: $note)
                        .font(OngoFont.body())
                        .frame(height: 80)
                        .padding(OngoSpacing.xs)
                        .background(Color.ongoCardAlt)
                        .clipShape(RoundedRectangle(cornerRadius: OngoRadius.md))
                }
                .padding(.horizontal, OngoSpacing.lg)

                Spacer()

                OngoPrimaryButton(
                    title: "Save",
                    isLoading: isLoading,
                    isDisabled: selectedScore == nil
                ) { save() }
                .padding(.horizontal, OngoSpacing.lg)
                .padding(.bottom, OngoSpacing.lg)
            }
            .background(Color.ongoBackground)
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
        guard let score = selectedScore else { return }
        isLoading = true
        Task {
            let docId = DailyCheckin.documentId(userId: userId, date: Date())
            let entry = DailyCheckin.MoodEntry(score: score, note: note.isEmpty ? nil : note, loggedAt: Date())
            let updates: [String: Any] = [
                "mood": try! Firestore.Encoder().encode(entry),
                "updatedAt": Date(),
                "userId": userId,
                "date": Date().midnightUTC,
                "createdAt": Date()
            ]
            // Merge into daily checkin doc
            try? await Firestore.firestore()
                .collection(DailyCheckin.collectionPath)
                .document(docId)
                .setData(updates, merge: true)
            AnalyticsService.logCheckinLogged(type: "mood")
            await MainActor.run { dismiss() }
        }
    }
}

