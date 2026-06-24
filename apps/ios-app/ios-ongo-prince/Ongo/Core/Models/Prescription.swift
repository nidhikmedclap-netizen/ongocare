import Foundation
@preconcurrency import FirebaseFirestore

struct Prescription: Codable, Identifiable, Sendable {
    @DocumentID var id: String?

    var patientId: String
    var doctorId: String
    var visitId: String?

    var medicationName: String     // "Wegovy", "Mounjaro"
    var genericName: String        // "semaglutide", "tirzepatide"
    var dose: String               // "0.5 mg"
    var frequency: String          // "once weekly"
    var quantity: Int
    var daysSupply: Int
    var refillsRemaining: Int

    var instructions: String
    var instructionsEs: String?    // Spanish translation for rxPage toggle

    var pharmacyName: String?
    var pharmacyAddress: String?
    var pharmacyPhone: String?

    var status: PrescriptionStatus
    var writtenAt: Date
    var expiresAt: Date

    // Storage path for PDF download
    var documentURL: String?

    enum PrescriptionStatus: String, Codable {
        case pending = "pending"
        case sent = "sent"
        case filled = "filled"
        case active = "active"
        case expired = "expired"
        case cancelled = "cancelled"
    }

    var isActive: Bool {
        status == .active && expiresAt > Date()
    }

    static let collectionPath = "prescriptions"
}

// MARK: - Refill request
struct RefillRequest: Codable, Identifiable {
    @DocumentID var id: String?

    var patientId: String
    var prescriptionId: String
    var status: RefillStatus
    var requestedAt: Date
    var resolvedAt: Date?
    var notes: String?

    enum RefillStatus: String, Codable {
        case pending = "pending"
        case approved = "approved"
        case denied = "denied"
    }

    static let collectionPath = "refillRequests"
}
