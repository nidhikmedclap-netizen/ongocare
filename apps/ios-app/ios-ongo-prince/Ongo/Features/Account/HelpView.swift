import SwiftUI

// Matches prototype #helpPage — FAQ accordion + contact options
struct HelpView: View {
    @State private var expandedIndex: Int? = nil
    @State private var searchText: String = ""

    private let faqs: [(q: String, a: String)] = [
        ("How does the GLP-1 prescription process work?",
         "After completing your health survey, a board-certified Ongo physician reviews your profile. If eligible, they issue an electronic prescription sent directly to your preferred pharmacy. Most patients receive a decision within 24–48 hours."),
        ("Is my data secure?",
         "Yes. Ongo is fully HIPAA-compliant. All data is encrypted in transit (TLS 1.3) and at rest. We never sell your personal health information to third parties."),
        ("How much does it cost?",
         "Ongo plans start at $349/month, which includes unlimited messaging with your care team and monthly doctor visits. Medication costs vary by insurance coverage. See the Shop tab for current pricing."),
        ("Can I cancel anytime?",
         "Yes. You can cancel your Ongo subscription at any time from the Subscriptions & Payments page in Account. No cancellation fees. Medication refills already in transit are non-refundable."),
        ("What if my doctor says I don't qualify?",
         "Your safety is our priority. If you don't meet the clinical criteria for GLP-1 therapy, your doctor will explain why and may suggest alternative approaches. You won't be charged for the consultation."),
        ("Are GLP-1 medications safe?",
         "GLP-1 receptor agonists have been approved by the FDA and studied extensively in large clinical trials. Common side effects include nausea, especially early in treatment, which typically resolves. Your Ongo doctor will review your complete medical history before prescribing."),
        ("How long does delivery take?",
         "Prescriptions are sent electronically to your pharmacy. Delivery timing depends on your pharmacy — typically 3–7 business days. Specialty compounded medications may take longer."),
        ("Can I switch doctors?",
         "Yes. Contact support via the chat button below and we'll match you with another Ongo physician. Doctor switches typically take 1–2 business days."),
    ]

    private var filteredFAQs: [(q: String, a: String, index: Int)] {
        let indexed = faqs.enumerated().map { ($0.element.q, $0.element.a, $0.offset) }
        guard !searchText.isEmpty else { return indexed }
        return indexed.filter {
            $0.0.localizedCaseInsensitiveContains(searchText) ||
            $0.1.localizedCaseInsensitiveContains(searchText)
        }
    }

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(spacing: OngoSpacing.md) {
                // Search bar
                HStack(spacing: OngoSpacing.sm) {
                    Image(systemName: "magnifyingglass")
                        .foregroundStyle(Color.ongoTextTertiary)
                    TextField("Search questions…", text: $searchText)
                        .font(OngoFont.body())
                }
                .padding(OngoSpacing.sm)
                .background(Color.ongoCard)
                .clipShape(RoundedRectangle(cornerRadius: OngoRadius.md))
                .ongoCardShadow()

                // Quick contact cards
                HStack(spacing: OngoSpacing.sm) {
                    contactCard(
                        icon: "message.fill", iconColor: Color.ongoPrimary,
                        title: "Live Chat", sub: "Avg response: 4 min"
                    )
                    contactCard(
                        icon: "envelope.fill", iconColor: Color.ongoOrange,
                        title: "Email Us", sub: "Reply in 24 hr"
                    )
                }

                // FAQ section
                VStack(alignment: .leading, spacing: OngoSpacing.xs) {
                    Text("Common questions")
                        .font(OngoFont.subheadline())
                        .padding(.horizontal, OngoSpacing.xxs)

                    if filteredFAQs.isEmpty {
                        OngoCard {
                            Text("No results for \"\(searchText)\"")
                                .font(OngoFont.body())
                                .foregroundStyle(Color.ongoTextTertiary)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, OngoSpacing.sm)
                        }
                    } else {
                        ForEach(filteredFAQs, id: \.2) { faq in
                            faqRow(question: faq.0, answer: faq.1, index: faq.2)
                        }
                    }
                }
            }
            .padding(.horizontal, OngoSpacing.md)
            .padding(.vertical, OngoSpacing.md)
            .padding(.bottom, 100)
        }
        .background(Color.ongoBackground)
        .navigationTitle("Help & Support")
        .navigationBarTitleDisplayMode(.inline)
        .dismissKeyboardOnTap()
    }

    private func contactCard(icon: String, iconColor: Color, title: String, sub: String) -> some View {
        Button {} label: {
            VStack(spacing: OngoSpacing.xs) {
                Image(systemName: icon)
                    .font(.system(size: 22))
                    .foregroundStyle(iconColor)
                Text(title).font(OngoFont.subheadline(13))
                Text(sub).font(OngoFont.caption(10)).foregroundStyle(Color.ongoTextSecondary)
            }
            .frame(maxWidth: .infinity)
            .padding(OngoSpacing.sm)
            .background(Color.ongoCard)
            .clipShape(RoundedRectangle(cornerRadius: OngoRadius.md))
            .ongoCardShadow()
        }
    }

    private func faqRow(question: String, answer: String, index: Int) -> some View {
        let isExpanded = expandedIndex == index
        return OngoCard {
            VStack(alignment: .leading, spacing: 0) {
                Button {
                    withAnimation(.spring(response: 0.3)) {
                        expandedIndex = isExpanded ? nil : index
                    }
                } label: {
                    HStack {
                        Text(question)
                            .font(OngoFont.subheadline(14))
                            .foregroundStyle(Color.ongoTextPrimary)
                            .multilineTextAlignment(.leading)
                        Spacer()
                        Image(systemName: "chevron.down")
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundStyle(Color.ongoTextTertiary)
                            .rotationEffect(.degrees(isExpanded ? 180 : 0))
                    }
                }

                if isExpanded {
                    Text(answer)
                        .font(OngoFont.body())
                        .foregroundStyle(Color.ongoTextSecondary)
                        .padding(.top, OngoSpacing.sm)
                        .transition(.move(edge: .top).combined(with: .opacity))
                }
            }
        }
    }
}
