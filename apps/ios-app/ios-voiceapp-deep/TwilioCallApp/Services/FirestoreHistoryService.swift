//
//  FirestoreHistoryService.swift
//  TwilioCallApp
//

import FirebaseAuth
import FirebaseFirestore
import Foundation

/// Persists call history, SMS log, contacts, Twilio line snapshot, and non-secret settings under
/// `users/{stable-key-or-uid}/…` so history can survive app rebuild/reinstall.
/// Does **not** store messaging bearer tokens or other secrets.
enum FirestoreHistoryService {
    private actor AuthGate {
        private var inFlight: Task<String, Error>?

        func resolveUID() async throws -> String {
            if let existing = inFlight {
                return try await existing.value
            }
            let task = Task<String, Error> {
                try await FirebaseAuthModeStore.ensureSignedInForSelectedMode()
            }
            inFlight = task
            defer { inFlight = nil }
            return try await task.value
        }
    }

    private static let authGate = AuthGate()

    struct ContactDiagnosticsSnapshot: Sendable {
        struct NamespaceCount: Identifiable, Sendable {
            var id: String { namespace }
            let namespace: String
            let count: Int
            let error: String?
        }
        let activeNamespace: String
        let namespaceCounts: [NamespaceCount]
        let lastWriteStatus: String
        let lastWriteAt: Date?
        let lastReadStatus: String
        let lastReadAt: Date?
    }

    private actor ContactDiagnosticsState {
        private(set) var lastWriteStatus: String = "No write attempt yet"
        private(set) var lastWriteAt: Date?
        private(set) var lastReadStatus: String = "No read attempt yet"
        private(set) var lastReadAt: Date?

        func markWrite(status: String) {
            lastWriteStatus = status
            lastWriteAt = Date()
        }

        func markRead(status: String) {
            lastReadStatus = status
            lastReadAt = Date()
        }

        func snapshot() -> (String, Date?, String, Date?) {
            (lastWriteStatus, lastWriteAt, lastReadStatus, lastReadAt)
        }
    }

    private static let diagnosticsState = ContactDiagnosticsState()

    private static var db: Firestore? {
        guard FirebaseBootstrap.isConfigured else { return nil }
        return Firestore.firestore()
    }
    private enum StableKeys {
        static let voiceIdentity = "voice_client_identity"
        static let messagingLine = "messaging_twilio_line_e164"
        static let migrationDonePrefix = "firestore_history_migrated_to_"
    }

    // MARK: - Auth

    static func ensureSignedIn() async throws -> String {
        try await authGate.resolveUID()
    }

    /// Firestore namespace key that survives app rebuild/reinstall better than anonymous auth UID.
    /// Prefer Firebase project id, then backend host, then Voice identity, then Twilio SMS line, then fallback UID.
    private static func storageUserKey() -> String? {
        if let projectID = FirebaseBootstrap.projectID, !projectID.isEmpty {
            return "project_\(sanitizeDocId(projectID.lowercased()))"
        }
        // Use bundled/override token URL host as the primary namespace.
        let tokenURL = VoiceConfiguration.effectiveTokenURLFromStorage()
        if let host = URL(string: tokenURL)?.host, !host.isEmpty {
            return "host_\(sanitizeDocId(host.lowercased()))"
        }
        let defaults = UserDefaults.standard
        let identity = (defaults.string(forKey: StableKeys.voiceIdentity) ?? "")
            .trimmingCharacters(in: .whitespacesAndNewlines)
        if !identity.isEmpty {
            return "voice_\(sanitizeDocId(identity.lowercased()))"
        }
        let line = (defaults.string(forKey: StableKeys.messagingLine) ?? "")
            .trimmingCharacters(in: .whitespacesAndNewlines)
        if !line.isEmpty {
            return "line_\(sanitizeDocId(line))"
        }
        let uid = Auth.auth().currentUser?.uid.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        return uid.isEmpty ? nil : sanitizeDocId(uid)
    }

    private static func userRootRef(_ db: Firestore) async throws -> DocumentReference {
        _ = try await ensureSignedIn()
        let uid = sanitizeDocId(Auth.auth().currentUser?.uid ?? "anonymous")
        let key = storageUserKey() ?? uid
        // Best-effort migration from all known legacy namespaces into the current namespace key.
        for source in candidateNamespaceKeys(currentUID: uid) where source != key {
            await migrateLegacyUIDDataIfNeeded(db: db, fromUIDKey: source, toStableKey: key)
        }
        return db.collection("users").document(key)
    }

