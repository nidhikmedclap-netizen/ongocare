import Foundation
@preconcurrency import FirebaseFirestore

// Subscription plan tiers — Firestore `plans` collection
struct SubscriptionPlan: Identifiable, Codable, Sendable {
    @DocumentID var id: String?
    var planId: String       // "1mo" | "3mo" | "6mo"
    var name: String
    var price: Double        // total charge
    var period: String       // "per month", "per 3 months ($299/mo)"
    var isPopular: Bool
    var features: [String]
    var consultations: Int   // doctor visits included
    var stripePriceId: String?

    static let collectionPath = "plans"

    var planTier: String {
        switch planId {
        case "1mo": return "starter"
        case "3mo": return "core"
        case "6mo": return "premium"
        default:    return "none"
        }
    }

    var renewalMonths: Int {
        switch planId {
        case "3mo": return 3
        case "6mo": return 6
        default:    return 1
        }
    }

    var savingsLabel: String? {
        switch planId {
        case "3mo": return "Save $150"
        case "6mo": return "Save $495"
        default:    return nil
        }
    }

    var monthlyEquivalent: String? {
        switch planId {
        case "3mo": return "$299/mo"
        case "6mo": return "$266/mo"
        default:    return nil
        }
    }

    static let defaults: [SubscriptionPlan] = [
        SubscriptionPlan(
            planId: "1mo", name: "1-Month Plan", price: 349,
            period: "per month", isPopular: false,
            features: ["Monthly doctor visit", "Prescription support", "In-app tracking"],
            consultations: 1),
        SubscriptionPlan(
            planId: "3mo", name: "3-Month Plan", price: 897,
            period: "per 3 months ($299/mo)", isPopular: true,
            features: ["3 doctor visits", "Prescription support", "Priority care team", "Save $150 vs monthly"],
            consultations: 3),
        SubscriptionPlan(
            planId: "6mo", name: "6-Month Plan", price: 1599,
            period: "per 6 months ($266/mo)", isPopular: false,
            features: ["6 doctor visits", "Prescription support", "Priority care team", "Best value — save $495"],
            consultations: 6),
    ]
}
