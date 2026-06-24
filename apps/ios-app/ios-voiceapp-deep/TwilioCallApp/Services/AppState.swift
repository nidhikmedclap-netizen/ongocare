//
//  AppState.swift
//  TwilioCallApp
//
//  Single observable source of truth for the app. Wraps a TwilioService
//  protocol so v1 runs against `MockTwilioService` and the same UI plugs
//  into a real Twilio-backed implementation later without changes.
//

import FirebaseFirestore
import FirebaseAuth
import Foundation
import Observation
import OSLog

// MARK: - Service protocol

protocol TwilioServicing {
    func loadBusinesses() async -> [Business]
    func loadContacts() async -> [Contact]
    func loadCalls() async -> [CallRecord]
    func loadConversations() async -> [Conversation]

    func placeCall(to number: String, from business: Business) async
    func sendMessage(to number: String, body: String, from business: Business) async -> Message
}

// MARK: - Observable state

@Observable
final class AppState {
    private static let voiceIncomingLog = Logger(subsystem: Bundle.main.bundleIdentifier ?? "TwilioCallApp", category: "VoiceIncoming")

    // Data
    var businesses: [Business] = []
    var contacts: [Contact] = []
    var calls: [CallRecord] = []
    var conversations: [Conversation] = []
    /// Recording rows from `GET /api/voicemails` (local voicemail log + Twilio recordings when the server merges them).
    var voicemails: [VoicemailItem] = []
    var lastVoicemailError: String?

    // Filters
    /// nil = "All Businesses". Otherwise filter the active list to one business.
    var selectedBusinessFilter: UUID?

    // UI state for outbound calling
    var dialedNumber: String = ""
    /// Which line caller-ID will be set to when dialing. Defaults to first business.
    var outboundBusinessId: UUID?

    // In-call & incoming presentation
    var activeCall: CallContext?
    var incomingCall: CallContext?

    // Connection
    var twilioConnected: Bool = false
    var twilioAccountSidMasked: String = "AC••••a8f2"
    /// Shown when Voice SDK fails (token, connect, etc.).
    var lastVoiceError: String?
    /// Shown when SMS API fails (optional alert in Messages).
    var lastMessagingError: String?
    /// Last `GET /api/twilio/phone-numbers` result (Settings → Sync numbers).
    var twilioFetchedNumbers: [TwilioIncomingNumber] = []
    var lastTwilioNumbersError: String?
    var twilioNumbersSyncInProgress: Bool = false

    private var firestoreCallsListener: ListenerRegistration?

    /// Optional QA override; leave empty to use the production URL from Info.plist (Release) or dev defaults.
    var voiceTokenURLOverride: String = ""

    /// Same host as the voice token URL, for `/api/sms/send` and `/api/sms/inbound` (no `/token` path).
    var apiBaseURL: String? {
        let u = effectiveVoiceAccessTokenURL.trimmingCharacters(in: .whitespacesAndNewlines)
        guard let url = URL(string: u), let host = url.host, let scheme = url.scheme else { return nil }
        if let port = url.port {
            return "\(scheme)://\(host):\(port)"
        }
        return "\(scheme)://\(host)"
    }

    /// Optional `Authorization: Bearer …` for the Node backend when `APP_BEARER_TOKEN` is set server-side.
    var messagingBearerToken: String = "" {
        didSet { UserDefaults.standard.set(messagingBearerToken, forKey: Keys.messagingBearer) }
    }

    /// Real Twilio SMS-enabled number (E.164). Use when seed `Business.twilioNumber` values are placeholders; maps log rows to `outboundBusiness` and is used as `from` when sending.
    var messagingTwilioLineE164: String = "" {
        didSet { UserDefaults.standard.set(messagingTwilioLineE164, forKey: Keys.messagingTwilioLine) }
    }

    /// Resolved endpoint used for token fetch (override → bundled VoiceTokenURL → DEBUG fallbacks).
    var effectiveVoiceAccessTokenURL: String {
        VoiceConfiguration.effectiveTokenURL(override: voiceTokenURLOverride)
    }

    /// Twilio client identity (alphanumeric + underscore). Passed as `?identity=` to the token URL.
    var voiceClientIdentity: String {
        didSet { UserDefaults.standard.set(voiceClientIdentity, forKey: Keys.voiceIdentity) }
    }

    private let service: TwilioServicing
    let voiceBridge: TwilioVoiceBridge

    /// Snapshot for call history when the UI dismisses before the SDK delegate runs.
    private var outboundVoiceLogContext: CallContext?
    private var outboundVoiceLogRecorded = false
    /// Avoid hanging up again when we clear `activeCall` programmatically after SDK disconnect.
    private var programmaticActiveCallDismiss = false