    private static func candidateNamespaceKeys(currentUID: String) -> [String] {
        var keys = Set<String>()
        keys.insert(currentUID)
        if let projectID = FirebaseBootstrap.projectID, !projectID.isEmpty {
            keys.insert("project_\(sanitizeDocId(projectID.lowercased()))")
        }
        let tokenCandidates = [
            VoiceConfiguration.effectiveTokenURLFromStorage(),
            VoiceConfiguration.bundledTokenURL
        ]
        for tokenURL in tokenCandidates {
            if let host = URL(string: tokenURL)?.host, !host.isEmpty {
                keys.insert("host_\(sanitizeDocId(host.lowercased()))")
            }
        }
        let defaults = UserDefaults.standard
        let identity = (defaults.string(forKey: StableKeys.voiceIdentity) ?? "")
            .trimmingCharacters(in: .whitespacesAndNewlines)
        if !identity.isEmpty {
            keys.insert("voice_\(sanitizeDocId(identity.lowercased()))")
        }
        let line = (defaults.string(forKey: StableKeys.messagingLine) ?? "")
            .trimmingCharacters(in: .whitespacesAndNewlines)
        if !line.isEmpty {
            keys.insert("line_\(sanitizeDocId(line))")
        }
        return Array(keys)
    }

    /// One-time best-effort migration: copies data from legacy `users/{anonymous-uid}` into
    /// the newer stable namespace `users/{voice_*|line_*}`. Safe to run repeatedly.
    private static func migrateLegacyUIDDataIfNeeded(
        db: Firestore,
        fromUIDKey: String,
        toStableKey: String
    ) async {
        guard !fromUIDKey.isEmpty, !toStableKey.isEmpty, fromUIDKey != toStableKey else { return }
        let doneKey = StableKeys.migrationDonePrefix + sanitizeDocId(fromUIDKey) + "__to__" + sanitizeDocId(toStableKey)
        if UserDefaults.standard.bool(forKey: doneKey) { return }

        let fromRoot = db.collection("users").document(fromUIDKey)
        let toRoot = db.collection("users").document(toStableKey)
        do {
            try await copyCollection(db: db, from: fromRoot.collection("calls"), to: toRoot.collection("calls"))
            try await copyCollection(db: db, from: fromRoot.collection("sms_messages"), to: toRoot.collection("sms_messages"))
            try await copyCollection(db: db, from: fromRoot.collection("contacts"), to: toRoot.collection("contacts"))
            try await copySyncDocument(from: fromRoot.collection("sync").document("preferences"), to: toRoot.collection("sync").document("preferences"))
            try await copySyncDocument(from: fromRoot.collection("sync").document("twilio_lines"), to: toRoot.collection("sync").document("twilio_lines"))
            UserDefaults.standard.set(true, forKey: doneKey)
            #if DEBUG
            print("Firestore history migration complete: \(fromUIDKey) -> \(toStableKey)")
            #endif
        } catch {
            #if DEBUG
            print("Firestore migration error (\(fromUIDKey) -> \(toStableKey)): \(error.localizedDescription)")
            #endif
        }
    }

    private static func copyCollection(
        db: Firestore,
        from: CollectionReference,
        to: CollectionReference
    ) async throws {
        let snap = try await from.limit(to: 10_000).getDocuments()
        guard !snap.documents.isEmpty else { return }
        var index = 0
        while index < snap.documents.count {
            let end = min(index + 400, snap.documents.count)
            let batch = db.batch()
            for doc in snap.documents[index..<end] {
                batch.setData(doc.data(), forDocument: to.document(doc.documentID), merge: true)
            }
            try await batch.commit()
            index = end
        }
    }

    private static func copySyncDocument(from: DocumentReference, to: DocumentReference) async throws {
        let snap = try await from.getDocument()
        guard snap.exists, let data = snap.data(), !data.isEmpty else { return }
        try await to.setData(data, merge: true)
    }

    // MARK: - Calls

    static func saveCallRecord(_ record: CallRecord) async {
        guard let db, FirebaseBootstrap.isConfigured else { return }
        do {
            let docId = callDocumentId(record)
            let root = try await userRootRef(db)
            let path = root.collection("calls").document(docId)
            try await path.setData(callPayload(record))
        } catch {
            #if DEBUG
            print("Firestore saveCallRecord error: \(error.localizedDescription)")
            #endif
        }
    }

