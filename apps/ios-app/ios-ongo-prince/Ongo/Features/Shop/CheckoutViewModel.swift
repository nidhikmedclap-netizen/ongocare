import Foundation
import Observation
import StripePaymentSheet

// Manages the full checkout lifecycle: PaymentSheet setup → result → Firestore write
@Observable
@MainActor
final class CheckoutViewModel {
    var paymentSheet: PaymentSheet? = nil
    var isPreparingPayment: Bool = false
    var isShowingPaymentSheet: Bool = false
    var isSuccess: Bool = false
    var errorMessage: String? = nil

    let plan: SubscriptionPlan
    let userId: String

    init(plan: SubscriptionPlan, userId: String) {
        self.plan = plan
        self.userId = userId
    }

    // MARK: - Prepare PaymentSheet (called on appear)

    func prepare() async {
        guard paymentSheet == nil else { return }
        isPreparingPayment = true
        errorMessage = nil
        do {
            paymentSheet = try await PaymentService.shared.preparePaymentSheet(
                planId: plan.planId,
                userId: userId,
                amountCents: Int(plan.price * 100)
            )
        } catch {
            errorMessage = error.localizedDescription
        }
        isPreparingPayment = false
    }

    // MARK: - Stripe result handler (called from .paymentSheet modifier)

    func handlePaymentResult(_ result: PaymentSheetResult) {
        switch result {
        case .completed:
            Task { await saveSubscription() }
        case .canceled:
            break
        case .failed(let error):
            errorMessage = error.localizedDescription
        }
    }

    // MARK: - Persist subscription + transaction to Firestore on success

    private func saveSubscription() async {
        let firestore = FirestoreService.shared
        let renewal = Calendar.current.date(byAdding: .month, value: plan.renewalMonths, to: Date())

        let subscription = UserSubscription(
            userId: userId,
            planId: plan.planId,
            planName: plan.name,
            price: plan.price,
            period: plan.period,
            nextRenewalDate: renewal,
            consultsTotal: plan.consultations,
            consultsUsed: 0,
            stripeSubscriptionId: nil,
            stripeCustomerId: nil,
            isActive: true,
            purchasedAt: Date()
        )
        let transaction = OngoTransaction(
            userId: userId,
            type: .plan,
            title: "\(plan.name) · Purchased",
            meta: "Stripe",
            amount: plan.price,
            date: Date(),
            tag: "Charged"
        )

        try? await firestore.set(subscription, collection: UserSubscription.collectionPath, documentId: userId)
        _ = try? await firestore.add(transaction, collection: OngoTransaction.collectionPath)
        try? await firestore.updateUserPlanTier(plan.planTier, userId: userId)

        isSuccess = true
    }
}
