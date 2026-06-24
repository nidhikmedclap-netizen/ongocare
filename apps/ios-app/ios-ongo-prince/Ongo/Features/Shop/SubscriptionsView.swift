import SwiftUI

// Matches prototype #payPage — active plan, payment methods, transaction history
struct SubscriptionsView: View {
    let userId: String
    @Environment(\.dismiss) private var dismiss
    @State private var vm = SubscriptionsViewModel()
    @State private var showPlanSwitch: Bool = false

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(spacing: OngoSpacing.md) {
                if vm.isLoading {
                    ProgressView()
                        .frame(maxWidth: .infinity)
                        .padding(.top, OngoSpacing.xl)
                } else if let sub = vm.subscription {
                    activePlanCard(sub)
                    paymentMethodsSection
                    transactionHistorySection
                } else {
                    noActivePlanCard
                }
            }
            .padding(.horizontal, OngoSpacing.md)
            .padding(.vertical, OngoSpacing.md)
            .padding(.bottom, 100)
        }
        .background(Color.ongoBackground)
        .navigationTitle("Subscriptions & Payments")
        .navigationBarTitleDisplayMode(.inline)
        .task { await vm.load(userId: userId) }
        .sheet(isPresented: $showPlanSwitch) {
            PlanSwitchView(currentPlanId: vm.subscription?.planId, userId: userId)
                .presentationDetents([.large])
        }
    }

    // MARK: - Active plan card

    private func activePlanCard(_ sub: UserSubscription) -> some View {
        OngoCard(cornerRadius: OngoRadius.md) {
            VStack(alignment: .leading, spacing: OngoSpacing.sm) {
                // Badge
                OngoTagPill(label: "Active Plan", color: Color.ongoSuccess, style: .tinted)

                // Plan name + price
                HStack(alignment: .bottom) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(sub.planName)
                            .font(OngoFont.headline(18))
                        Text(sub.period)
                            .font(OngoFont.caption())
                            .foregroundStyle(Color.ongoTextSecondary)
                    }
                    Spacer()
                    Text(String(format: "$%.0f", sub.price))
                        .font(.system(size: 26, weight: .bold))
                        .foregroundStyle(Color.ongoPrimary)
                }

                Divider()

                // Stats grid
                HStack(spacing: 0) {
                    statCell(label: "Renewal", value: sub.renewalLabel)
                    Divider().frame(width: 1, height: 40)
                    statCell(label: "Consults used", value: "\(sub.consultsUsed)/\(sub.consultsTotal)")
                    Divider().frame(width: 1, height: 40)
                    statCell(label: "Remaining", value: "\(sub.consultsRemaining)")
                }

                // Action buttons
                HStack(spacing: OngoSpacing.sm) {
                    OngoSecondaryButton(title: "Switch Plan") {
                        showPlanSwitch = true
                    }
                    Button {
                        // Phase 17: cancel confirmation
                    } label: {
                        Text("Cancel Plan")
                            .font(OngoFont.subheadline())
                            .foregroundStyle(Color.ongoError)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 12)
                            .background(Color.ongoError.opacity(0.08))
                            .clipShape(RoundedRectangle(cornerRadius: OngoRadius.sm))
                    }
                }
            }
        }
    }

    private func statCell(label: String, value: String) -> some View {
        VStack(spacing: 2) {
            Text(value)
                .font(OngoFont.subheadline(14))
                .foregroundStyle(Color.ongoTextPrimary)
            Text(label)
                .font(OngoFont.caption(10))
                .foregroundStyle(Color.ongoTextTertiary)
        }
        .frame(maxWidth: .infinity)
    }

    // MARK: - Payment methods

    private var paymentMethodsSection: some View {
        OngoCard {
            VStack(alignment: .leading, spacing: OngoSpacing.sm) {
                Text("Payment Method")
                    .font(OngoFont.subheadline())

                HStack(spacing: OngoSpacing.sm) {
                    Image(systemName: "creditcard.fill")
                        .font(.system(size: 18))
                        .foregroundStyle(Color.ongoPrimary)
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Managed by Stripe")
                            .font(OngoFont.body())
                        Text("Secure card storage via Stripe")
                            .font(OngoFont.caption(11))
                            .foregroundStyle(Color.ongoTextTertiary)
                    }
                    Spacer()
                    // Future: Stripe Customer Portal deep link
                    Image(systemName: "chevron.right")
                        .font(.system(size: 12))
                        .foregroundStyle(Color.ongoTextTertiary)
                }
                .contentShape(Rectangle())
                .onTapGesture {
                    // WIRE: Open Stripe Customer Portal URL
                    // URL comes from a Cloud Function call `createCustomerPortalSession`
                }
            }
        }
    }

    // MARK: - Transaction history

    private var transactionHistorySection: some View {
        VStack(alignment: .leading, spacing: OngoSpacing.sm) {
            OngoSectionHeader(title: "Transaction History")

            if vm.transactions.isEmpty {
                OngoCard {
                    Text("No transactions yet.")
                        .font(OngoFont.body())
                        .foregroundStyle(Color.ongoTextTertiary)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, OngoSpacing.sm)
                }
            } else {
                OngoCard {
                    VStack(spacing: 0) {
                        ForEach(vm.transactions) { txn in
                            transactionRow(txn)
                            if txn.id != vm.transactions.last?.id {
                                Divider()
                            }
                        }
                    }
                }
            }
        }
    }

    private func transactionRow(_ txn: OngoTransaction) -> some View {
        HStack(spacing: OngoSpacing.sm) {
            ZStack {
                Circle()
                    .fill(txn.isCharge ? Color.ongoOrange.opacity(0.12) : Color.ongoPrimary.opacity(0.12))
                    .frame(width: 36, height: 36)
                Image(systemName: txn.isCharge ? "creditcard.fill" : "video.fill")
                    .font(.system(size: 14))
                    .foregroundStyle(txn.isCharge ? Color.ongoOrange : Color.ongoPrimary)
            }

            VStack(alignment: .leading, spacing: 2) {
                Text(txn.title)
                    .font(OngoFont.subheadline(13))
                    .foregroundStyle(Color.ongoTextPrimary)
                Text("\(txn.meta) · \(txn.date.shortDate)")
                    .font(OngoFont.caption(11))
                    .foregroundStyle(Color.ongoTextTertiary)
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 2) {
                Text(txn.formattedAmount)
                    .font(OngoFont.subheadline(13))
                    .foregroundStyle(Color.ongoTextPrimary)
                Text(txn.tag)
                    .font(OngoFont.label(10))
                    .foregroundStyle(txn.isCharge ? Color.ongoOrange : Color.ongoSuccess)
            }
        }
        .padding(.vertical, OngoSpacing.xs)
    }

    // MARK: - No active plan

    private var noActivePlanCard: some View {
        OngoCard {
            VStack(spacing: OngoSpacing.md) {
                Image(systemName: "creditcard.trianglebadge.exclamationmark")
                    .font(.system(size: 40))
                    .foregroundStyle(Color.ongoTextTertiary)
                Text("No active plan")
                    .font(OngoFont.subheadline())
                    .foregroundStyle(Color.ongoTextSecondary)
                Text("Choose a plan in the Shop tab to get started with GLP-1 treatment.")
                    .font(OngoFont.caption())
                    .foregroundStyle(Color.ongoTextTertiary)
                    .multilineTextAlignment(.center)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, OngoSpacing.md)
        }
    }
}

// MARK: - ViewModel

@Observable
@MainActor
private final class SubscriptionsViewModel {
    var subscription: UserSubscription? = nil
    var transactions: [OngoTransaction] = []
    var isLoading: Bool = false

    func load(userId: String) async {
        isLoading = true
        async let sub = try? FirestoreService.shared.get(UserSubscription.self,
                                                         collection: UserSubscription.collectionPath,
                                                         documentId: userId)
        async let txns = try? FirestoreService.shared.query(
            OngoTransaction.self,
            collection: OngoTransaction.collectionPath,
            filters: [("userId", .isEqualTo, userId)],
            orderBy: ("date", descending: true),
            limit: 20
        )
        subscription = await sub
        transactions = (await txns) ?? []
        isLoading = false
    }
}