    init(service: TwilioServicing, voiceBridge: TwilioVoiceBridge = TwilioVoiceBridge()) {
        self.service = service
        self.voiceBridge = voiceBridge
        Self.migrateLegacyVoiceTokenURLIfNeeded()
        self.voiceTokenURLOverride = UserDefaults.standard.string(forKey: Keys.voiceTokenURLOverride) ?? ""
        if let cached = UserDefaults.standard.string(forKey: Keys.voiceIdentity),
           !cached.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            self.voiceClientIdentity = cached
        } else {
            self.voiceClientIdentity = ""
        }
        self.messagingBearerToken = UserDefaults.standard.string(forKey: Keys.messagingBearer) ?? ""
        self.messagingTwilioLineE164 = UserDefaults.standard.string(forKey: Keys.messagingTwilioLine) ?? ""
        self.voiceBridge.owner = self
        VoicePushCoordinator.shared.bindAppState(self)
        VoiceCallKitCoordinator.shared.bind(appState: self, voiceBridge: voiceBridge)
    }

    deinit {
        firestoreCallsListener?.remove()
    }

    private enum Keys {
        static let voiceTokenURLOverride = "voice_token_url_override"
        static let legacyVoiceTokenURL = "voice_access_token_url"
        static let voiceIdentity = "voice_client_identity"
        static let messagingBearer = "messaging_bearer_token"
        static let messagingTwilioLine = "messaging_twilio_line_e164"
    }

    /// Firebase ID token for server API auth (when backend verifies Firebase auth instead of static bearer).
    private func firebaseIDTokenForAPI() async -> String? {
        guard FirebaseBootstrap.isConfigured, let user = Auth.auth().currentUser else { return nil }
        return try? await user.getIDToken(forcingRefresh: false)
    }

    /// Persists only when non-empty; clearing removes the override so all installs use the bundled URL.
    func setVoiceTokenURLOverride(_ value: String) {
        let t = value.trimmingCharacters(in: .whitespacesAndNewlines)
        voiceTokenURLOverride = t
        if t.isEmpty {
            UserDefaults.standard.removeObject(forKey: Keys.voiceTokenURLOverride)
        } else {
            UserDefaults.standard.set(t, forKey: Keys.voiceTokenURLOverride)
        }
    }

    private static func migrateLegacyVoiceTokenURLIfNeeded() {
        guard UserDefaults.standard.object(forKey: Keys.voiceTokenURLOverride) == nil else { return }
        guard let legacy = UserDefaults.standard.string(forKey: Keys.legacyVoiceTokenURL),
              !legacy.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return }
        UserDefaults.standard.removeObject(forKey: Keys.legacyVoiceTokenURL)
        let trimmed = legacy.trimmingCharacters(in: .whitespacesAndNewlines)
        let autoSavedDevEndpoints: Set<String> = [
            "http://127.0.0.1:3001/token",
            "http://localhost:3001/token",
            "http://192.168.1.11:3001/token",
        ]
        guard !autoSavedDevEndpoints.contains(trimmed) else { return }
        UserDefaults.standard.set(trimmed, forKey: Keys.voiceTokenURLOverride)
    }

    // MARK: Loading

    func bootstrap() async {
        async let b = service.loadBusinesses()
        async let c = service.loadContacts()
        async let cs = service.loadCalls()
        async let cv = service.loadConversations()
        let (mockBusinesses, cs2, loadedCalls, convos) = await (b, c, cs, cv)
        // In real Firebase-backed app runs, avoid showing demo/mock contacts before sync.
        contacts = FirebaseBootstrap.hasConfigPlist ? [] : cs2

        // Refresh server Voice identity early so Firestore namespace key is stable
        // across rebuild/reinstall before we read synced history/preferences.
        await refreshVoiceClientFromServer()
        // Load prefs/contacts first so token URL override + filters are in place
        // before we resolve Twilio lines from Firestore/API.
        await mergeAuxiliaryDataFromFirestore()
        await restoreTwilioSnapshotFromFirestoreIfNeeded()
        await syncTwilioPhoneNumbersFromAPI()
        // If API fetch failed, try Firestore snapshot again with the latest resolved namespace.
        await restoreTwilioSnapshotFromFirestoreIfNeeded()

        await MainActor.run {
            if self.twilioFetchedNumbers.isEmpty {
                if let cached = TwilioNumbersCache.load() {
                    self.twilioFetchedNumbers = cached
                    self.applyTwilioNumbersAsBusinesses(cached)
                } else if FirebaseBootstrap.hasConfigPlist {
                    // Real Firebase app: never show demo businesses/calls; lines come from Twilio API, Firestore snapshot, cache, or Settings SMS number.
                    self.businesses = []
                    self.calls = []
                    self.conversations = []
                    self.outboundBusinessId = nil
                } else {
                    self.businesses = mockBusinesses
                    self.calls = loadedCalls.sorted(by: { $0.timestamp > $1.timestamp })
                    self.conversations = convos.sorted(by: { $0.lastMessageTimestamp > $1.lastMessageTimestamp })
                    self.outboundBusinessId = mockBusinesses.first?.id
                }
            } else {
                if self.outboundBusinessId.map({ ob in !self.businesses.contains(where: { $0.id == ob }) }) ?? true {
                    self.outboundBusinessId = self.businesses.first?.id
                }
            }
        }
        await MainActor.run {
            self.applySyntheticBusinessFromMessagingLineIfNeeded()
            self.clampBusinessSelectionToKnownLines()
        }
        await mergeCallHistoryFromFirestore()
        await startCallHistoryFirestoreListener()
        await refreshConversationsFromServer()
        await refreshVoicemails()
        await pushUserDataToFirestore()
        VoicePushCoordinator.shared.refreshRegistrationIfPossible()
    }

    /// Fetches `GET /api/voice-session` (or `GET /token` without identity) and stores the server-provided Voice client identity.
    private func refreshVoiceClientFromServer() async {
        let url = await MainActor.run { effectiveVoiceAccessTokenURL.trimmingCharacters(in: .whitespacesAndNewlines) }
        guard !url.isEmpty else { return }
        do {
            let creds = try await AccessTokenClient.fetchVoiceCredentials(fromTokenURLString: url)
            await MainActor.run { self.voiceClientIdentity = creds.identity }
        } catch {
            // Offline or misconfigured token URL — keep last cached identity if any.
        }
    }

    /// Loads preferences and merged contacts. Twilio lines are restored earlier via `restoreTwilioSnapshotFromFirestoreIfNeeded()`.
    private func mergeAuxiliaryDataFromFirestore() async {
        guard FirebaseBootstrap.isConfigured else { return }
        if let p = await FirestoreHistoryService.fetchUserPreferences() {
            await MainActor.run {
                if let line = p.messagingTwilioLineE164,
                   !line.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                    self.messagingTwilioLineE164 = line
                }
                if let v = p.voiceTokenURLOverride,
                   !v.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                    self.setVoiceTokenURLOverride(v)
                }
                if let ob = p.outboundBusinessId {
                    self.outboundBusinessId = ob
                }
                self.selectedBusinessFilter = p.selectedBusinessFilter
            }
        }
        let remoteContacts = await FirestoreHistoryService.fetchContacts()
        guard !remoteContacts.isEmpty else { return }
        await MainActor.run {
            var byId = Dictionary(uniqueKeysWithValues: self.contacts.map { ($0.id, $0) })
            for c in remoteContacts {
                byId[c.id] = c
            }
            self.contacts = Array(byId.values).sorted {
                $0.name.localizedCaseInsensitiveCompare($1.name) == .orderedAscending
            }
        }
    }

    private func restoreTwilioSnapshotFromFirestoreIfNeeded() async {
        guard FirebaseBootstrap.isConfigured else { return }
        let numsEmpty = await MainActor.run { self.twilioFetchedNumbers.isEmpty }
        guard numsEmpty else { return }
        let snap = await FirestoreHistoryService.fetchTwilioLinesSnapshot()
        guard !snap.isEmpty else { return }
        await MainActor.run {
            self.twilioFetchedNumbers = snap
            self.applyTwilioNumbersAsBusinesses(snap)
        }
    }

    private func applySyntheticBusinessFromMessagingLineIfNeeded() {
        guard businesses.isEmpty, FirebaseBootstrap.hasConfigPlist else { return }
        let line = messagingTwilioLineE164.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !line.isEmpty, let biz = Business.syntheticFromMessagingLineE164(line) else { return }
        businesses = [biz]
        if outboundBusinessId == nil {
            outboundBusinessId = biz.id
        }
    }

    private func clampBusinessSelectionToKnownLines() {
        if let ob = outboundBusinessId, !businesses.contains(where: { $0.id == ob }) {
            outboundBusinessId = businesses.first?.id
        }
        if let sf = selectedBusinessFilter, !businesses.contains(where: { $0.id == sf }) {
            selectedBusinessFilter = nil
        }
    }

    /// Writes non-secret preferences, contacts, and Twilio line snapshot for multi-device restore. Never stores the messaging bearer token.
    func pushUserDataToFirestore() async {
        guard FirebaseBootstrap.isConfigured else { return }
        let pack = await MainActor.run {
            (
                outboundBusinessId,
                messagingTwilioLineE164,
                voiceClientIdentity,
                voiceTokenURLOverride,
                selectedBusinessFilter,
                contacts,
                twilioFetchedNumbers
            )
        }
        await FirestoreHistoryService.saveUserPreferences(
            outboundBusinessId: pack.0,
            messagingTwilioLineE164: pack.1,
            voiceClientIdentity: pack.2,
            voiceTokenURLOverride: pack.3,
            selectedBusinessFilter: pack.4
        )
        await FirestoreHistoryService.saveContacts(pack.5)
        if !pack.6.isEmpty {
            await FirestoreHistoryService.saveTwilioLinesSnapshot(pack.6)
        }
    }

    /// Fetches active Twilio incoming numbers via the backend (`GET /api/twilio/phone-numbers`). Same bearer as messaging when `APP_BEARER_TOKEN` is set.
    func syncTwilioPhoneNumbersFromAPI() async {
        guard let base = apiBaseURL else {
            await MainActor.run { self.lastTwilioNumbersError = "No API base URL (check voice token host)." }
            return
        }
        let bearer = messagingBearerToken.trimmingCharacters(in: .whitespacesAndNewlines)
        let firebaseIDToken = await firebaseIDTokenForAPI()
        await MainActor.run {
            self.twilioNumbersSyncInProgress = true
            self.lastTwilioNumbersError = nil
        }
        do {
            let nums = try await TwilioPhoneNumbersClient.fetchIncomingPhoneNumbers(
                baseURL: base,
                bearer: bearer.isEmpty ? nil : bearer,
                firebaseIDToken: firebaseIDToken
            )
            await MainActor.run {
                self.twilioFetchedNumbers = nums
                self.twilioNumbersSyncInProgress = false
                self.lastTwilioNumbersError = nil
                if nums.isEmpty {
                    TwilioNumbersCache.clear()
                } else {
                    self.applyTwilioNumbersAsBusinesses(nums)
                }
            }
        } catch {
            await MainActor.run {
                self.lastTwilioNumbersError = error.localizedDescription
                self.twilioNumbersSyncInProgress = false
            }
        }
    }

    /// Replaces demo lines with Twilio account numbers. Clears mock call history and local threads; SMS threads reload from the server.
    private func applyTwilioNumbersAsBusinesses(_ nums: [TwilioIncomingNumber]) {
        TwilioNumbersCache.save(nums)
        businesses = Business.fromTwilioIncomingNumbers(nums)
        if let ob = outboundBusinessId, businesses.contains(where: { $0.id == ob }) {
            // keep selection
        } else {
            outboundBusinessId = businesses.first?.id
        }
        calls = []
        conversations = []
        Task {
            await FirestoreHistoryService.saveTwilioLinesSnapshot(nums)
            await self.refreshConversationsFromServer()
        }
    }

    /// Loads SMS from `GET /api/sms/inbound`, merges with Firestore, writes combined log back to Firestore.
    func refreshConversationsFromServer() async {
        guard let base = apiBaseURL else { return }
        let bearer = messagingBearerToken.trimmingCharacters(in: .whitespacesAndNewlines)
        let firebaseIDToken = await firebaseIDTokenForAPI()
        let lineOverride = messagingTwilioLineE164.trimmingCharacters(in: .whitespacesAndNewlines)
        let smsBizId = outboundBusinessId ?? businesses.first?.id

        let apiRows: [MessagingAPIClient.LogRow]
        var apiError: Error?
        do {
            apiRows = try await MessagingAPIClient.fetchMessages(
                baseURL: base,
                bearer: bearer.isEmpty ? nil : bearer,
                firebaseIDToken: firebaseIDToken
            )
        } catch {
            apiRows = []
            apiError = error
        }

        let fireRows = await FirestoreHistoryService.fetchSMSRows()
        let allRows = unionSMSLogRows(apiRows, fireRows)
        let directedRows = Self.applySMSDirectionInference(
            allRows,
            businesses: businesses,
            lineOverride: lineOverride.isEmpty ? nil : lineOverride
        )

        guard !directedRows.isEmpty else {
            await MainActor.run {
                if let apiError {
                    self.lastMessagingError = apiError.localizedDescription
                } else {
                    self.lastMessagingError = nil
                }
            }
            return
        }

        let merged = ConversationMerge.conversations(
            from: directedRows,
            businesses: businesses,
            contacts: contacts,
            smsLineE164Override: lineOverride.isEmpty ? nil : lineOverride,
            smsLineBusinessId: smsBizId
        )

        await MainActor.run {
            if merged.isEmpty {
                self.lastMessagingError =
                    "SMS history did not match any business line. In Settings, set “Twilio SMS number” to your number’s E.164, or sync Twilio lines on Businesses."
            } else {
                self.lastMessagingError = nil
                let withLocal = self.mergeRecentLocalOutboundIntoRefreshedConversations(
                    merged,
                    previous: self.conversations
                )
                self.conversations = withLocal.sorted(by: { $0.lastMessageTimestamp > $1.lastMessageTimestamp })
            }
        }

        await FirestoreHistoryService.saveSMSRows(directedRows)
    }

    /// Loads recordings list from `GET /api/voicemails` (same bearer as messaging when `APP_BEARER_TOKEN` is set).
    func refreshVoicemails() async {
        guard let base = apiBaseURL else {
            await MainActor.run {
                self.lastVoicemailError =
                    "No API base URL (voice token host). Set the token URL in Settings or use a build with VOICE_TOKEN_URL / bundled URL so voicemails can load."
            }
            return
        }
        let bearer = messagingBearerToken.trimmingCharacters(in: .whitespacesAndNewlines)
        let firebaseIDToken = await firebaseIDTokenForAPI()
        do {
            let list = try await VoicemailAPIClient.fetchVoicemails(
                baseURL: base,
                bearer: bearer.isEmpty ? nil : bearer,
                firebaseIDToken: firebaseIDToken
            )
            await MainActor.run {
                self.voicemails = list
                self.lastVoicemailError = nil
            }
        } catch {
            await MainActor.run {
                self.lastVoicemailError = error.localizedDescription
            }
        }
    }

    /// After `GET /api/sms/inbound`, some hosts omit outbound rows for a while. Without this, replacing `conversations` drops the optimistic bubble the user just saw as Sent.
    private func mergeRecentLocalOutboundIntoRefreshedConversations(
        _ incoming: [Conversation],
        previous: [Conversation]
    ) -> [Conversation] {
        let prevById = Dictionary(uniqueKeysWithValues: previous.map { ($0.id, $0) })
        let maxAge: TimeInterval = 900

        return incoming.map { conv in
            var out = conv
            guard let old = prevById[conv.id] else { return out }
            var combined = conv.messages
            let now = Date()
            for m in old.messages {
                guard m.direction == .outbound, m.status != .failed else { continue }
                guard now.timeIntervalSince(m.timestamp) < maxAge else { continue }
                guard !combined.contains(where: { Self.isNearDuplicateConversationBubble($0, m) }) else { continue }
                combined.append(m)
            }
            combined.sort(by: { $0.timestamp < $1.timestamp })
            out.messages = combined
            if let last = combined.max(by: { $0.timestamp < $1.timestamp }) {
                out.lastMessageTimestamp = last.timestamp
                out.lastMessagePreview = last.direction == .outbound ? "You: \(last.body)" : last.body
            }
            return out
        }
    }

    private static func isNearDuplicateConversationBubble(_ a: Message, _ b: Message) -> Bool {
        guard a.direction == b.direction else { return false }
        guard a.body == b.body else { return false }
        return abs(a.timestamp.timeIntervalSince(b.timestamp)) < 120
    }

    /// Twilio webhook payloads and some hosted logs omit `direction` or mis-label rows. When exactly one of From/To is your line, treat To=ours as inbound and From=ours as outbound.
    private static func applySMSDirectionInference(
        _ rows: [MessagingAPIClient.LogRow],
        businesses: [Business],
        lineOverride: String?
    ) -> [MessagingAPIClient.LogRow] {
        var ourLines = Set(businesses.map { PhoneNumberE164.normalize($0.twilioNumber) })
        if let o = lineOverride?.trimmingCharacters(in: .whitespacesAndNewlines), !o.isEmpty {
            ourLines.insert(PhoneNumberE164.normalize(o))
        }
        guard !ourLines.isEmpty else { return rows }
        return rows.map { r in
            let fromN = PhoneNumberE164.normalize(r.from)
            let toN = PhoneNumberE164.normalize(r.to)
            let toIsOurs = ourLines.contains(toN)
            let fromIsOurs = ourLines.contains(fromN)
            guard toIsOurs != fromIsOurs else { return r }
            let inferred = toIsOurs ? "inbound" : "outbound"
            if r.direction.caseInsensitiveCompare(inferred) != .orderedSame {
                return MessagingAPIClient.LogRow(
                    id: r.id,
                    from: r.from,
                    to: r.to,
                    body: r.body,
                    direction: inferred,
                    at: r.at
                )
            }
            return r
        }
    }

    private func unionSMSLogRows(_ a: [MessagingAPIClient.LogRow], _ b: [MessagingAPIClient.LogRow]) -> [MessagingAPIClient.LogRow] {
        let combined = (a + b).sorted(by: { $0.atDate < $1.atDate })
        var out: [MessagingAPIClient.LogRow] = []
        for r in combined {
            if let i = out.firstIndex(where: { Self.isNearDuplicateSMSLog($0, r) }) {
                if r.id.hasPrefix("local-"), !out[i].id.hasPrefix("local-") { continue }
                if !r.id.hasPrefix("local-"), out[i].id.hasPrefix("local-") {
                    out[i] = r
                }
                continue
            }
            out.append(r)
        }
        return out
    }

    /// Same message often appears once from the client (`local-…` id) and again from Twilio (`SM…`); keep a single row.
    private static func isNearDuplicateSMSLog(_ x: MessagingAPIClient.LogRow, _ y: MessagingAPIClient.LogRow) -> Bool {
        guard x.direction == y.direction else { return false }
        guard PhoneNumberE164.normalize(x.from) == PhoneNumberE164.normalize(y.from),
              PhoneNumberE164.normalize(x.to) == PhoneNumberE164.normalize(y.to),
              x.body == y.body else { return false }
        return abs(x.atDate.timeIntervalSince(y.atDate)) < 120
    }

    private func mergeCallHistoryFromFirestore() async {
        guard FirebaseBootstrap.isConfigured else { return }
        let remote = await FirestoreHistoryService.fetchCallRecords()
        guard !remote.isEmpty else { return }
        await MainActor.run {
            self.calls = Self.mergedCallHistory(local: self.calls, remote: remote)
        }
    }

    private func startCallHistoryFirestoreListener() async {
        guard FirebaseBootstrap.isConfigured else { return }
        await MainActor.run { self.firestoreCallsListener?.remove() }
        let reg = await FirestoreHistoryService.addCallRecordsListener { [weak self] remote in
            guard let self else { return }
            self.calls = Self.mergedCallHistory(local: self.calls, remote: remote)
        }
        await MainActor.run { self.firestoreCallsListener = reg }
    }

    private static func callMergeKey(_ r: CallRecord) -> String {
        if let s = r.twilioCallSid?.trimmingCharacters(in: .whitespacesAndNewlines), !s.isEmpty {
            return "t:\(s)"
        }
        return "u:\(r.id.uuidString)"
    }

    /// Unions local + remote rows; Twilio Call SIDs dedupe across devices.
    private static func mergedCallHistory(local: [CallRecord], remote: [CallRecord]) -> [CallRecord] {
        var map: [String: CallRecord] = [:]
        for r in local {
            map[callMergeKey(r)] = r
        }
        for r in remote {
            let k = callMergeKey(r)
            if let existing = map[k] {
                map[k] = preferRicherCallRecord(existing, r)
            } else {
                map[k] = r
            }
        }
        return map.values.sorted { $0.timestamp > $1.timestamp }
    }

    private static func preferRicherCallRecord(_ a: CallRecord, _ b: CallRecord) -> CallRecord {
        if a.outcome == .answered && b.outcome != .answered { return a }
        if b.outcome == .answered && a.outcome != .answered { return b }
        if a.outcome == .declined && b.outcome == .missed { return a }
        if b.outcome == .declined && a.outcome == .missed { return b }
        return a.timestamp >= b.timestamp ? a : b
    }

    /// Opens an existing thread or creates an empty one for composing (stable id matches server merge).
    func findOrCreateConversation(peerRawNumber: String, businessId: UUID) -> UUID? {
        let peer = PhoneNumberE164.normalize(peerRawNumber)
        guard peer.count >= 4 else { return nil }
        let id = ConversationMerge.stableConversationId(businessId: businessId, peerE164: peer)
        if let idx = conversations.firstIndex(where: { $0.id == id }) {
            return conversations[idx].id
        }
        let contactId = contacts.first { PhoneNumberE164.normalize($0.primaryNumber) == peer }?.id
        let display = contactId.flatMap { contact($0)?.name } ?? peer
        var list = conversations
        list.insert(
            Conversation(
                id: id,
                contactId: contactId,
                displayName: display,
                rawNumber: peer,
                businessId: businessId,
                lastMessagePreview: "New conversation",
                lastMessageTimestamp: Date(),
                messages: []
            ),
            at: 0
        )
        conversations = list
        return id
    }

    /// When non-nil, included in `POST /api/sms/send`; when nil, body is only `{ to, body }` like your working curl (server picks From).
    private func optionalSmsFromE164() -> String? {
        let override = messagingTwilioLineE164.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !override.isEmpty else { return nil }
        return PhoneNumberE164.normalize(override)
    }

    // MARK: Filtering helpers

    var filteredCalls: [CallRecord] {
        guard let filter = selectedBusinessFilter else { return calls }
        return calls.filter { $0.businessId == filter }
    }

    /// Incoming/outgoing rows with `outcome == .missed`, scoped by the same business chip as `filteredCalls`.
    var filteredMissedCalls: [CallRecord] {
        filteredCalls.filter(\.isMissed)
    }

    var filteredConversations: [Conversation] {
        guard let filter = selectedBusinessFilter else { return conversations }
        return conversations.filter { $0.businessId == filter }
    }

    /// Recordings whose `To` line matches the selected business (or all when filter is nil).
    /// Rows with no `to` (common on recording-list APIs) are included for every line so they are not hidden behind a chip filter.
    var filteredVoicemails: [VoicemailItem] {
        guard let filter = selectedBusinessFilter,
              let biz = business(filter)
        else { return voicemails }
        let line = PhoneNumberE164.normalize(biz.twilioNumber)
        return voicemails.filter { vm in
            let toN = PhoneNumberE164.normalize(vm.to)
            if toN.isEmpty { return true }
            return toN == line
        }
    }

    // MARK: Lookups

    func business(_ id: UUID) -> Business? {
        businesses.first { $0.id == id }
    }

    func contact(_ id: UUID?) -> Contact? {
        guard let id else { return nil }
        return contacts.first { $0.id == id }
    }

    var outboundBusiness: Business? {
        if let id = outboundBusinessId { return business(id) }
        return businesses.first
    }

    // MARK: Actions

    func appendDigit(_ digit: String) { dialedNumber.append(digit) }
    func deleteLastDigit() { if !dialedNumber.isEmpty { dialedNumber.removeLast() } }

    /// Prefixes US country code so the field shows `+1` before the national number.
    func prependUSCountryCode() {
        let t = dialedNumber.trimmingCharacters(in: .whitespaces)
        if t.hasPrefix("+1") { return }
        if t.hasPrefix("+") { return }
        let digits = t.filter { $0.isNumber }
        dialedNumber = "+1" + digits
    }

    func startOutboundCall() {
        guard !dialedNumber.isEmpty else {
            lastVoiceError = "Enter a phone number first."
            return
        }
        if outboundBusinessId == nil, let first = businesses.first?.id {
            outboundBusinessId = first
        }
        guard let biz = outboundBusiness else {
            lastVoiceError = "No calling line selected. Open Businesses and sync/select a Twilio number."
            return
        }
        lastVoiceError = nil
        let destDisplay = dialedNumber
        let destE164 = PhoneNumberE164.normalize(dialedNumber)
        let fromE164 = PhoneNumberE164.normalize(biz.twilioNumber)
        guard !destE164.isEmpty, !fromE164.isEmpty else {
            lastVoiceError = "Enter a valid phone number."
            return
        }
        if PhoneNumberE164.sameNumber(destE164, fromE164) {
            lastVoiceError =
                "You can't call your own Twilio line (\(fromE164)). Enter a different customer number (for example your mobile)."
            return
        }
        if businesses.contains(where: { PhoneNumberE164.sameNumber($0.twilioNumber, destE164) }) {
            lastVoiceError =
                "That number is one of your business Twilio lines. Outbound calls must go to an external phone, not your own line."
            return
        }
        let callId = UUID()
        outboundVoiceLogRecorded = false
        let ctx = CallContext(
            id: callId,
            displayName: destDisplay,
            number: destE164,
            businessId: biz.id,
            direction: .outgoing,
            startedAt: Date(),
            voiceState: .connecting
        )
        activeCall = ctx
        outboundVoiceLogContext = ctx

        Task { await connectTwilioCall(to: destE164, from: fromE164, uuid: callId) }
    }

    private func connectTwilioCall(to destE164: String, from fromE164: String, uuid: UUID) async {
        let url = effectiveVoiceAccessTokenURL.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !url.isEmpty else {
            await MainActor.run {
                lastVoiceError = "Missing token URL. Use a Release build with your HTTPS token server, set VOICE_TOKEN_URL for Debug device runs, or enter an override in Settings."
                if var ctx = activeCall {
                    ctx.voiceState = .failed("Missing token URL")
                    activeCall = ctx
                }
                finalizeOutboundVoiceCall(using: activeCall ?? outboundVoiceLogContext, disconnectError: nil)
                activeCall = nil
                outboundVoiceLogContext = nil
            }
            return
        }
        do {
            let creds = try await AccessTokenClient.fetchVoiceCredentials(fromTokenURLString: url)
            await MainActor.run {
                self.voiceClientIdentity = creds.identity
                twilioConnected = true
                voiceBridge.connectOutgoing(accessToken: creds.token, to: destE164, from: fromE164, uuid: uuid)
            }
        } catch {
            await MainActor.run {
                twilioConnected = false
                lastVoiceError = error.localizedDescription
                if var ctx = activeCall {
                    ctx.voiceState = .failed(error.localizedDescription)
                    activeCall = ctx
                }
                finalizeOutboundVoiceCall(using: activeCall ?? outboundVoiceLogContext, disconnectError: error)
                activeCall = nil
                outboundVoiceLogContext = nil
            }
        }
    }

    /// Ends the media session; history is written from `handleVoiceDisconnect` when the SDK finishes.
    func endActiveCall() {
        voiceBridge.disconnectUserInitiated()
    }

    func setVoiceMuted(_ muted: Bool) {
        voiceBridge.setMuted(muted)
    }

    // MARK: - Twilio Voice callbacks (from TwilioVoiceBridge)

    func applyVoiceConnectionState(_ state: VoiceConnectionState, callSid: String? = nil) {
        guard var ctx = activeCall else { return }
        ctx.voiceState = state
        if let sid = callSid?.trimmingCharacters(in: .whitespacesAndNewlines), !sid.isEmpty {
            ctx.twilioCallSid = sid
        }
        if state == .connected {
            ctx.connectedAt = Date()
        }
        activeCall = ctx
    }

    func handleVoiceConnectFailure(message: String) {
        lastVoiceError = message.trimmingCharacters(in: .whitespacesAndNewlines)
        voiceBridge.releaseCallReference()
        VoiceAudioSession.deactivateAfterCall()
        VoiceCallKitCoordinator.shared.disableAudio()
        if var ctx = activeCall {
            ctx.voiceState = .failed(message)
            activeCall = ctx
        }
        let snap = activeCall ?? outboundVoiceLogContext
        finalizeOutboundVoiceCall(using: snap, disconnectError: nil)
        programmaticActiveCallDismiss = true
        activeCall = nil
        outboundVoiceLogContext = nil
    }

    func handleVoiceDisconnect(error: Error?) {
        voiceBridge.releaseCallReference()
        VoiceAudioSession.deactivateAfterCall()
        VoiceCallKitCoordinator.shared.disableAudio()
        let snap = activeCall ?? outboundVoiceLogContext
        finalizeOutboundVoiceCall(using: snap, disconnectError: error)
        programmaticActiveCallDismiss = true
        activeCall = nil
        outboundVoiceLogContext = nil
        // Set after UI dismisses the call screen so the alert doesn’t compete with fullScreenCover.
        let now = Date()
        let shortOutgoingDrop: Bool = {
            guard let snap, snap.direction == .outgoing else { return false }
            if snap.connectedAt == nil { return true }
            return now.timeIntervalSince(snap.startedAt) < 3
        }()
        let message: String? = {
            if let error {
                return VoiceCallErrorFormatting.userMessage(for: error)
            }
            if shortOutgoingDrop {
                return "Call ended before connecting.\n\nCommon causes:\n- Caller ID / From number not configured on server\n- TwiML App Voice URL misconfigured\n- Twilio trial account restrictions\n- Destination number not reachable\n"
            }
            return nil
        }()
        if let message {
            Task { @MainActor in
                try? await Task.sleep(nanoseconds: 400_000_000)
                lastVoiceError = message
            }
        }
    }

    /// Dismissed the in-call UI (e.g. interactive sheet dismiss) while a session may still be winding down.
    func activeCallUIDismissed() {
        if programmaticActiveCallDismiss {
            programmaticActiveCallDismiss = false
            return
        }
        voiceBridge.disconnectUserInitiated()
    }

    private func finalizeOutboundVoiceCall(using context: CallContext?, disconnectError: Error?) {
        guard !outboundVoiceLogRecorded else { return }
        guard let ctx = context, let biz = business(ctx.businessId) else { return }
        outboundVoiceLogRecorded = true
        let end = Date()
        let outcome: CallRecord.Outcome
        let duration: Int
        if ctx.voiceFailed || disconnectError != nil {
            outcome = .missed
            duration = 0
        } else if let connectedAt = ctx.connectedAt {
            outcome = .answered
            duration = max(0, Int(end.timeIntervalSince(connectedAt)))
        } else {
            outcome = .missed
            duration = 0
        }
        let recordDirection: CallRecord.Direction = ctx.direction == .incoming ? .incoming : .outgoing
        let trimmedSid = ctx.twilioCallSid?.trimmingCharacters(in: .whitespacesAndNewlines)
        let sid = trimmedSid.flatMap { $0.isEmpty ? nil : $0 }
        let recordId = sid.map { CallRecord.stableUUID(fromTwilioCallSid: $0) } ?? ctx.id
        let record = CallRecord(
            id: recordId,
            twilioCallSid: sid,
            contactId: nil,
            displayName: ctx.displayName,
            rawNumber: ctx.number,
            direction: recordDirection,
            outcome: outcome,
            durationSeconds: duration,
            timestamp: ctx.startedAt,
            businessId: biz.id
        )
        calls = Self.mergedCallHistory(local: calls, remote: [record])
        Task { await FirestoreHistoryService.saveCallRecord(record) }

        // Safety net: some Twilio disconnect paths return no SDK error.
        // Ensure users still see a visible reason after fast outbound failures.
        if recordDirection == .outgoing, outcome == .missed, disconnectError == nil {
            Task { @MainActor in
                try? await Task.sleep(nanoseconds: 250_000_000)
                if self.lastVoiceError == nil {
                    self.lastVoiceError = """
                    Call ended before connecting.

                    Common causes:
                    - Caller ID / From number not configured on server
                    - TwiML App Voice URL misconfigured
                    - Twilio trial account restrictions
                    - Destination number not reachable
                    """
                }
            }
        }
    }

    /// Local UI test — no Twilio push required (Settings → Test incoming screen).
    func testIncomingCallUI() {
        let business = businesses.first ?? Business(
            name: "Test Line",
            twilioNumber: "+15550000000",
            initials: "TL",
            tint: .cyan
        )
        let contact = Contact(
            name: "Test Caller",
            phoneNumbers: [PhoneEntry(kind: .mobile, number: "+12016325548")]
        )
        simulateIncomingCall(from: contact, to: business)
    }

    /// Demo helper: simulate an inbound call for the first business.
    func simulateIncomingCall(from contact: Contact, to business: Business) {
        incomingCall = CallContext(
            displayName: contact.name,
            number: contact.primaryNumber,
            businessId: business.id,
            direction: .incoming,
            startedAt: Date()
        )
        IncomingRingtone.start(ringtoneName: business.ringtoneName)
    }

    func acceptIncomingCall() {
        guard let ctx = incomingCall else { return }
        IncomingRingtone.stop()
        outboundVoiceLogRecorded = false
        if voiceBridge.pendingCallInviteForCallKit(uuid: ctx.id) != nil {
            VoiceCallKitCoordinator.shared.requestAnswer(uuid: ctx.id)
            return
        }
        incomingCall = nil
        var demo = ctx
        demo.voiceState = .connected
        demo.connectedAt = Date()
        activeCall = demo
    }

    func declineIncomingCall() {
        IncomingRingtone.stop()
        guard let inc = incomingCall else {
            voiceBridge.rejectIncomingInviteUserInitiated()
            return
        }
        if voiceBridge.pendingCallInviteForCallKit(uuid: inc.id) != nil {
            VoiceCallKitCoordinator.shared.requestEnd(uuid: inc.id)
            return
        }
        recordDeclinedIncoming(inc)
        incomingCall = nil
        voiceBridge.rejectIncomingInviteUserInitiated()
    }

    /// CallKit user answered (lock screen or in-app Accept routed through CXAnswerCallAction).
    @MainActor
    func handleCallKitAnswer(uuid: UUID) {
        var ctx: CallContext
        if let existing = incomingCall, existing.id == uuid {
            ctx = existing
        } else {
            // Answered from system CallKit UI before in-app sheet appeared — build minimal context.
            let fallbackBiz = businesses.first ?? Business.voiceInboundPlaceholder(clientIdentity: "voice_client")
            ctx = CallContext(
                id: uuid,
                displayName: "Incoming",
                number: "Unknown",
                businessId: fallbackBiz.id,
                direction: .incoming,
                startedAt: Date(),
                voiceState: .ringing
            )
        }
        IncomingRingtone.stop()
        incomingCall = nil
        ctx.voiceState = .connecting
        activeCall = ctx
    }

    /// CallKit ended the ring without connecting (decline / timeout).
    func handleCallKitEnd(uuid: UUID, answered: Bool) {
        IncomingRingtone.stop()
        guard let ctx = incomingCall, ctx.id == uuid else { return }
        incomingCall = nil
        guard !answered else { return }
        recordDeclinedIncoming(ctx)
    }

    private func recordDeclinedIncoming(_ inc: CallContext) {
        let trimmedIncSid = inc.twilioCallSid?.trimmingCharacters(in: .whitespacesAndNewlines)
        let sid = trimmedIncSid.flatMap { $0.isEmpty ? nil : $0 }
        let recordId = sid.map { CallRecord.stableUUID(fromTwilioCallSid: $0) } ?? inc.id
        let record = CallRecord(
            id: recordId,
            twilioCallSid: sid,
            contactId: nil,
            displayName: inc.displayName,
            rawNumber: inc.number,
            direction: .incoming,
            outcome: .declined,
            durationSeconds: 0,
            timestamp: inc.startedAt,
            businessId: inc.businessId
        )
        calls = Self.mergedCallHistory(local: calls, remote: [record])
        Task { await FirestoreHistoryService.saveCallRecord(record) }
    }

    @MainActor
    func presentIncomingVoiceCall(
        inviteFrom: String,
        inviteToLine: String,
        inboundLineE164: String?,
        twilioCallSid: String?,
        callKitUUID: UUID
    ) {
        let toRaw = inviteToLine.trimmingCharacters(in: .whitespacesAndNewlines)
        let inboundLineRaw = (inboundLineE164 ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
        let lineResolutionRaw = inboundLineRaw.isEmpty ? toRaw : inboundLineRaw
        let clientLabel = toRaw.hasPrefix("client:") ? String(toRaw.dropFirst(7)) : toRaw
        let lineE164 = PhoneNumberE164.normalize(lineResolutionRaw)

        var display = inviteFrom
        var numberUi = inviteFrom
        if inviteFrom.hasPrefix("client:") {
            let tail = String(inviteFrom.dropFirst(7))
            display = tail
            numberUi = inviteFrom
        } else {
            numberUi = PhoneNumberE164.normalize(inviteFrom)
            display = numberUi
        }

        var biz: Business?
        if !lineE164.isEmpty {
            biz = businesses.first { PhoneNumberE164.normalize($0.twilioNumber) == lineE164 }
        }
        if biz == nil, let oid = outboundBusinessId { biz = business(oid) }
        if biz == nil { biz = businesses.first }
        if biz == nil, let synthetic = Business.syntheticFromMessagingLineE164(messagingTwilioLineE164) {
            biz = synthetic
        }
        if biz == nil {
            biz = Business.voiceInboundPlaceholder(clientIdentity: clientLabel)
            Self.voiceIncomingLog.warning(
                "No Business matched invite to=\(toRaw, privacy: .public); using Voice placeholder (client=\(clientLabel, privacy: .public))."
            )
        }
        guard let business = biz else {
            Self.voiceIncomingLog.critical("presentIncomingVoiceCall: could not resolve any Business — dropping UI (should never happen).")
            return
        }

        if let c = contacts.first(where: {
            PhoneNumberE164.normalize($0.primaryNumber) == numberUi || $0.primaryNumber == inviteFrom
        }) {
            display = c.name
        }
        Self.voiceIncomingLog.notice(
            "Presenting incoming UI from=\(inviteFrom, privacy: .public) to=\(toRaw, privacy: .public) resolvedLine=\(lineResolutionRaw, privacy: .public) businessId=\(business.id.uuidString, privacy: .public)"
        )
        let trimmedInviteSid = twilioCallSid?.trimmingCharacters(in: .whitespacesAndNewlines)
        let sid = trimmedInviteSid.flatMap { $0.isEmpty ? nil : $0 }
        incomingCall = CallContext(
            id: callKitUUID,
            displayName: display,
            number: numberUi,
            businessId: business.id,
            direction: .incoming,
            startedAt: Date(),
            twilioCallSid: sid,
            voiceState: .ringing
        )
    }

    /// Remote party ended the ring (timeout / hangup) before the user answered — record as missed and sync to Firestore.
    func handleCancelledIncomingInvite(callSid: String) {
        IncomingRingtone.stop()
        let trimmed = callSid.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else {
            incomingCall = nil
            return
        }
        guard let ctx = incomingCall else { return }
        incomingCall = nil
        guard let biz = business(ctx.businessId) else { return }
        if calls.contains(where: { $0.twilioCallSid == trimmed }) { return }
        let contactId = contacts.first(where: {
            PhoneNumberE164.normalize($0.primaryNumber) == PhoneNumberE164.normalize(ctx.number)
                || $0.primaryNumber == ctx.number
        })?.id
        let recId = CallRecord.stableUUID(fromTwilioCallSid: trimmed)
        let record = CallRecord(
            id: recId,
            twilioCallSid: trimmed,
            contactId: contactId,
            displayName: ctx.displayName,
            rawNumber: ctx.number,
            direction: .incoming,
            outcome: .missed,
            durationSeconds: 0,
            timestamp: ctx.startedAt,
            businessId: biz.id
        )
        calls = Self.mergedCallHistory(local: calls, remote: [record])
        Task { await FirestoreHistoryService.saveCallRecord(record) }
    }

    func sendMessage(in conversationId: UUID, body: String) {
        guard let idx = conversations.firstIndex(where: { $0.id == conversationId }),
              let biz = business(conversations[idx].businessId) else { return }
        let trimmed = body.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }

        let msgId = UUID()
        var conv = conversations[idx]
        let pending = Message(id: msgId, direction: .outbound, body: trimmed, timestamp: Date(), status: .sending)
        conv.messages.append(pending)
        conv.lastMessagePreview = "You: \(trimmed)"
        conv.lastMessageTimestamp = Date()
        conversations[idx] = conv
        lastMessagingError = nil

        guard let base = apiBaseURL else {
            markMessageStatus(msgId, in: conversationId, status: .failed)
            lastMessagingError = "No API base URL (check voice token host)."
            return
        }

        let toE164 = PhoneNumberE164.normalize(conv.rawNumber)
        let fromE164 = optionalSmsFromE164()
        let bearer = messagingBearerToken.trimmingCharacters(in: .whitespacesAndNewlines)

        let fromLineForHistory = fromE164 ?? PhoneNumberE164.normalize(biz.twilioNumber)

        Task {
            let firebaseIDToken = await self.firebaseIDTokenForAPI()
            do {
                try await MessagingAPIClient.sendSms(
                    baseURL: base,
                    to: toE164,
                    from: fromE164,
                    body: trimmed,
                    bearer: bearer.isEmpty ? nil : bearer,
                    firebaseIDToken: firebaseIDToken
                )
                await MainActor.run {
                    self.markMessageStatus(msgId, in: conversationId, status: .sent)
                }
                let pendingRow = MessagingAPIClient.LogRow.localOutboundPending(
                    clientMessageId: msgId,
                    from: fromLineForHistory,
                    to: toE164,
                    body: trimmed
                )
                await FirestoreHistoryService.saveSMSRows([pendingRow])
                await self.refreshConversationsFromServer()
            } catch {
                await MainActor.run {
                    self.markMessageStatus(msgId, in: conversationId, status: .failed)
                    self.lastMessagingError = error.localizedDescription
                }
            }
        }
    }

    private func markMessageStatus(_ messageId: UUID, in conversationId: UUID, status: Message.Status) {
        guard let cIdx = conversations.firstIndex(where: { $0.id == conversationId }),
              let mIdx = conversations[cIdx].messages.firstIndex(where: { $0.id == messageId }) else { return }
        var conv = conversations[cIdx]
        conv.messages[mIdx].status = status
        conversations[cIdx] = conv
    }
}

