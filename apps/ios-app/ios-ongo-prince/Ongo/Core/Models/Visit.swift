import Foundation
@preconcurrency import FirebaseFirestore

struct Visit: Codable, Identifiable, Sendable {
    @DocumentID var id: String?

    var patientId: String
    var doctorId: String
    var doctorName: String         // denormalized for display without extra fetch
    var doctorPhotoURL: String?

    var visitType: VisitType
    var status: VisitStatus
    var scheduledAt: Date
    var durationMinutes: Int

    var appointmentOutcome: AppointmentOutcome?
    var notes: String?

    var createdAt: Date
    var updatedAt: Date

    enum VisitType: String, Codable, CaseIterable {
        case chat = "chat"
        case call = "call"
        case video = "video"

        var displayName: String {
            switch self {
            case .chat:  return "Message"
            case .call:  return "Phone Call"
            case .video: return "Video Visit"
            }
        }

        var icon: String {
            switch self {
            case .chat:  return "message.fill"
            case .call:  return "phone.fill"
            case .video: return "video.fill"
            }
        }
    }

    enum VisitStatus: String, Codable {
        case scheduled = "scheduled"
        case inProgress = "in_progress"
        case completed = "completed"
        case cancelled = "cancelled"
        case noShow = "no_show"
    }

    struct AppointmentOutcome: Codable {
        var status: OutcomeStatus
        var message: String?
        var prescriptionId: String?
        var setAt: Date

        enum OutcomeStatus: String, Codable {
            case approved = "approved"
            case needsMoreInfo = "needs_more_info"
            case declined = "declined"
        }
    }

    static let collectionPath = "visits"
}
