import Foundation
import Observation

// Matches prototype #shopTab — loads products + plans from Firestore with 1-hour cache
@Observable
final class ShopViewModel {
    var products: [ShopProduct] = []
    var plans: [SubscriptionPlan] = []
    var isLoading: Bool = false
    var selectedPlan: SubscriptionPlan? = nil
    var showCheckout: Bool = false
    var showBooking: Bool = false

    private let firestore = FirestoreService.shared

    // MARK: - 1-hour local cache (same pattern as ATF messages + medications)
    @MainActor private static var productsCache: [ShopProduct] = []
    @MainActor private static var productsCacheExpiry: Date = .distantPast
    @MainActor private static var plansCache: [SubscriptionPlan] = []
    @MainActor private static var plansCacheExpiry: Date = .distantPast
    private static let cacheTTL: TimeInterval = 3600

    @MainActor
    func load() async {
        isLoading = true
        products = (try? await loadProducts()) ?? ShopProduct.defaults
        plans = (try? await loadPlans()) ?? SubscriptionPlan.defaults
        isLoading = false
    }

    @MainActor private func loadProducts() async throws -> [ShopProduct] {
        if Date() < Self.productsCacheExpiry && !Self.productsCache.isEmpty {
            return Self.productsCache
        }
        let fetched = try await firestore.query(
            ShopProduct.self,
            collection: ShopProduct.collectionPath,
            orderBy: ("brand", descending: false)
        )
        let result = fetched.isEmpty ? ShopProduct.defaults : fetched
        Self.productsCache = result
        Self.productsCacheExpiry = Date().addingTimeInterval(Self.cacheTTL)
        return result
    }

    @MainActor private func loadPlans() async throws -> [SubscriptionPlan] {
        if Date() < Self.plansCacheExpiry && !Self.plansCache.isEmpty {
            return Self.plansCache
        }
        let fetched = try await firestore.query(
            SubscriptionPlan.self,
            collection: SubscriptionPlan.collectionPath,
            orderBy: ("price", descending: false)
        )
        let result = fetched.isEmpty ? SubscriptionPlan.defaults : fetched
        Self.plansCache = result
        Self.plansCacheExpiry = Date().addingTimeInterval(Self.cacheTTL)
        return result
    }

    func selectPlan(_ plan: SubscriptionPlan) {
        selectedPlan = plan
        showCheckout = true
    }

    func consultToOrder() {
        showBooking = true
    }
}
