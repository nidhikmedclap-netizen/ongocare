import SwiftUI

// Matches prototype #shopTab — Medications / Plans / Supplements
struct ShopView: View {
    @Environment(AppState.self) private var appState
    @State private var vm = ShopViewModel()

    enum ShopSegment: String, CaseIterable {
        case meds = "Medications"
        case plans = "Plans"
        case supplements = "Supplements"
    }
    @State private var segment: ShopSegment = .meds

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Segment control
                Picker("Shop", selection: $segment) {
                    ForEach(ShopSegment.allCases, id: \.self) { seg in
                        Text(seg.rawValue).tag(seg)
                    }
                }
                .pickerStyle(.segmented)
                .padding(.horizontal, OngoSpacing.md)
                .padding(.vertical, OngoSpacing.sm)

                Divider()

                ScrollView(showsIndicators: false) {
                    VStack(spacing: OngoSpacing.md) {
                        switch segment {
                        case .meds:         medsContent
                        case .plans:        plansContent
                        case .supplements:  supplementsContent
                        }
                    }
                    .padding(.horizontal, OngoSpacing.md)
                    .padding(.vertical, OngoSpacing.md)
                    .padding(.bottom, 100)
                }
            }
            .background(Color.ongoBackground)
            .navigationTitle("Shop")
            .navigationBarTitleDisplayMode(.large)
        }
        .task { await vm.load() }
        .sheet(isPresented: $vm.showCheckout) {
            if let plan = vm.selectedPlan {
                CheckoutView(plan: plan, userId: appState.ongoUser?.id ?? "")
                    .presentationDetents([.large])
                    .presentationDragIndicator(.visible)
            }
        }
        .sheet(isPresented: $vm.showBooking) {
            BookingView()
                .presentationDetents([.large])
                .presentationDragIndicator(.visible)
        }
    }

    // MARK: - Medications tab

    private var medsContent: some View {
        VStack(spacing: OngoSpacing.md) {
            if vm.isLoading {
                ProgressView()
                    .frame(maxWidth: .infinity)
                    .padding(.top, OngoSpacing.xl)
            } else {
                ForEach(vm.products) { product in
                    medicationCard(product)
                }
            }
        }
    }

    private func medicationCard(_ product: ShopProduct) -> some View {
        OngoCard(cornerRadius: OngoRadius.md) {
            VStack(alignment: .leading, spacing: OngoSpacing.sm) {
                // Header row
                HStack(alignment: .top) {
                    VStack(alignment: .leading, spacing: 2) {
                        HStack(spacing: OngoSpacing.xs) {
                            Text(product.brand)
                                .font(OngoFont.headline(18))
                                .foregroundStyle(Color(hex: product.accentHex))
                            if product.isPopular {
                                OngoTagPill(label: "★ Popular", color: Color.ongoOrange, style: .tinted)
                            }
                        }
                        Text(product.generic)
                            .font(OngoFont.caption())
                            .foregroundStyle(Color.ongoTextSecondary)
                        Text(product.formLabel)
                            .font(OngoFont.label(11))
                            .foregroundStyle(Color.ongoTextTertiary)
                    }
                    Spacer()
                    // Pen/pill icon
                    Image(systemName: product.isOral ? "pill.fill" : "syringe.fill")
                        .font(.system(size: 28))
                        .foregroundStyle(Color(hex: product.accentHex).opacity(0.7))
                }

                // Description
                Text(product.productDescription)
                    .font(OngoFont.caption())
                    .foregroundStyle(Color.ongoTextSecondary)
                    .lineLimit(2)

                Divider()

                // Pricing + CTA
                HStack(alignment: .bottom) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(String(format: "$%.0f", product.priceOld))
                            .font(OngoFont.caption(11))
                            .foregroundStyle(Color.ongoTextTertiary)
                            .strikethrough()
                        HStack(alignment: .lastTextBaseline, spacing: 4) {
                            Text(String(format: "$%.0f", product.priceNew))
                                .font(.system(size: 22, weight: .bold))
                                .foregroundStyle(Color.ongoTextPrimary)
                            Text("/mo")
                                .font(OngoFont.caption())
                                .foregroundStyle(Color.ongoTextSecondary)
                        }
                        if product.discountPercent > 0 {
                            Text("Save \(product.discountPercent)%")
                                .font(OngoFont.label(10))
                                .foregroundStyle(Color.ongoSuccess)
                        }
                    }
                    Spacer()
                    VStack(alignment: .trailing, spacing: OngoSpacing.xs) {
                        OngoTagPill(label: "Rx Required", color: Color.ongoMeds, style: .tinted)
                        OngoPrimaryButton(title: "Consult to Order") {
                            vm.consultToOrder()
                        }
                    }
                }
            }
        }
    }

    // MARK: - Plans tab

    private var plansContent: some View {
        VStack(spacing: OngoSpacing.md) {
            if vm.isLoading {
                ProgressView().frame(maxWidth: .infinity).padding(.top, OngoSpacing.xl)
            } else {
                ForEach(vm.plans) { plan in
                    planCard(plan)
                }
            }
        }
    }

    private func planCard(_ plan: SubscriptionPlan) -> some View {
        ZStack(alignment: .topTrailing) {
            OngoCard(cornerRadius: OngoRadius.md) {
                VStack(alignment: .leading, spacing: OngoSpacing.sm) {
                    // Name + price
                    VStack(alignment: .leading, spacing: 2) {
                        Text(plan.name)
                            .font(OngoFont.headline(18))
                        HStack(alignment: .lastTextBaseline, spacing: 4) {
                            Text(String(format: "$%.0f", plan.price))
                                .font(.system(size: 28, weight: .heavy))
                                .foregroundStyle(Color.ongoPrimary)
                            Text(plan.period)
                                .font(OngoFont.caption())
                                .foregroundStyle(Color.ongoTextSecondary)
                        }
                        if let monthly = plan.monthlyEquivalent {
                            Text(monthly)
                                .font(OngoFont.label(11))
                                .foregroundStyle(Color.ongoTextSecondary)
                        }
                    }

                    Divider()

                    // Features
                    VStack(alignment: .leading, spacing: OngoSpacing.xs) {
                        ForEach(plan.features, id: \.self) { feature in
                            HStack(spacing: OngoSpacing.xs) {
                                Image(systemName: "checkmark.circle.fill")
                                    .font(.system(size: 14))
                                    .foregroundStyle(Color.ongoSuccess)
                                Text(feature)
                                    .font(OngoFont.body())
                                    .foregroundStyle(Color.ongoTextPrimary)
                            }
                        }
                    }

                    // Savings badge
                    if let savings = plan.savingsLabel {
                        OngoTagPill(label: savings, color: Color.ongoOrange, style: .tinted)
                    }

                    OngoPrimaryButton(title: "Select Plan") {
                        vm.selectPlan(plan)
                    }
                    .padding(.top, OngoSpacing.xxs)
                }
            }

            if plan.isPopular {
                Text("MOST POPULAR")
                    .font(OngoFont.label(9))
                    .foregroundStyle(.white)
                    .padding(.horizontal, OngoSpacing.xs)
                    .padding(.vertical, 4)
                    .background(Color.ongoOrange)
                    .clipShape(UnevenRoundedRectangle(
                        topLeadingRadius: 0,
                        bottomLeadingRadius: OngoRadius.sm,
                        bottomTrailingRadius: 0,
                        topTrailingRadius: OngoRadius.md
                    ))
            }
        }
    }

    // MARK: - Supplements tab

    private var supplementsContent: some View {
        OngoCard {
            VStack(spacing: OngoSpacing.sm) {
                Image(systemName: "pills.fill")
                    .font(.system(size: 36))
                    .foregroundStyle(Color.ongoTextTertiary)
                Text("Supplements coming soon")
                    .font(OngoFont.subheadline())
                    .foregroundStyle(Color.ongoTextSecondary)
                Text("We're curating GLP-1 support supplements including protein powders, electrolytes, and vitamins.")
                    .font(OngoFont.caption())
                    .foregroundStyle(Color.ongoTextTertiary)
                    .multilineTextAlignment(.center)
                OngoPrimaryButton(title: "Notify me") {
                    AnalyticsService.logAIBetaWaitlistJoined(feature: "supplements")
                }
                .padding(.top, OngoSpacing.xs)
            }
        }
        .padding(.top, OngoSpacing.sm)
    }
}