    static func fetchCallRecords(limit: Int = 5_000) async -> [CallRecord] {
        guard let db, FirebaseBootstrap.isConfigured else { return [] }
        do {
            let root = try await userRootRef(db)
            let snap = try await root.collection("calls")
                .order(by: "timestamp", descending: true)
                .limit(to: limit)
                .getDocuments()
            return snap.documents.compactMap { decodeCall($0.data()) }
        } catch {
            #if DEBUG
            print("Firestore fetchCallRecords error: \(error.localizedDescription)")
            #endif
            return []
        }
    }

    /// Listens for call history changes so other signed-in devices see missed/answered rows in near real time.
    static func addCallRecordsListener(
        limit: Int = 5_000,
        onUpdate: @escaping ([CallRecord]) -> Void
    ) async -> ListenerRegistration? {
        guard let db, FirebaseBootstrap.isConfigured else { return nil }
        do {
            let root = try await userRootRef(db)
            let q = root.collection("calls")
                .order(by: "timestamp", descending: true)
                .limit(to: max(1, min(limit, 10_000)))
            return q.addSnapshotListener { snapshot, error in
                if error != nil { return }
                guard let snapshot else { return }
                let rows = snapshot.documents.compactMap { decodeCall($0.data()) }
                DispatchQueue.main.async {
                    onUpdate(rows)
                }
            }
        } catch {
            #if DEBUG
            print("Firestore addCallRecordsListener error: \(error.localizedDescription)")
            #endif
            return nil
        }
    }

    private static func callDocumentId(_ r: CallRecord) -> String {
        if let s = r.twilioCallSid?.trimmingCharacters(in: .whitespacesAndNewlines), !s.isEmpty {
            return sanitizeDocId(s)
        }
        return r.id.uuidString
    }

    private static func callPayload(_ r: CallRecord) -> [String: Any] {
        var m: [String: Any] = [
            "id": r.id.uuidString,
            "contactId": r.contactId?.uuidString ?? NSNull(),
            "displayName": r.displayName,
            "rawNumber": r.rawNumber,
            "direction": r.direction == .incoming ? "incoming" : "outgoing",
            "outcome": outcomeString(r.outcome),
            "durationSeconds": r.durationSeconds,
            "timestamp": Timestamp(date: r.timestamp),
            "businessId": r.businessId.uuidString,
        ]
        if let s = r.twilioCallSid?.trimmingCharacters(in: .whitespacesAndNewlines), !s.isEmpty {
            m["twilioCallSid"] = s
        }
        return m
    }

    private static func outcomeString(_ o: CallRecord.Outcome) -> String {
        switch o {
        case .answered: return "answered"
        case .missed: return "missed"
        case .declined: return "declined"
        }
    }

    private static func decodeCall(_ data: [String: Any]) -> CallRecord? {
        guard let idStr = data["id"] as? String, let id = UUID(uuidString: idStr),
              let displayName = data["displayName"] as? String,
              let rawNumber = data["rawNumber"] as? String,
              let dirStr = data["direction"] as? String,
              let outStr = data["outcome"] as? String,
              let businessStr = data["businessId"] as? String, let businessId = UUID(uuidString: businessStr)
        else { return nil }
        let contactId = (data["contactId"] as? String).flatMap { UUID(uuidString: $0) }
        let rawSid = (data["twilioCallSid"] as? String)?
            .trimmingCharacters(in: .whitespacesAndNewlines)
        let twilioCallSid = rawSid.flatMap { $0.isEmpty ? nil : $0 }
        let duration = data["durationSeconds"] as? Int ?? 0
        let ts = (data["timestamp"] as? Timestamp)?.dateValue() ?? Date()
        let direction: CallRecord.Direction = dirStr == "incoming" ? .incoming : .outgoing
        let outcome: CallRecord.Outcome
        switch outStr {
        case "answered": outcome = .answered
        case "declined": outcome = .declined
        default: outcome = .missed
        }
        return CallRecord(
            id: id,
            twilioCallSid: twilioCallSid,
            contactId: contactId,
            displayName: displayName,
            rawNumber: rawNumber,
            direction: direction,
            outcome: outcome,
            durationSeconds: duration,
            timestamp: ts,
            businessId: businessId
        )
    }

