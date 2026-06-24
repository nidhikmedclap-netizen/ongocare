import SwiftUI

// Matches prototype #tipDetailPage — editorial health tip detail
struct TipDetailView: View {
    let tipId: String
    @Environment(\.dismiss) private var dismiss

    private var tip: TipContent? { TipContent.all[tipId] ?? TipContent.all["default-keep-going"] }

    var body: some View {
        NavigationStack {
            ScrollView(showsIndicators: false) {
                if let tip {
                    VStack(alignment: .leading, spacing: OngoSpacing.lg) {
                        // Hero
                        VStack(alignment: .leading, spacing: OngoSpacing.xs) {
                            Text(tip.eyebrow.uppercased())
                                .font(OngoFont.label(11))
                                .foregroundStyle(Color.ongoPrimary)
                                .tracking(1.5)
                            Text(tip.headline)
                                .font(OngoFont.headline(28))
                            Text(tip.sub)
                                .font(OngoFont.body())
                                .foregroundStyle(Color.ongoTextSecondary)
                        }
                        .padding(.horizontal, OngoSpacing.lg)

                        // Sections
                        ForEach(Array(tip.sections.enumerated()), id: \.offset) { _, section in
                            VStack(alignment: .leading, spacing: OngoSpacing.sm) {
                                Text(section.title)
                                    .font(OngoFont.subheadline())
                                    .padding(.horizontal, OngoSpacing.lg)

                                if let body = section.body {
                                    Text(body)
                                        .font(OngoFont.body())
                                        .foregroundStyle(Color.ongoTextSecondary)
                                        .padding(.horizontal, OngoSpacing.lg)
                                }

                                if !section.bullets.isEmpty {
                                    VStack(alignment: .leading, spacing: OngoSpacing.xs) {
                                        ForEach(section.bullets, id: \.self) { bullet in
                                            HStack(alignment: .top, spacing: OngoSpacing.sm) {
                                                Image(systemName: "checkmark.circle.fill")
                                                    .font(.system(size: 16))
                                                    .foregroundStyle(Color.ongoSuccess)
                                                Text(bullet)
                                                    .font(OngoFont.body())
                                                    .foregroundStyle(Color.ongoTextPrimary)
                                            }
                                        }
                                    }
                                    .padding(.horizontal, OngoSpacing.lg)
                                }
                            }
                        }

                        Spacer(minLength: 80)
                    }
                    .padding(.top, OngoSpacing.lg)
                }
            }
            .background(Color.ongoBackground)
            .navigationTitle(tip?.eyebrow ?? "Today's Insight")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button { dismiss() } label: {
                        Image(systemName: "xmark.circle.fill")
                            .foregroundStyle(Color.ongoTextTertiary)
                    }
                }
            }
        }
    }
}
