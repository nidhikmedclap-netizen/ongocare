import Foundation
import FirebaseFirestore

// Active subscription — Firestore `subscriptions/{userId}` document
struct UserSubscription: Codable {
    var userId: String
    var planId: String
    var planName: String
    var price: Double
    var period: String
    var nextRenewalDate: Date?
    var consultsTotal: Int
    var consultsUsed: Int
    var stripeSubscriptionId: String?
    var stripeCustomerId: String?
    var isActive: Bool
    var purchasedAt: Date

    static let collectionPath = "subscriptions"

    var consultsRemaining: Int { max(0, consultsTotal - consultsUsed) }

    var renewalLabel: String {
        guard let renewal = nextRenewalDate else { return "—" }
        return renewal.mediumDate
    }
}