    // MARK: - SMS rows (flat log; app merges into conversations)

    static func saveSMSRows(_ rows: [MessagingAPIClient.LogRow]) async {
        guard let db, FirebaseBootstrap.isConfigured, !rows.isEmpty else { return }
        let chunkSize = 400
        do {
            let root = try await userRootRef(db)
            let base = root.collection("sms_messages")
            var i = rows.startIndex
            while i < rows.endIndex {
                let j = rows.index(i, offsetBy: chunkSize, limitedBy: rows.endIndex) ?? rows.endIndex
                let batch = db.batch()
                for r in rows[i..<j] {
                    let docId = sanitizeDocId(r.id)
                    let ref = base.document(docId)
                    batch.setData([
                        "id": r.id,
                        "from": r.from,
                        "to": r.to,
                        "body": r.body,
                        "direction": r.direction,
                        "at": Timestamp(date: r.atDate),
                    ], forDocument: ref, merge: true)
                }
                try await batch.commit()
                i = j
            }
        } catch {
            #if DEBUG
            print("Firestore saveSMSRows error: \(error.localizedDescription)")
            #endif
        }
    }

    /// Most recent `limit` messages (newest first in the query, then reversed for chronological merge).
    static func fetchSMSRows(limit: Int = 10_000) async -> [MessagingAPIClient.LogRow] {
        guard let db, FirebaseBootstrap.isConfigured else { return [] }
        do {
            let root = try await userRootRef(db)
            let snap = try await root.collection("sms_messages")
                .order(by: "at", descending: true)
                .limit(to: limit)
                .getDocuments()
            let rows = snap.documents.compactMap { d -> MessagingAPIClient.LogRow? in
                let m = d.data()
                guard let id = m["id"] as? String,
                      let from = m["from"] as? String,
                      let to = m["to"] as? String,
                      let body = m["body"] as? String,
                      let direction = m["direction"] as? String,
                      let atTs = m["at"] as? Timestamp
                else { return nil }
                let iso = ISO8601DateFormatter().string(from: atTs.dateValue())
                return MessagingAPIClient.LogRow(
                    id: id,
                    from: from,
                    to: to,
                    body: body,
                    direction: direction,
                    at: iso
                )
            }
            return rows.reversed()
        } catch {
            #if DEBUG
            print("Firestore fetchSMSRows error: \(error.localizedDescription)")
            #endif
            return []
        }
    }

    // MARK: - Preferences (non-secret)

    static func saveUserPreferences(
        outboundBusinessId: UUID?,
        messagingTwilioLineE164: String,
        voiceClientIdentity: String,
        voiceTokenURLOverride: String,
        selectedBusinessFilter: UUID?
    ) async {
        guard let db, FirebaseBootstrap.isConfigured else { return }
        do {
            let root = try await userRootRef(db)
            let ref = root.collection("sync").document("preferences")
            try await ref.setData([
                "outboundBusinessId": outboundBusinessId?.uuidString ?? NSNull(),
                "messagingTwilioLineE164": messagingTwilioLineE164,
                "voiceClientIdentity": voiceClientIdentity,
                "voiceTokenURLOverride": voiceTokenURLOverride,
                "selectedBusinessFilter": selectedBusinessFilter?.uuidString ?? NSNull(),
                "updatedAt": FieldValue.serverTimestamp(),
            ], merge: true)
        } catch {
            #if DEBUG
            print("Firestore saveUserPreferences error: \(error.localizedDescription)")
            #endif
        }
    }

    static func fetchUserPreferences() async -> (
        outboundBusinessId: UUID?,
        messagingTwilioLineE164: String?,
        voiceClientIdentity: String?,
        voiceTokenURLOverride: String?,
        selectedBusinessFilter: UUID?
    )? {
        guard let db, FirebaseBootstrap.isConfigured else { return nil }
        do {
            let root = try await userRootRef(db)
            let snap = try await root.collection("sync").document("preferences").getDocument()
            guard snap.exists, let m = snap.data() else { return nil }
            let ob = (m["outboundBusinessId"] as? String).flatMap { UUID(uuidString: $0) }
            let line = m["messagingTwilioLineE164"] as? String
            let voiceId = m["voiceClientIdentity"] as? String
            let tokenUrl = m["voiceTokenURLOverride"] as? String
            let filt = (m["selectedBusinessFilter"] as? String).flatMap { UUID(uuidString: $0) }
            return (ob, line, voiceId, tokenUrl, filt)
        } catch {
            #if DEBUG
            print("Firestore fetchUserPreferences error: \(error.localizedDescription)")
            #endif
            return nil
        }
    }

