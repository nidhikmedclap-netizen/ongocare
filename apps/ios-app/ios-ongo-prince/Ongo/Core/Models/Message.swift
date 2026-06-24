import Foundation
@preconcurrency import FirebaseFirestore

struct Message: Codable, Identifiable, Sendable {
    @DocumentID var id: String?

    var threadId: String           // patientId_doctorId or visitId
    var senderId: String
    var senderType: SenderType
    var senderName: String
    var senderPhotoURL: String?

    var body: String
    var attachmentURL: String?
    var attachmentType: AttachmentType?

    var readBy: [String]           // user IDs who have read this
    var sentAt: Date

    var isFromCurrentUser: Bool = false  // computed at read time, not stored

    enum SenderType: String, Codable {
        case patient = "patient"
        case doctor = "doctor"
        case ai = "ai"
    }

    enum AttachmentType: String, Codable {
        case image = "image"
        case pdf = "pdf"
        case audio = "audio"
    }

    static let collectionPath = "messages"

    static func threadId(patientId: String, doctorId: String) -> String {
        [patientId, doctorId].sorted().joined(separator: "_")
    }
}
