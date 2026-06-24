import SwiftUI
import StripePaymentSheet

// Matches prototype #checkoutPage — plan summary + Stripe PaymentSheet
struct CheckoutView: View {
    let plan: SubscriptionPlan
    let userId: String
    @Environment(\.dismiss) private var dismiss

    @State private var vm: CheckoutViewModel

    init(plan: SubscriptionPlan, userId: String) {
        self.plan = plan
        self.userId = userId
        _vm = State(initialValue: CheckoutViewModel(plan: plan, userId: userId))
    }

    var body: some View {
        NavigationStack {
            Group {
                if vm.isSuccess {
                    successState
                } else {
                    checkoutContent
                }
            }
            .background(Color.ongoBackground)
            .navigationTitle("Complete Purchase")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                if !vm.isSuccess {
                    ToolbarItem(placement: .navigationBarLeading) {
                        Button { dismiss() } label: {
                            Image(systemName: "xmark")
                                .foregroundStyle(Color.ongoTextSecondary)
                        }
                    }
                }
            }
        }
        .task { await vm.prepare() }
    }

    // MARK: - Checkout content

    private var checkoutContent: some View {
        ScrollView(showsIndicators: false) {
            VStack(spacing: OngoSpacing.lg) {
                // Plan summary card
                planSummaryCard

                // What's included
                whatsIncludedCard

                // Order total
                orderTotalCard

                // Error banner
                if let error = vm.errorMessage {
                    HStack(spacing: OngoSpacing.xs) {
                        Image(systemName: "exclamationmark.triangle.fill")
                            .foregroundStyle(Color.ongoError)
                        Text(error)
                            .font(OngoFont.caption())
                            .foregroundStyle(Color.ongoError)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(OngoSpacing.sm)
                    .background(Color.ongoError.opacity(0.08))
                    .clipShape(RoundedRectangle(cornerRadius: OngoRadius.sm))
                }

                // Pay button
                payButton

                // Trust badges
                trustBadges
            }
            .padding(.horizontal, OngoSpacing.md)
            .padding(.vertical, OngoSpacing.md)
            .padding(.bottom, 40)
        }
    }

    private var planSummaryCard: some View {
        OngoCard {
            VStack(alignment: .leading, spacing: OngoSpacing.sm) {
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(plan.name)
                            .font(OngoFont.headline(17))
                        Text(plan.period)
                            .font(OngoFont.caption())
                            .foregroundStyle(Color.ongoTextSecondary)
                    }
                    Spacer()
                    VStack(alignment: .trailing, spacing: 2) {
                        Text(String(format: "$%.0f", plan.price))
                            .font(.system(size: 24, weight: .bold))
                            .foregroundStyle(Color.ongoPrimary)
                        if let monthly = plan.monthlyEquivalent {
                            Text(monthly)
                                .font(OngoFont.caption(11))
                                .foregroundStyle(Color.ongoTextTertiary)
                        }
                    }
                }

                if let savings = plan.savingsLabel {
                    OngoTagPill(label: savings, color: Color.ongoOrange, style: .tinted)
                }

                if plan.isPopular {
                    HStack(spacing: OngoSpacing.xxs) {
                        Image(systemName: "star.fill")
                            .font(.system(size: 10))
                            .foregroundStyle(Color.ongoOrange)
                        Text("Most popular plan")
                            .font(OngoFont.label(11))
                            .foregroundStyle(Color.ongoOrange)
                    }
                }
            }
        }
    }

    private var whatsIncludedCard: some View {
        OngoCard {
            VStack(alignment: .leading, spacing: OngoSpacing.sm) {
                Text("What's included")
                    .font(OngoFont.subheadline())

                ForEach(plan.features, id: \.self) { feature in
                    HStack(spacing: OngoSpacing.sm) {
                        Image(systemName: "checkmark.circle.fill")
                            .font(.system(size: 16))
                            .foregroundStyle(Color.ongoSuccess)
                        Text(feature)
                            .font(OngoFont.body())
                            .foregroundStyle(Color.ongoTextPrimary)
                    }
                }

                Divider()

                // First consultation
                HStack(spacing: OngoSpacing.sm) {
                    Image(systemName: "video.fill")
                        .font(.system(size: 16))
                        .foregroundStyle(Color.ongoPrimary)
                    Text("First consultation")
                        .font(OngoFont.body())
                        .foregroundStyle(Color.ongoTextPrimary)
                    Spacer()
                    Text("Included")
                        .font(OngoFont.label(12))
                        .foregroundStyle(Color.ongoSuccess)
                }
            }
        }
    }

    private var orderTotalCard: some View {
        OngoCard {
            VStack(spacing: OngoSpacing.sm) {
                summaryRow(label: plan.name, value: String(format: "$%.0f", plan.price))

                if let savings = plan.savingsLabel {
                    summaryRow(label: savings, value: "−", valueColor: Color.ongoSuccess)
                }

                Divider()

                HStack {
                    Text("Total today")
                        .font(OngoFont.subheadline())
                    Spacer()
                    Text(String(format: "$%.0f", plan.price))
                        .font(.system(size: 20, weight: .bold))
                        .foregroundStyle(Color.ongoTextPrimary)
                }
            }
        }
    }

    private func summaryRow(label: String, value: String, valueColor: Color = Color.ongoTextSecondary) -> some View {
        HStack {
            Text(label)
                .font(OngoFont.body())
                .foregroundStyle(Color.ongoTextSecondary)
            Spacer()
            Text(value)
                .font(OngoFont.subheadline())
                .foregroundStyle(valueColor)
        }
    }

    // MARK: - Pay button

    @ViewBuilder
    private var payButton: some View {
        if let sheet = vm.paymentSheet {
            OngoPrimaryButton(
                title: String(format: "Pay $%.0f securely", plan.price),
                isLoading: vm.isShowingPaymentSheet
            ) {
                vm.isShowingPaymentSheet = true
            }
            .paymentSheet(
                isPresented: $vm.isShowingPaymentSheet,
                paymentSheet: sheet
            ) { result in
                Task { @MainActor in vm.handlePaymentResult(result) }
            }
        } else if vm.isPreparingPayment {
            OngoPrimaryButton(title: "Preparing checkout…", isLoading: true) {}
        } else if vm.errorMessage != nil {
            OngoPrimaryButton(title: "Retry") {
                Task { await vm.prepare() }
            }
        }
    }

    // MARK: - Trust badges

    private var trustBadges: some View {
        HStack(spacing: 0) {
            trustBadge(icon: "lock.fill", label: "Encrypted")
            trustBadge(icon: "cross.fill", label: "HIPAA Secure")
            trustBadge(icon: "arrow.counterclockwise", label: "Cancel anytime")
        }
    }

    private func trustBadge(icon: String, label: String) -> some View {
        VStack(spacing: 4) {
            Image(systemName: icon)
                .font(.system(size: 14))
                .foregroundStyle(Color.ongoTextTertiary)
            Text(label)
                .font(OngoFont.label(10))
                .foregroundStyle(Color.ongoTextTertiary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
    }

    // MARK: - Success state

    private var successState: some View {
        VStack(spacing: OngoSpacing.xl) {
            Spacer()

            Image(systemName: "checkmark.seal.fill")
                .font(.system(size: 72))
                .foregroundStyle(Color.ongoSuccess)

            VStack(spacing: OngoSpacing.xs) {
                Text("You're all set!")
                    .font(OngoFont.headline(26))
                Text("Your \(plan.name) is now active. You have \(plan.consultations) doctor \(plan.consultations == 1 ? "visit" : "visits") to use.")
                    .font(OngoFont.body())
                    .foregroundStyle(Color.ongoTextSecondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, OngoSpacing.xl)
            }

            OngoPrimaryButton(title: "Done") { dismiss() }
                .padding(.horizontal, OngoSpacing.lg)

            Spacer()
        }
        .transition(.scale.combined(with: .opacity))
    }
}
