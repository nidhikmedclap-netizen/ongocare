import Foundation
import FirebaseFirestore

// Payment / plan activity record — Firestore `transactions` collection
struct OngoTransaction: Identifiable, Codable {
    @DocumentID var id: String?
    var userId: String
    var type: TransactionType
    var title: String
    var meta: String      // "Visa ending 4242", "Plan covered"
    var amount: Double
    var date: Date
    var tag: String       // "Charged", "Plan covered", "No charge"

    enum TransactionType: String, Codable {
        case plan
        case consult
    }

    static let collectionPath = "transactions"

    var isCharge: Bool { type == .plan }
    var formattedAmount: String {
        amount == 0 ? "$0.00" : String(format: "$%.2f", amount)
    }
}
