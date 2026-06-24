import Foundation
@preconcurrency import FirebaseFirestore

// GLP-1 medication listings — Firestore `products` collection
struct ShopProduct: Identifiable, Codable, Sendable {
    @DocumentID var id: String?
    var brand: String             // "OZEMPIC"
    var generic: String           // "semaglutide"
    var isPopular: Bool
    var priceOld: Double          // crossed-out price
    var priceNew: Double          // current price
    var productDescription: String
    var isOral: Bool
    var accentHex: String         // display color hex
    var requiresRx: Bool

    static let collectionPath = "products"

    var discountPercent: Int {
        guard priceOld > 0 else { return 0 }
        return Int((priceOld - priceNew) / priceOld * 100)
    }

    var formLabel: String { isOral ? "Once-daily pill" : "Weekly injection" }

    // Firestore fallback — shown when collection is empty or offline
    static let defaults: [ShopProduct] = [
        ShopProduct(brand: "OZEMPIC", generic: "semaglutide", isPopular: true,
                    priceOld: 1050, priceNew: 899,
                    productDescription: "Weekly injection for type 2 diabetes and weight management.",
                    isOral: false, accentHex: "#3a7fb8", requiresRx: true),
        ShopProduct(brand: "WEGOVY", generic: "semaglutide", isPopular: true,
                    priceOld: 1399, priceNew: 1249,
                    productDescription: "Higher-dose semaglutide approved specifically for chronic weight management.",
                    isOral: false, accentHex: "#5a8fd9", requiresRx: true),
        ShopProduct(brand: "ZEPBOUND", generic: "tirzepatide", isPopular: false,
                    priceOld: 1299, priceNew: 1099,
                    productDescription: "Dual GIP and GLP-1 receptor agonist for weight management.",
                    isOral: false, accentHex: "#7a5cb8", requiresRx: true),
        ShopProduct(brand: "MOUNJARO", generic: "tirzepatide", isPopular: false,
                    priceOld: 1199, priceNew: 1049,
                    productDescription: "Dual-action tirzepatide for diabetes with significant weight loss benefit.",
                    isOral: false, accentHex: "#d97a4d", requiresRx: true),
        ShopProduct(brand: "LIRAGLUTIDE", generic: "Saxenda/Victoza", isPopular: false,
                    priceOld: 899, priceNew: 749,
                    productDescription: "Daily GLP-1 injection proven to reduce appetite and body weight.",
                    isOral: false, accentHex: "#5cb892", requiresRx: true),
        ShopProduct(brand: "RYBELSUS", generic: "semaglutide (oral)", isPopular: false,
                    priceOld: 799, priceNew: 649,
                    productDescription: "The only once-daily oral GLP-1 medication — no injections required.",
                    isOral: true, accentHex: "#b85c8a", requiresRx: true),
    ]
}
