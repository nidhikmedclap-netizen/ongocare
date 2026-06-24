import SwiftUI

// Matches prototype #reportsPage — grouped medical reports list
struct ReportsView: View {
    let userId: String
    @State private var prescriptions: [Prescription] = []
    @State private var visits: [Visit] = []
    @State private var isLoading: Bool = true

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(spacing: OngoSpacing.md) {
                if isLoading {
                    ProgressView().frame(maxWidth: .infinity).padding(.top, OngoSpacing.xxl)
                } else if prescriptions.isEmpty && visits.isEmpty {
                    emptyState
                } else {
                    // Prescriptions section
                    if !prescriptions.isEmpty {
                        reportSection(title: "Prescriptions", icon: "pills.fill", iconColor: Color.ongoMeds) {
                            ForEach(prescriptions) { rx in
                                reportRow(
                                    icon: "doc.plaintext.fill", iconColor: Color.ongoMeds,
                                    name: "\(rx.medicationName) \(rx.dose)",
                                    date: rx.writtenAt.mediumDate,
                                    tag: rx.status.rawValue.capitalized
                                )
                            }
                        }
                    }

                    // Visit summaries section
                    if !visits.isEmpty {
                        reportSection(title: "Visit Summaries", icon: "stethoscope", iconColor: Color.ongoPrimary) {
                            ForEach(visits) { visit in
                                reportRow(
                                    icon: "clipboard.fill", iconColor: Color.ongoPrimary,
                                    name: "Visit with \(visit.doctorName)",
                                    date: visit.scheduledAt.mediumDate,
                                    tag: visit.status.rawValue.capitalized
                                )
                            }
                        }
                    }

                    // Documents (static placeholder — upload feature in Phase 17+)
                    reportSection(title: "Documents", icon: "doc.fill", iconColor: Color.ongoTextSecondary) {
                        reportRow(
                            icon: "person.text.rectangle.fill", iconColor: Color.ongoTextSecondary,
                            name: "Photo ID",
                            date: "On file",
                            tag: "Verified"
                        )
                    }
                }
            }
            .padding(.horizontal, OngoSpacing.md)
            .padding(.vertical, OngoSpacing.md)
            .padding(.bottom, 100)
        }
        .background(Color.ongoBackground)
        .navigationTitle("Medical Reports")
        .navigationBarTitleDisplayMode(.inline)
        .task { await loadReports() }
    }

    private func reportSection<Content: View>(
        title: String, icon: String, iconColor: Color,
        @ViewBuilder content: @escaping () -> Content
    ) -> some View {
        VStack(alignment: .leading, spacing: OngoSpacing.xs) {
            HStack(spacing: OngoSpacing.xs) {
                Image(systemName: icon).font(.system(size: 13)).foregroundStyle(iconColor)
                Text(title).font(OngoFont.subheadline(14))
            }
            .padding(.horizontal, OngoSpacing.xxs)

            OngoCard {
                VStack(spacing: 0) { content() }
            }
        }
    }

    private func reportRow(icon: String, iconColor: Color, name: String, date: String, tag: String) -> some View {
        HStack(spacing: OngoSpacing.sm) {
            Image(systemName: icon)
                .font(.system(size: 20))
                .foregroundStyle(iconColor)
                .frame(width: 28)
            VStack(alignment: .leading, spacing: 2) {
                Text(name).font(OngoFont.subheadline(13))
                Text(date).font(OngoFont.caption(11)).foregroundStyle(Color.ongoTextTertiary)
            }
            Spacer()
            OngoTagPill(label: tag, color: Color.ongoPrimary, style: .outlined)
            Image(systemName: "chevron.right").font(.system(size: 11)).foregroundStyle(Color.ongoTextTertiary)
        }
        .padding(.vertical, OngoSpacing.xs)
    }

    private var emptyState: some View {
        VStack(spacing: OngoSpacing.md) {
            Image(systemName: "doc.text.magnifyingglass")
                .font(.system(size: 48)).foregroundStyle(Color.ongoTextTertiary)
            Text("No reports yet")
                .font(OngoFont.subheadline()).foregroundStyle(Color.ongoTextSecondary)
            Text("Your prescriptions and visit summaries will appear here after your first appointment.")
                .font(OngoFont.caption()).foregroundStyle(Color.ongoTextTertiary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity).padding(OngoSpacing.xxxl)
    }

    private func loadReports() async {
        isLoading = true
        async let rxs = try? FirestoreService.shared.query(
            Prescription.self, collection: Prescription.collectionPath,
            filters: [("patientId", .isEqualTo, userId)],
            orderBy: ("writtenAt", descending: true)
        )
        async let vs = try? FirestoreService.shared.query(
            Visit.self, collection: Visit.collectionPath,
            filters: [("patientId", .isEqualTo, userId)],
            orderBy: ("scheduledAt", descending: true)
        )
        prescriptions = (await rxs) ?? []
        visits = ((await vs) ?? []).filter { $0.status == .completed }
        isLoading = false
    }
}
