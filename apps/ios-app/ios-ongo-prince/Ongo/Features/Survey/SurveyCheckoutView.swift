import SwiftUI

struct SurveyCheckoutView: View {
    var onComplete: () -> Void

    @Environment(\.dismiss) private var dismiss

    @State private var selectedPlanId = "3mo"
    @State private var paymentMethod: PaymentMethod = .card
    @State private var cardNumber = ""
    @State private var expiration = ""
    @State private var cvc = ""
    @State private var nameOnCard = ""
    @State private var isProcessing = false

    enum PaymentMethod { case card, applePay }

    private struct Plan {
        let id: String
        let name: String
        let isPopular: Bool
        let savings: String?
        let price: String
        let priceValue: Double
        let savingsValue: Double?
        let description: String
        let monthly: String
    }

    private let plans: [Plan] = [
        Plan(id: "1mo", name: "1-Month Plan",  isPopular: false, savings: nil,        price: "$349",    priceValue: 349,   savingsValue: nil,  description: "Try it out · Renews monthly · Cancel anytime",  monthly: "$349.00 / month"),
        Plan(id: "3mo", name: "3-Month Plan",  isPopular: true,  savings: "SAVE 14%", price: "$897",    priceValue: 897,   savingsValue: 150,  description: "Best to see real results · Renews quarterly",    monthly: "$299.00 / month"),
        Plan(id: "6mo", name: "6-Month Plan",  isPopular: false, savings: "SAVE 24%", price: "$1,599",  priceValue: 1599,  savingsValue: 495,  description: "Lock in maximum savings · Renews biannually",    monthly: "$266.50 / month"),
    ]

    private var selectedPlan: Plan { plans.first { $0.id == selectedPlanId } ?? plans[1] }

    var body: some View {
        ZStack(alignment: .bottom) {
            Color.ongoBackground.ignoresSafeArea()

            VStack(spacing: 0) {
                topBar
                ScrollView {
                    VStack(alignment: .leading, spacing: OngoSpacing.xl) {
                        planSection
                        paymentMethodSection
                        if paymentMethod == .card {
                            cardSection
                        } else {
                            applePaySection
                        }
                        orderSummarySection
                        trustBadges
                    }
                    .padding(.horizontal, OngoSpacing.lg)
                    .padding(.top, OngoSpacing.md)
                    .padding(.bottom, 160)
                }
            }

            bottomCTA
        }
        .animation(.easeInOut(duration: 0.2), value: paymentMethod)
        .animation(.easeInOut(duration: 0.12), value: selectedPlanId)
    }

    // MARK: - Top bar

    private var topBar: some View {
        HStack {
            Button { dismiss() } label: {
                ZStack {
                    Circle()
                        .fill(Color.ongoCard)
                        .frame(width: 40, height: 40)
                        .shadow(color: .black.opacity(0.08), radius: 4, x: 0, y: 1)
                    Image(systemName: "chevron.left")
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundStyle(Color.ongoTextPrimary)
                }
            }
            .buttonStyle(.plain)

            Spacer()

            Text("Checkout")
                .font(.system(size: 17, weight: .bold))
                .foregroundStyle(Color.ongoTextPrimary)

            Spacer()

            HStack(spacing: 4) {
                Image(systemName: "lock.fill")
                    .font(.system(size: 12, weight: .medium))
                Text("Secure")
                    .font(.system(size: 14, weight: .medium))
            }
            .foregroundStyle(Color.ongoPrimary)
        }
        .padding(.horizontal, OngoSpacing.lg)
        .padding(.vertical, OngoSpacing.sm)
        .background(Color.ongoBackground)
    }

    // MARK: - Plan section

    private var planSection: some View {
        VStack(alignment: .leading, spacing: OngoSpacing.sm) {
            Text("CHOOSE YOUR PLAN")
                .ongoLabelStyle()
            VStack(spacing: OngoSpacing.xs) {
                ForEach(plans, id: \.id) { plan in
                    planRow(plan)
                }
            }
        }
    }