    // MARK: - Contacts

    static func saveContacts(_ contacts: [Contact]) async {
        guard let db, FirebaseBootstrap.isConfigured, !contacts.isEmpty else { return }
        let chunkSize = 400
        do {
            _ = try await userRootRef(db)
            let uid = sanitizeDocId(Auth.auth().currentUser?.uid ?? "anonymous")
            let targetKeys = Set(candidateNamespaceKeys(currentUID: uid) + [storageUserKey() ?? uid])
            var succeededKeys: [String] = []
            var failedKeys: [String] = []
            for key in targetKeys {
                let base = db.collection("users").document(key).collection("contacts")
                do {
                    var i = contacts.startIndex
                    while i < contacts.endIndex {
                        let j = contacts.index(i, offsetBy: chunkSize, limitedBy: contacts.endIndex) ?? contacts.endIndex
                        let batch = db.batch()
                        for c in contacts[i..<j] {
                            let ref = base.document(c.id.uuidString)
                            let phones: [[String: String]] = c.phoneNumbers.map {
                                ["kind": $0.kind.rawValue, "number": $0.number]
                            }
                            batch.setData([
                                "id": c.id.uuidString,
                                "name": c.name,
                                "email": c.email ?? NSNull(),
                                "company": c.company ?? NSNull(),
                                "gradientIndex": c.gradientIndex,
                                "phones": phones,
                                "updatedAt": FieldValue.serverTimestamp(),
                            ], forDocument: ref, merge: true)
                        }
                        try await batch.commit()
                        i = j
                    }
                    succeededKeys.append(key)
                } catch {
                    failedKeys.append("\(key): \(error.localizedDescription)")
                }
            }
            let status: String
            if failedKeys.isEmpty {
                status = "OK (\(contacts.count) contacts) -> \(succeededKeys.count) namespaces"
            } else {
                status = "Partial write: ok=\(succeededKeys.count), failed=\(failedKeys.count) | \(failedKeys.joined(separator: " | "))"
            }
            await diagnosticsState.markWrite(status: status)
        } catch {
            await diagnosticsState.markWrite(status: "Write failed: \(error.localizedDescription)")
            #if DEBUG
            print("Firestore saveContacts error: \(error.localizedDescription)")
            #endif
        }
    }

    static func fetchContacts(limit: Int = 2_000) async -> [Contact] {
        guard let db, FirebaseBootstrap.isConfigured else { return [] }
        do {
            let root = try await userRootRef(db)
            let uid = sanitizeDocId(Auth.auth().currentUser?.uid ?? "anonymous")
            let keys = Set(candidateNamespaceKeys(currentUID: uid) + [root.documentID])
            var byId: [UUID: Contact] = [:]
            for key in keys {
                let ref = db.collection("users").document(key)
                do {
                    let snap = try await ref.collection("contacts").limit(to: limit).getDocuments()
                    for doc in snap.documents {
                        if let contact = decodeContact(doc.data()) {
                            byId[contact.id] = contact
                        }
                    }
                } catch {
                    #if DEBUG
                    print("Firestore fetchContacts namespace error (\(key)): \(error.localizedDescription)")
                    #endif
                }
            }
            await diagnosticsState.markRead(status: "OK fetched \(byId.count) merged contacts across \(keys.count) namespaces")
            return Array(byId.values).sorted {
                $0.name.localizedCaseInsensitiveCompare($1.name) == .orderedAscending
            }
        } catch {
            await diagnosticsState.markRead(status: "Read failed: \(error.localizedDescription)")
            #if DEBUG
            print("Firestore fetchContacts error: \(error.localizedDescription)")
            #endif
            return []
        }
    }

