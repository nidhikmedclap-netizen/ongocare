import SwiftUI

// Matches prototype #counsellingPage — visit history (completed + scheduled visits)
struct CounsellingView: View {
    let userId: String
    @State private var visits: [Visit] = []
    @State private var isLoading: Bool = true

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(spacing: OngoSpacing.md) {
                if isLoading {
                    ProgressView().frame(maxWidth: .infinity).padding(.top, OngoSpacing.xxl)
                } else if visits.isEmpty {
                    emptyState
                } else {
                    ForEach(visits) { visit in
                        visitCard(visit)
                    }
                }
            }
            .padding(.horizontal, OngoSpacing.md)
            .padding(.vertical, OngoSpacing.md)
            .padding(.bottom, 100)
        }
        .background(Color.ongoBackground)
        .navigationTitle("Visit History")
        .navigationBarTitleDisplayMode(.inline)
        .task { await loadVisits() }
    }

    private func visitCard(_ visit: Visit) -> some View {
        OngoCard(cornerRadius: OngoRadius.md) {
            VStack(alignment: .leading, spacing: OngoSpacing.sm) {
                // Doctor + status
                HStack {
                    OngoAvatarView(initials: String(visit.doctorName.prefix(2)), size: 44)
                    VStack(alignment: .leading, spacing: 2) {
                        Text(visit.doctorName).font(OngoFont.subheadline())
                        HStack(spacing: OngoSpacing.xs) {
                            Image(systemName: visit.visitType.icon)
                                .font(.system(size: 11)).foregroundStyle(Color.ongoTextTertiary)
                            Text(visit.visitType.displayName)
                                .font(OngoFont.caption(11)).foregroundStyle(Color.ongoTextTertiary)
                            Text("·").foregroundStyle(Color.ongoTextTertiary)
                            Text(visit.scheduledAt.mediumDate)
                                .font(OngoFont.caption(11)).foregroundStyle(Color.ongoTextTertiary)
                        }
                    }
                    Spacer()
                    OngoTagPill(
                        label: statusLabel(visit.status),
                        color: statusColor(visit.status),
                        style: .tinted
                    )
                }

                // Outcome message
                if let outcome = visit.appointmentOutcome, let message = outcome.message {
                    Divider()
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Doctor note").font(OngoFont.caption(10)).foregroundStyle(Color.ongoTextTertiary)
                        Text(message).font(OngoFont.body()).foregroundStyle(Color.ongoTextPrimary)
                    }
                }

                // Actions
                HStack(spacing: OngoSpacing.sm) {
                    OngoSecondaryButton(title: "Message doctor") {
                        // WIRE: Navigate to LiveChatView with this doctor's thread
                    }
                    if visit.status == .scheduled {
                        OngoPrimaryButton(title: "Join") {
                            // WIRE: Navigate to CallView or LiveChatView
                        }
                    }
                }
            }
        }
    }

    private func statusLabel(_ status: Visit.VisitStatus) -> String {
        switch status {
        case .scheduled:  return "Scheduled"
        case .inProgress: return "In progress"
        case .completed:  return "Done"
        case .cancelled:  return "Cancelled"
        case .noShow:     return "No show"
        }
    }

    private func statusColor(_ status: Visit.VisitStatus) -> Color {
        switch status {
        case .scheduled:  return Color.ongoPrimary
        case .inProgress: return Color.ongoOrange
        case .completed:  return Color.ongoSuccess
        case .cancelled:  return Color.ongoError
        case .noShow:     return Color.ongoTextTertiary
        }
    }

    private var emptyState: some View {
        VStack(spacing: OngoSpacing.md) {
            Image(systemName: "stethoscope")
                .font(.system(size: 48)).foregroundStyle(Color.ongoTextTertiary)
            Text("No visits yet")
                .font(OngoFont.subheadline()).foregroundStyle(Color.ongoTextSecondary)
            Text("Your visit summaries and doctor notes will appear here after your first appointment.")
                .font(OngoFont.caption()).foregroundStyle(Color.ongoTextTertiary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity).padding(OngoSpacing.xxxl)
    }

    private func loadVisits() async {
        isLoading = true
        visits = (try? await FirestoreService.shared.query(
            Visit.self, collection: Visit.collectionPath,
            filters: [("patientId", .isEqualTo, userId)],
            orderBy: ("scheduledAt", descending: true)
        )) ?? []
        isLoading = false
    }
}
