import Foundation
@preconcurrency import FirebaseFirestore

struct Doctor: Codable, Identifiable, Sendable {
    @DocumentID var id: String?

    var firstName: String
    var lastName: String
    var credentials: String        // "MD", "DO", "NP"
    var specialty: String          // "Internal Medicine", "Endocrinology"
    var bio: String
    var photoURL: String?

    var npi: String
    var licensedStates: [String]   // ISO 3166-2 state codes, e.g. ["CA", "TX", "FL"]

    var rating: Double
    var reviewCount: Int

    var isAvailable: Bool
    var nextAvailableSlot: Date?
    var timeZone: String           // "America/New_York"

    var acceptedInsurance: [String]
    var languages: [String]        // ["en", "es"]

    var createdAt: Date
    var active: Bool

    var fullName: String { "\(firstName) \(lastName), \(credentials)" }
    var displayName: String { "Dr. \(lastName)" }

    static let collectionPath = "doctors"
}

// MARK: - Availability slot for calendar
struct AvailabilitySlot: Codable, Identifiable {
    var id: String
    var doctorId: String
    var startTime: Date
    var endTime: Date
    var visitType: Visit.VisitType
    var isBooked: Bool

    static let collectionPath = "availability"
}