    static func fetchContactDiagnostics(limit: Int = 2_000) async -> ContactDiagnosticsSnapshot? {
        guard let db, FirebaseBootstrap.isConfigured else { return nil }
        do {
            _ = try await ensureSignedIn()
            let uid = sanitizeDocId(Auth.auth().currentUser?.uid ?? "anonymous")
            let active = storageUserKey() ?? uid
            let keys = Array(Set(candidateNamespaceKeys(currentUID: uid) + [active])).sorted()
            var counts: [ContactDiagnosticsSnapshot.NamespaceCount] = []
            for key in keys {
                do {
                    let snap = try await db.collection("users").document(key)
                        .collection("contacts")
                        .limit(to: limit)
                        .getDocuments()
                    counts.append(.init(namespace: key, count: snap.documents.count, error: nil))
                } catch {
                    counts.append(.init(namespace: key, count: 0, error: error.localizedDescription))
                }
            }
            let d = await diagnosticsState.snapshot()
            return ContactDiagnosticsSnapshot(
                activeNamespace: active,
                namespaceCounts: counts,
                lastWriteStatus: d.0,
                lastWriteAt: d.1,
                lastReadStatus: d.2,
                lastReadAt: d.3
            )
        } catch {
            let d = await diagnosticsState.snapshot()
            return ContactDiagnosticsSnapshot(
                activeNamespace: "unresolved",
                namespaceCounts: [],
                lastWriteStatus: d.0,
                lastWriteAt: d.1,
                lastReadStatus: "Diagnostics failed: \(error.localizedDescription)",
                lastReadAt: Date()
            )
        }
    }

    private static func decodeContact(_ m: [String: Any]) -> Contact? {
        guard let idStr = m["id"] as? String, let id = UUID(uuidString: idStr),
              let name = m["name"] as? String else { return nil }
        let email = m["email"] as? String
        let company = m["company"] as? String
        let gradientIndex = m["gradientIndex"] as? Int ?? 0
        let phoneArr = m["phones"] as? [[String: Any]] ?? []
        let phones: [PhoneEntry] = phoneArr.compactMap { p in
            guard let kindStr = p["kind"] as? String, let kind = PhoneEntry.Kind(rawValue: kindStr),
                  let number = p["number"] as? String else { return nil }
            return PhoneEntry(kind: kind, number: number)
        }
        return Contact(id: id, name: name, phoneNumbers: phones, email: email, company: company, gradientIndex: gradientIndex)
    }

    // MARK: - Twilio lines snapshot

    static func saveTwilioLinesSnapshot(_ numbers: [TwilioIncomingNumber]) async {
        guard let db, FirebaseBootstrap.isConfigured, !numbers.isEmpty else { return }
        do {
            let root = try await userRootRef(db)
            let ref = root.collection("sync").document("twilio_lines")
            let payload: [[String: Any]] = numbers.map {
                [
                    "id": $0.id,
                    "phoneNumber": $0.phoneNumber,
                    "friendlyName": $0.friendlyName ?? NSNull(),
                    "voice": $0.voice,
                    "sms": $0.sms,
                    "mms": $0.mms,
                ]
            }
            try await ref.setData([
                "numbers": payload,
                "updatedAt": FieldValue.serverTimestamp(),
            ], merge: false)
        } catch {
            #if DEBUG
            print("Firestore saveTwilioLinesSnapshot error: \(error.localizedDescription)")
            #endif
        }
    }

    static func fetchTwilioLinesSnapshot() async -> [TwilioIncomingNumber] {
        guard let db, FirebaseBootstrap.isConfigured else { return [] }
        do {
            let root = try await userRootRef(db)
            let snap = try await root.collection("sync").document("twilio_lines").getDocument()
            guard snap.exists, let m = snap.data(), let rows = m["numbers"] as? [[String: Any]] else { return [] }
            return rows.compactMap { r in
                guard let id = r["id"] as? String,
                      let phoneNumber = r["phoneNumber"] as? String else { return nil }
                let fn = r["friendlyName"] as? String
                let voice = r["voice"] as? Bool ?? false
                let sms = r["sms"] as? Bool ?? false
                let mms = r["mms"] as? Bool ?? false
                return TwilioIncomingNumber(id: id, phoneNumber: phoneNumber, friendlyName: fn, voice: voice, sms: sms, mms: mms)
            }
        } catch {
            #if DEBUG
            print("Firestore fetchTwilioLinesSnapshot error: \(error.localizedDescription)")
            #endif
            return []
        }
    }

    /// Firestore document IDs cannot contain `/`.
    private static func sanitizeDocId(_ raw: String) -> String {
        raw.replacingOccurrences(of: "/", with: "_")
    }
}
