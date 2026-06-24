import Foundation
@preconcurrency import StripePaymentSheet

// MARK: - Stripe PaymentSheet factory
// WIRE: Deploy a Cloud Function that creates a Stripe PaymentIntent and returns JSON:
//   { "clientSecret": "pi_..._secret_...", "publishableKey": "pk_live_..." }
// POST body: { planId, userId, amountCents, currency }
// Suggested Firebase Cloud Function name: `createPaymentIntent`

enum PaymentError: LocalizedError {
    case backendNotConfigured
    case serverError(Int)
    case malformedResponse

    var errorDescription: String? {
        switch self {
        case .backendNotConfigured: return "Payment backend not configured. Please contact support."
        case .serverError(let code): return "Payment server returned an unexpected response (\(code))."
        case .malformedResponse: return "Payment server response was missing required fields."
        }
    }
}

@MainActor final class PaymentService {
    @MainActor static let shared = PaymentService()
    private init() {}

    // REPLACE with your deployed Cloud Function URL before going live
    private let backendURL = URL(string: "https://REGION-PROJECT_ID.cloudfunctions.net/createPaymentIntent")!

    func preparePaymentSheet(planId: String, userId: String, amountCents: Int) async throws -> PaymentSheet {
        guard backendURL.host != "REGION-PROJECT_ID.cloudfunctions.net" else {
            throw PaymentError.backendNotConfigured
        }

        struct Body: Encodable { let planId, userId, currency: String; let amountCents: Int }
        struct Response: Decodable { let clientSecret, publishableKey: String }

        var req = URLRequest(url: backendURL)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.httpBody = try JSONEncoder().encode(Body(planId: planId, userId: userId, currency: "usd", amountCents: amountCents))

        let (data, raw) = try await URLSession.shared.data(for: req)
        guard let http = raw as? HTTPURLResponse, http.statusCode == 200 else {
            throw PaymentError.serverError((raw as? HTTPURLResponse)?.statusCode ?? -1)
        }

        let resp: Response
        do {
            resp = try JSONDecoder().decode(Response.self, from: data)
        } catch {
            throw PaymentError.malformedResponse
        }

        configureStripe(publishableKey: resp.publishableKey)

        var config = PaymentSheet.Configuration()
        config.merchantDisplayName = "Ongo Health"
        config.allowsDelayedPaymentMethods = true
        config.applePay = .init(merchantId: "merchant.com.ongo.app", merchantCountryCode: "US")

        return PaymentSheet(paymentIntentClientSecret: resp.clientSecret, configuration: config)
    }

    nonisolated func configureStripe(publishableKey: String) {
        DispatchQueue.main.async {
            StripeAPI.defaultPublishableKey = publishableKey
        }
    }
}