// MARK: - Call context (lightweight, lives only while a call is active)

enum VoiceConnectionState: Equatable, Hashable {
    case idle
    case connecting
    case ringing
    case connected
    case reconnecting
    case failed(String)
}

struct CallContext: Identifiable, Hashable {
    enum Direction { case incoming, outgoing }
    let id: UUID
    var displayName: String
    var number: String
    var businessId: UUID
    var direction: Direction
    var startedAt: Date
    /// Twilio Voice Call SID when this leg came from a `CallInvite` (incoming).
    var twilioCallSid: String?
    /// When Twilio reports media connected (used for duration).
    var connectedAt: Date?
    var voiceState: VoiceConnectionState

    init(
        id: UUID = UUID(),
        displayName: String,
        number: String,
        businessId: UUID,
        direction: Direction,
        startedAt: Date,
        twilioCallSid: String? = nil,
        connectedAt: Date? = nil,
        voiceState: VoiceConnectionState = .idle
    ) {
        self.id = id
        self.displayName = displayName
        self.number = number
        self.businessId = businessId
        self.direction = direction
        self.startedAt = startedAt
        self.twilioCallSid = twilioCallSid
        self.connectedAt = connectedAt
        self.voiceState = voiceState
    }

    fileprivate var voiceFailed: Bool {
        if case .failed = voiceState { return true }
        return false
    }
}

// MARK: - Preview helpers

extension AppState {
    /// Returns a fully-loaded AppState seeded from MockTwilioService —
    /// used for #Preview blocks and the WindowGroup at launch (until real
    /// Twilio is wired up).
    static func previewMock() -> AppState {
        let s = AppState(service: MockTwilioService(), voiceBridge: TwilioVoiceBridge())
        Task { await s.bootstrap() }
        // Synchronously seed with mock data so previews aren't empty on first frame.
        let mock = MockTwilioService()
        s.businesses = mock.seedBusinesses
        s.contacts = mock.seedContacts
        s.calls = mock.seedCalls.sorted(by: { $0.timestamp > $1.timestamp })
        s.conversations = mock.seedConversations.sorted(by: { $0.lastMessageTimestamp > $1.lastMessageTimestamp })
        s.outboundBusinessId = mock.seedBusinesses.first?.id
        return s
    }
}