    private func planRow(_ plan: Plan) -> some View {
        let isSelected = selectedPlanId == plan.id
        return Button { selectedPlanId = plan.id } label: {
            HStack(alignment: .top, spacing: OngoSpacing.sm) {
                // Radio button
                ZStack {
                    Circle()
                        .stroke(isSelected ? Color.ongoPrimary : Color.ongoBorder, lineWidth: 2)
                        .frame(width: 22, height: 22)
                    if isSelected {
                        Circle()
                            .fill(Color.ongoPrimary)
                            .frame(width: 12, height: 12)
                    }
                }
                .padding(.top, 2)

                // Text block
                VStack(alignment: .leading, spacing: 3) {
                    HStack(spacing: 6) {
                        Text(plan.name)
                            .font(.system(size: 15, weight: .bold))
                            .foregroundStyle(Color.ongoTextPrimary)
                        if let savings = plan.savings {
                            Text(savings)
                                .font(.system(size: 10, weight: .bold))
                                .foregroundStyle(Color.ongoPrimary)
                                .tracking(0.5)
                        }
                    }
                    Text(plan.description)
                        .font(.system(size: 13))
                        .foregroundStyle(Color.ongoTextSecondary)
                    Text(plan.monthly)
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(Color.ongoTextSecondary)
                }

                Spacer()

                // Price
                Text(plan.price)
                    .font(.system(size: 17, weight: .bold))
                    .foregroundStyle(Color.ongoTextPrimary)
                    .padding(.top, 2)
            }
            .padding(OngoSpacing.md)
            .background(isSelected ? Color.ongoGreenMuted : Color.ongoCard)
            .clipShape(RoundedRectangle(cornerRadius: OngoRadius.md))
            .overlay(
                RoundedRectangle(cornerRadius: OngoRadius.md)
                    .stroke(isSelected ? Color.ongoPrimary : Color.ongoBorder, lineWidth: isSelected ? 2 : 1)
            )
            .overlay(alignment: .topTrailing) {
                if plan.isPopular {
                    Text("POPULAR")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundStyle(.white)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Color.ongoPrimary)
                        .clipShape(RoundedRectangle(cornerRadius: 6))
                        .offset(x: -10, y: -1)
                }
            }
        }
        .buttonStyle(.plain)
    }

    // MARK: - Payment method

    private var paymentMethodSection: some View {
        VStack(alignment: .leading, spacing: OngoSpacing.sm) {
            Text("PAYMENT METHOD")
                .ongoLabelStyle()
            HStack(spacing: OngoSpacing.xs) {
                // Card
                Button { paymentMethod = .card } label: {
                    HStack(spacing: 6) {
                        Image(systemName: "creditcard")
                            .font(.system(size: 14, weight: .medium))
                        Text("Card")
                            .font(.system(size: 15, weight: .semibold))
                    }
                    .foregroundStyle(Color.ongoTextPrimary)
                    .frame(maxWidth: .infinity)
                    .frame(height: 52)
                    .background(Color.ongoCard)
                    .clipShape(RoundedRectangle(cornerRadius: OngoRadius.md))
                    .overlay(
                        RoundedRectangle(cornerRadius: OngoRadius.md)
                            .stroke(paymentMethod == .card ? Color.ongoTextPrimary : Color.ongoBorder,
                                    lineWidth: paymentMethod == .card ? 2 : 1)
                    )
                }
                .buttonStyle(.plain)

                // Apple Pay
                Button { paymentMethod = .applePay } label: {
                    HStack(spacing: 4) {
                        Image(systemName: "apple.logo")
                            .font(.system(size: 14, weight: .medium))
                        Text("Pay")
                            .font(.system(size: 15, weight: .semibold))
                    }
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .frame(height: 52)
                    .background(Color.black)
                    .clipShape(RoundedRectangle(cornerRadius: OngoRadius.md))
                }
                .buttonStyle(.plain)
            }
        }
    }

    // MARK: - Card fields

    private var cardSection: some View {
        VStack(alignment: .leading, spacing: OngoSpacing.md) {
            VStack(alignment: .leading, spacing: OngoSpacing.xs) {
                Text("CARD NUMBER")
                    .ongoLabelStyle()
                cardNumberField
            }

            HStack(alignment: .top, spacing: OngoSpacing.sm) {
                VStack(alignment: .leading, spacing: OngoSpacing.xs) {
                    Text("EXPIRATION")
                        .ongoLabelStyle()
                    OngoTextField(placeholder: "MM / YY", text: $expiration, keyboardType: .numberPad)
                }
                VStack(alignment: .leading, spacing: OngoSpacing.xs) {
                    Text("CVC")
                        .ongoLabelStyle()
                    OngoTextField(placeholder: "•••", text: $cvc, keyboardType: .numberPad)
                }
            }

            VStack(alignment: .leading, spacing: OngoSpacing.xs) {
                Text("NAME ON CARD")
                    .ongoLabelStyle()
                OngoTextField(placeholder: "Full name", text: $nameOnCard)
            }
        }
    }

    // MARK: - Apple Pay info card

    private var applePaySection: some View {
        VStack(spacing: OngoSpacing.md) {
            ZStack {
                Circle()
                    .fill(Color.black)
                    .frame(width: 56, height: 56)
                Image(systemName: "apple.logo")
                    .font(.system(size: 24, weight: .medium))
                    .foregroundStyle(.white)
            }
            VStack(spacing: OngoSpacing.xs) {
                Text("Pay with Apple Pay")
                    .font(.system(size: 17, weight: .bold))
                    .foregroundStyle(Color.ongoTextPrimary)
                Text("Tap \"Confirm\" below — you'll authorize the payment with Face ID or Touch ID.")
                    .font(.system(size: 14))
                    .foregroundStyle(Color.ongoTextSecondary)
                    .multilineTextAlignment(.center)
                    .lineSpacing(2)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, OngoSpacing.xl)
        .padding(.horizontal, OngoSpacing.lg)
        .background(Color.ongoCard)
        .clipShape(RoundedRectangle(cornerRadius: OngoRadius.md))
    }

    // MARK: - Order summary

    private var orderSummarySection: some View {
        VStack(alignment: .leading, spacing: OngoSpacing.sm) {
            Text("ORDER SUMMARY")
                .ongoLabelStyle()

            VStack(spacing: 0) {
                summaryRow(label: selectedPlan.name, value: selectedPlan.price, valueBold: false)
                Divider().padding(.vertical, OngoSpacing.xs)
                summaryRow(label: "First consultation", value: "Included", valueColor: Color.ongoPrimary)
                if let savings = selectedPlan.savingsValue {
                    Divider().padding(.vertical, OngoSpacing.xs)
                    summaryRow(label: "Plan savings", value: "– $\(formatAmount(savings))", valueColor: Color.ongoPrimary)
                }
                Divider().padding(.vertical, OngoSpacing.sm)
                summaryRow(label: "Total today", value: selectedPlan.price, valueBold: true, labelBold: true)
            }
            .padding(OngoSpacing.md)
            .background(Color.ongoCard)
            .clipShape(RoundedRectangle(cornerRadius: OngoRadius.md))
        }
    }

    private func summaryRow(label: String, value: String, valueColor: Color = Color.ongoTextPrimary, valueBold: Bool = false, labelBold: Bool = false) -> some View {
        HStack {
            Text(label)
                .font(.system(size: 15, weight: labelBold ? .bold : .regular))
                .foregroundStyle(Color.ongoTextPrimary)
            Spacer()
            Text(value)
                .font(.system(size: 15, weight: valueBold ? .bold : .regular))
                .foregroundStyle(valueColor)
        }
    }

    private func formatAmount(_ amount: Double) -> String {
        let formatted = String(format: "%.2f", amount)
        return formatted
    }

    // MARK: - Trust badges

    private var trustBadges: some View {
        HStack(spacing: OngoSpacing.lg) {
            Spacer()
            trustBadge(icon: "lock.fill", label: "Encrypted")
            trustBadge(icon: "checkmark.shield.fill", label: "HIPAA Secure")
            trustBadge(icon: "clock", label: "Cancel anytime")
            Spacer()
        }
        .padding(.vertical, OngoSpacing.sm)
    }

    private func trustBadge(icon: String, label: String) -> some View {
        HStack(spacing: 4) {
            Image(systemName: icon)
                .font(.system(size: 12))
            Text(label)
                .font(.system(size: 12))
        }
        .foregroundStyle(Color.ongoTextSecondary)
    }

    private var cardNumberField: some View {
        HStack(spacing: OngoSpacing.xs) {
            Text("VISA")
                .font(.system(size: 9, weight: .black))
                .foregroundStyle(.white)
                .frame(width: 38, height: 24)
                .background(Color(hex: "#1a1f71"))
                .clipShape(RoundedRectangle(cornerRadius: 4))
            TextField("1234 1234 1234 1234", text: $cardNumber)
                .font(OngoFont.body())
                .keyboardType(.numberPad)
        }
        .padding(.horizontal, OngoSpacing.md)
        .frame(height: 52)
        .background(Color.ongoCard)
        .clipShape(RoundedRectangle(cornerRadius: OngoRadius.md))
        .overlay(
            RoundedRectangle(cornerRadius: OngoRadius.md)
                .stroke(Color.ongoBorder, lineWidth: 1)
        )
    }

    // MARK: - Bottom CTA

    private var bottomCTA: some View {
        VStack(spacing: OngoSpacing.xs) {
            OngoPrimaryButton(title: "Confirm & Pay \(selectedPlan.price)", isLoading: isProcessing) {
                processPayment()
            }

            HStack(spacing: 3) {
                Text("By confirming, you agree to our")
                    .font(.system(size: 12))
                    .foregroundStyle(Color.ongoTextSecondary)
                Text("Terms")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(Color.ongoPrimary)
                Text("&")
                    .font(.system(size: 12))
                    .foregroundStyle(Color.ongoTextSecondary)
                Text("Privacy Policy.")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(Color.ongoPrimary)
            }
        }
        .padding(.horizontal, OngoSpacing.lg)
        .padding(.top, OngoSpacing.sm)
        .padding(.bottom, OngoSpacing.xxxl)
        .background(
            Color.ongoBackground
                .shadow(color: .black.opacity(0.06), radius: 8, x: 0, y: -4)
                .ignoresSafeArea(edges: .bottom)
        )
    }

    private func processPayment() {
        isProcessing = true
        // TODO: Stripe SDK integration
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
            isProcessing = false
            onComplete()
        }
    }
}
