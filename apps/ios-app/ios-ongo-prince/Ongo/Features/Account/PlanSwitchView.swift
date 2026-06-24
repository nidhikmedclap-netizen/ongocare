import SwiftUI

// Matches prototype #planSwitchPage — select a new plan to upgrade or downgrade
struct PlanSwitchView: View {
    let currentPlanId: String?
    let userId: String
    @Environment(\.dismiss) private var dismiss
    @State private var plans: [SubscriptionPlan] = SubscriptionPlan.defaults
    @State private var selectedPlanId: String? = nil
    @State private var showCheckout: Bool = false

    private var selectedPlan: SubscriptionPlan? {
        plans.first { $0.planId == selectedPlanId }
    }

    private var canConfirm: Bool {
        selectedPlanId != nil && selectedPlanId != currentPlanId
    }

    var body: some View {
        NavigationStack {
            ScrollView(showsIndicators: false) {
                VStack(spacing: OngoSpacing.md) {
                    // Current plan banner
                    if let currentId = currentPlanId, let current = plans.first(where: { $0.planId == currentId }) {
                        OngoCard {
                            HStack {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text("Your Current Plan")
                                        .font(OngoFont.caption(10)).foregroundStyle(Color.ongoTextTertiary)
                                    Text(current.name).font(OngoFont.subheadline())
                                    Text(current.period).font(OngoFont.caption()).foregroundStyle(Color.ongoTextSecondary)
                                }
                                Spacer()
                                Text(String(format: "$%.0f", current.price))
                                    .font(.system(size: 22, weight: .bold)).foregroundStyle(Color.ongoPrimary)
                            }
                        }
                    }

                    Text("Available plans")
                        .font(OngoFont.subheadline())
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.horizontal, OngoSpacing.xxs)

                    ForEach(plans) { plan in
                        planCard(plan)
                    }
                }
                .padding(.horizontal, OngoSpacing.md)
                .padding(.vertical, OngoSpacing.md)
                .padding(.bottom, 120)
            }
            .background(Color.ongoBackground)
            .navigationTitle("Change Plan")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button { dismiss() } label: {
                        Image(systemName: "xmark").foregroundStyle(Color.ongoTextSecondary)
                    }
                }
            }
            .safeAreaInset(edge: .bottom) {
                OngoPrimaryButton(title: "Confirm switch", isDisabled: !canConfirm) {
                    showCheckout = true
                }
                .padding(.horizontal, OngoSpacing.md)
                .padding(.bottom, OngoSpacing.md)
                .background(.ultraThinMaterial)
            }
        }
        .sheet(isPresented: $showCheckout) {
            if let plan = selectedPlan {
                CheckoutView(plan: plan, userId: userId)
                    .presentationDetents([.large])
            }
        }
        .task {
            if let fetched = try? await FirestoreService.shared.query(
                SubscriptionPlan.self,
                collection: SubscriptionPlan.collectionPath,
                orderBy: ("price", descending: false)
            ), !fetched.isEmpty {
                plans = fetched
            }
        }
    }

    private func planCard(_ plan: SubscriptionPlan) -> some View {
        let isCurrent = plan.planId == currentPlanId
        let isSelected = plan.planId == selectedPlanId

        return ZStack(alignment: .topTrailing) {
            Button {
                if !isCurrent { withAnimation { selectedPlanId = plan.planId } }
            } label: {
                OngoCard(cornerRadius: OngoRadius.md) {
                    VStack(alignment: .leading, spacing: OngoSpacing.sm) {
                        HStack {
                            VStack(alignment: .leading, spacing: 2) {
                                Text(plan.name + (isCurrent ? " (Current)" : ""))
                                    .font(OngoFont.headline(17))
                                    .foregroundStyle(isCurrent ? Color.ongoTextTertiary : Color.ongoTextPrimary)
                                Text(plan.period)
                                    .font(OngoFont.caption())
                                    .foregroundStyle(Color.ongoTextSecondary)
                            }
                            Spacer()
                            Text(String(format: "$%.0f", plan.price))
                                .font(.system(size: 22, weight: .bold))
                                .foregroundStyle(isCurrent ? Color.ongoTextTertiary : Color.ongoPrimary)
                        }

                        VStack(alignment: .leading, spacing: OngoSpacing.xxs) {
                            ForEach(plan.features.prefix(3), id: \.self) { feature in
                                HStack(spacing: OngoSpacing.xs) {
                                    Image(systemName: "checkmark.circle.fill")
                                        .font(.system(size: 12))
                                        .foregroundStyle(isCurrent ? Color.ongoTextTertiary : Color.ongoSuccess)
                                    Text(feature)
                                        .font(OngoFont.caption())
                                        .foregroundStyle(isCurrent ? Color.ongoTextTertiary : Color.ongoTextPrimary)
                                }
                            }
                        }
                    }
                }
                .overlay(
                    RoundedRectangle(cornerRadius: OngoRadius.md)
                        .stroke(isSelected ? Color.ongoPrimary : Color.clear, lineWidth: 2)
                )
                .opacity(isCurrent ? 0.6 : 1)
            }
            .disabled(isCurrent)

            if plan.isPopular && !isCurrent {
                Text("POPULAR")
                    .font(OngoFont.label(9))
                    .foregroundStyle(.white)
                    .padding(.horizontal, OngoSpacing.xs)
                    .padding(.vertical, 4)
                    .background(Color.ongoOrange)
                    .clipShape(UnevenRoundedRectangle(
                        topLeadingRadius: 0, bottomLeadingRadius: OngoRadius.sm,
                        bottomTrailingRadius: 0, topTrailingRadius: OngoRadius.md
                    ))
            }
        }
    }
}
