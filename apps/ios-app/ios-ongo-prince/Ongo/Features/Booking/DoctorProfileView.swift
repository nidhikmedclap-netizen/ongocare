import SwiftUI

// Matches prototype #profilePage — doctor bio, credentials, licensed states, reviews
struct DoctorProfileView: View {
    let doctor: Doctor
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 0) {
                    // Hero header
                    heroSection

                    VStack(alignment: .leading, spacing: OngoSpacing.lg) {
                        // About
                        infoSection(title: "About") {
                            Text(doctor.bio)
                                .font(OngoFont.body())
                                .foregroundStyle(Color.ongoTextSecondary)
                        }

                        // Credentials
                        infoSection(title: "Credentials") {
                            HStack(spacing: OngoSpacing.sm) {
                                credentialPill(doctor.credentials)
                                credentialPill(doctor.specialty)
                            }
                        }

                        // Licensed states
                        infoSection(title: "Licensed in") {
                            FlowLayout(spacing: OngoSpacing.xxs) {
                                ForEach(doctor.licensedStates, id: \.self) { state in
                                    OngoTagPill(label: state, color: Color.ongoPrimary, style: .tinted)
                                }
                            }
                        }

                        // Languages
                        if doctor.languages.count > 1 {
                            infoSection(title: "Languages") {
                                HStack {
                                    ForEach(doctor.languages, id: \.self) { lang in
                                        OngoTagPill(label: lang.uppercased(), color: Color.ongoTextSecondary, style: .outlined)
                                    }
                                }
                            }
                        }

                        // Rating
                        infoSection(title: "Patient Reviews") {
                            HStack(spacing: OngoSpacing.sm) {
                                Text(String(format: "%.1f", doctor.rating))
                                    .font(.system(size: 40, weight: .heavy))
                                    .foregroundStyle(Color.ongoTextPrimary)
                                VStack(alignment: .leading) {
                                    HStack(spacing: 3) {
                                        ForEach(0..<5, id: \.self) { i in
                                            Image(systemName: Double(i) < doctor.rating ? "star.fill" : "star")
                                                .font(.system(size: 14))
                                                .foregroundStyle(Color.ongoOrange)
                                        }
                                    }
                                    Text("\(doctor.reviewCount) reviews")
                                        .font(OngoFont.caption())
                                        .foregroundStyle(Color.ongoTextSecondary)
                                }
                            }
                        }
                    }
                    .padding(OngoSpacing.lg)
                    .padding(.bottom, 100)
                }
            }
            .background(Color.ongoBackground)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button { dismiss() } label: {
                        Image(systemName: "xmark.circle.fill")
                            .foregroundStyle(Color.ongoTextSecondary)
                    }
                }
            }
        }
    }

    // MARK: - Hero
    private var heroSection: some View {
        ZStack(alignment: .bottom) {
            LinearGradient(
                colors: [Color.ongoPrimary.opacity(0.15), Color.ongoBackground],
                startPoint: .top, endPoint: .bottom
            )
            .frame(height: 160)

            VStack(spacing: OngoSpacing.xs) {
                OngoAvatarView(
                    initials: String(doctor.firstName.prefix(1) + doctor.lastName.prefix(1)),
                    size: 80
                )
                .overlay(
                    Circle().stroke(Color.white, lineWidth: 3)
                )
                .ongoElevatedShadow()

                Text(doctor.fullName)
                    .ongoHeadlineStyle(size: 22)
                Text(doctor.specialty)
                    .font(OngoFont.body())
                    .foregroundStyle(Color.ongoTextSecondary)

                if doctor.isAvailable {
                    HStack(spacing: 4) {
                        OnlineDot()
                        Text("Available now")
                            .font(OngoFont.caption(11))
                            .foregroundStyle(Color.ongoSuccess)
                    }
                }
            }
            .padding(.bottom, OngoSpacing.md)
        }
    }

    // MARK: - Section wrapper
    private func infoSection<Content: View>(title: String, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: OngoSpacing.xs) {
            Text(title).ongoLabelStyle()
            content()
        }
    }

    private func credentialPill(_ text: String) -> some View {
        Text(text)
            .font(OngoFont.subheadline(13))
            .foregroundStyle(Color.ongoTextPrimary)
            .padding(.horizontal, OngoSpacing.sm)
            .padding(.vertical, OngoSpacing.xxs)
            .background(Color.ongoCardAlt)
            .clipShape(Capsule())
    }
}

// MARK: - Flow layout for tag pills
struct FlowLayout: Layout {
    var spacing: CGFloat = 8

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let rows = computeRows(proposal: proposal, subviews: subviews)
        let height = rows.map { $0.map { $0.sizeThatFits(.unspecified).height }.max() ?? 0 }.reduce(0) { $0 + $1 + spacing }
        return CGSize(width: proposal.width ?? 0, height: max(0, height - spacing))
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let rows = computeRows(proposal: proposal, subviews: subviews)
        var y = bounds.minY
        for row in rows {
            var x = bounds.minX
            let rowHeight = row.map { $0.sizeThatFits(.unspecified).height }.max() ?? 0
            for view in row {
                let size = view.sizeThatFits(.unspecified)
                view.place(at: CGPoint(x: x, y: y), proposal: ProposedViewSize(size))
                x += size.width + spacing
            }
            y += rowHeight + spacing
        }
    }

    private func computeRows(proposal: ProposedViewSize, subviews: Subviews) -> [[LayoutSubview]] {
        var rows: [[LayoutSubview]] = [[]]
        var rowWidth: CGFloat = 0
        let maxWidth = proposal.width ?? 0
        for view in subviews {
            let w = view.sizeThatFits(.unspecified).width
            if rowWidth + w + spacing > maxWidth && !rows[rows.count - 1].isEmpty {
                rows.append([])
                rowWidth = 0
            }
            rows[rows.count - 1].append(view)
            rowWidth += w + spacing
        }
        return rows
    }
}
