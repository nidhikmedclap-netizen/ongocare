import Foundation
import FirebaseFirestore

// MARK: - Generic Firestore CRUD + real-time listener helpers
final class FirestoreService: @unchecked Sendable {
    static let shared = FirestoreService()
    private let db = Firestore.firestore()
    private init() {}

    // MARK: - Write / Update
    func set<T: Encodable>(_ value: T, collection: String, documentId: String) async throws {
        let ref = db.collection(collection).document(documentId)
        try ref.setData(from: value, merge: false)
    }

    func merge<T: Encodable>(_ value: T, collection: String, documentId: String) async throws {
        let ref = db.collection(collection).document(documentId)
        try ref.setData(from: value, merge: true)
    }

    func delete(collection: String, documentId: String) async throws {
        try await db.collection(collection).document(documentId).delete()
    }

    // MARK: - Read
    func get<T: Decodable>(_ type: T.Type, collection: String, documentId: String) async throws -> T {
        let snapshot = try await db.collection(collection).document(documentId).getDocument()
        return try snapshot.data(as: type)
    }

    func query<T: Decodable>(
        _ type: T.Type,
        collection: String,
        filters: [(field: String, op: ComparisonOperator, value: Any)] = [],
        orderBy: (field: String, descending: Bool)? = nil,
        limit: Int? = nil
    ) async throws -> [T] {
        var query: Query = db.collection(collection)
        for filter in filters {
            switch filter.op {
            case .isEqualTo:         query = query.whereField(filter.field, isEqualTo: filter.value)
            case .isLessThan:        query = query.whereField(filter.field, isLessThan: filter.value)
            case .isGreaterThan:     query = query.whereField(filter.field, isGreaterThan: filter.value)
            case .arrayContains:     query = query.whereField(filter.field, arrayContains: filter.value)
            }
        }
        if let order = orderBy {
            query = query.order(by: order.field, descending: order.descending)
        }
        if let limit {
            query = query.limit(to: limit)
        }
        let snapshot = try await query.getDocuments()
        return try snapshot.documents.compactMap { try $0.data(as: type) }
    }

    enum ComparisonOperator {
        case isEqualTo, isLessThan, isGreaterThan, arrayContains
    }

    // MARK: - Real-time listeners
    func listen<T: Decodable & Sendable>(
        _ type: T.Type,
        collection: String,
        documentId: String,
        onChange: @escaping @MainActor @Sendable (T?) -> Void
    ) -> ListenerRegistration {
        db.collection(collection).document(documentId)
            .addSnapshotListener { snapshot, _ in
                let value = try? snapshot?.data(as: type)
                Task { @MainActor in onChange(value) }
            }
    }

    func listenQuery<T: Decodable & Sendable>(
        _ type: T.Type,
        collection: String,
        filters: [(field: String, op: ComparisonOperator, value: Any)] = [],
        orderBy: (field: String, descending: Bool)? = nil,
        onChange: @escaping @MainActor @Sendable ([T]) -> Void
    ) -> ListenerRegistration {
        var query: Query = db.collection(collection)
        for filter in filters {
            switch filter.op {
            case .isEqualTo:     query = query.whereField(filter.field, isEqualTo: filter.value)
            case .isLessThan:    query = query.whereField(filter.field, isLessThan: filter.value)
            case .isGreaterThan: query = query.whereField(filter.field, isGreaterThan: filter.value)
            case .arrayContains: query = query.whereField(filter.field, arrayContains: filter.value)
            }
        }
        if let order = orderBy {
            query = query.order(by: order.field, descending: order.descending)
        }
        return query.addSnapshotListener { snapshot, _ in
            let values = snapshot?.documents.compactMap { try? $0.data(as: type) } ?? []
            Task { @MainActor in onChange(values) }
        }
    }

    // MARK: - Add (auto-ID)
    @discardableResult
    func add<T: Encodable>(_ value: T, collection: String) async throws -> String {
        let ref = try db.collection(collection).addDocument(from: value)
        return ref.documentID
    }
}

// MARK: - User-specific convenience methods
extension FirestoreService {
    func saveUser(_ user: OngoUser) async throws {
        guard let id = user.id else { return }
        try await merge(user, collection: OngoUser.collectionPath, documentId: id)
    }

    func getUser(id: String) async throws -> OngoUser {
        try await get(OngoUser.self, collection: OngoUser.collectionPath, documentId: id)
    }

    func updateSurveyProgress(_ progress: OngoUser.SurveyProgress, userId: String) async throws {
        let ref = db.collection(OngoUser.collectionPath).document(userId)
        let encoded = try Firestore.Encoder().encode(progress)
        try await ref.updateData(["surveyProgress": encoded])
    }

    func updateFCMToken(_ token: String, userId: String) async throws {
        let ref = db.collection(OngoUser.collectionPath).document(userId)
        try await ref.updateData(["fcmToken": token])
    }

    func updateUserPlanTier(_ tier: String, userId: String) async throws {
        let ref = db.collection(OngoUser.collectionPath).document(userId)
        try await ref.updateData(["planTier": tier])
    }
}

// MARK: - Config (ATF messages + medications) with local cache
extension FirestoreService {
    @MainActor private static var atfMessagesCache: [SmartATFMessage] = []
    @MainActor private static var atfCacheExpiry: Date = .distantPast
    private static let cacheTTL: TimeInterval = 3600  // 1 hour

    @MainActor func fetchATFMessages(locale: String = "en") async throws -> [SmartATFMessage] {
        if Date() < Self.atfCacheExpiry && !Self.atfMessagesCache.isEmpty {
            return Self.atfMessagesCache.filter { $0.locale == locale }
        }
        let messages = try await query(
            SmartATFMessage.self,
            collection: SmartATFMessage.collectionPath,
            filters: [("active", .isEqualTo, true)]
        )
        Self.atfMessagesCache = messages
        Self.atfCacheExpiry = Date().addingTimeInterval(Self.cacheTTL)
        return messages.filter { $0.locale == locale }
    }

    @MainActor private static var medicationsCache: [MedicationConfig] = []
    @MainActor private static var medsCacheExpiry: Date = .distantPast

    @MainActor func fetchMedications() async throws -> [MedicationConfig] {
        if Date() < Self.medsCacheExpiry && !Self.medicationsCache.isEmpty {
            return Self.medicationsCache
        }
        let meds = try await query(
            MedicationConfig.self,
            collection: MedicationConfig.collectionPath,
            filters: [("active", .isEqualTo, true)]
        )
        Self.medicationsCache = meds
        Self.medsCacheExpiry = Date().addingTimeInterval(Self.cacheTTL)
        return meds
    }
}
