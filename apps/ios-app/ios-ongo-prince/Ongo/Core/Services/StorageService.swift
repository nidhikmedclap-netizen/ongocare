import Foundation
import FirebaseStorage
import UIKit

final class StorageService {
    @MainActor static let shared = StorageService()
    private let storage = Storage.storage()
    private init() {}

    // MARK: - Profile photo
    func uploadProfilePhoto(_ image: UIImage, userId: String) async throws -> URL {
        let path = "users/\(userId)/profile.jpg"
        return try await uploadImage(image, path: path)
    }

    // MARK: - Survey photo ID
    func uploadPhotoID(_ image: UIImage, userId: String) async throws -> URL {
        let path = "users/\(userId)/photo_id.jpg"
        return try await uploadImage(image, path: path)
    }

    // MARK: - GLP-1 medication photo (survey)
    func uploadMedicationPhoto(_ image: UIImage, userId: String) async throws -> URL {
        let path = "users/\(userId)/medication_photo.jpg"
        return try await uploadImage(image, path: path)
    }

    // MARK: - Progress/weight photo
    func uploadProgressPhoto(_ image: UIImage, userId: String) async throws -> URL {
        let filename = "progress_\(Int(Date().timeIntervalSince1970)).jpg"
        let path = "users/\(userId)/progress/\(filename)"
        return try await uploadImage(image, path: path)
    }

    // MARK: - Private image upload helper
    private func uploadImage(_ image: UIImage, path: String) async throws -> URL {
        guard let data = image.jpegData(compressionQuality: 0.8) else {
            throw StorageError.imageCompressionFailed
        }
        let ref = storage.reference().child(path)
        let metadata = StorageMetadata()
        metadata.contentType = "image/jpeg"
        _ = try await ref.putDataAsync(data, metadata: metadata)
        return try await ref.downloadURL()
    }

    // MARK: - Download URL from storage path
    func downloadURL(for path: String) async throws -> URL {
        try await storage.reference().child(path).downloadURL()
    }

    enum StorageError: LocalizedError {
        case imageCompressionFailed
        var errorDescription: String? {
            "Failed to compress image. Please try again."
        }
    }
}
