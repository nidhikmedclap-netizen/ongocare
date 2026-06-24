import Foundation
import SwiftUI
import Observation
import FirebaseFirestore

@Observable
final class HomeViewModel: @unchecked Sendable {
    // MARK: - User data
    var user: OngoUser? = nil
    var todayCheckin: DailyCheckin? = nil
    var latestWeight: WeightEntry? = nil
    var upcomingVisit: Visit? = nil
    var activePrescription: Prescription? = nil
    var assignedDoctor: Doctor? = nil

    // MARK: - Smart ATF
    var atfMessages: [SmartATFMessage] = []
    var currentATFIndex: Int = 0
    private var atfRotationTask: Task<Void, Never>? = nil

    // MARK: - UI State
    var showWeightLogModal: Bool = false
    var showSignOutConfirm: Bool = false
    var isLoading: Bool = false
    var error: String? = nil

    // MARK: - Listeners
    private var checkinListener: ListenerRegistration? = nil
    private var visitListener: ListenerRegistration? = nil

    private let firestore = FirestoreService.shared

    // MARK: - Load everything for home screen
    @MainActor
    func load(user: OngoUser) async {
        self.user = user
        guard let userId = user.id else { return }
        isLoading = true

        await listenToTodayCheckin(userId: userId)
        await loadLatestWeight(userId: userId)
        await loadUpcomingVisit(userId: userId)
        await loadActivePrescription(user: user)
        await loadAssignedDoctor(user: user)
        await loadATFMessages(user: user)
        isLoading = false
    }

    // MARK: - Today's check-in (real-time)
    @MainActor private func listenToTodayCheckin(userId: String) async {
        let docId = DailyCheckin.documentId(userId: userId, date: Date())
        checkinListener = firestore.listen(
            DailyCheckin.self,
            collection: DailyCheckin.collectionPath,
            documentId: docId
        ) { [weak self] checkin in
            self?.todayCheckin = checkin
        }
    }

    // MARK: - Latest weight entry
    @MainActor private func loadLatestWeight(userId: String) async {
        let entries = try? await firestore.query(
            WeightEntry.self,
            collection: WeightEntry.collectionPath,
            filters: [("userId", .isEqualTo, userId)],
            orderBy: ("loggedAt", descending: true),
            limit: 1
        )
        latestWeight = entries?.first
    }

    // MARK: - Next upcoming visit
    @MainActor private func loadUpcomingVisit(userId: String) async {
        let visits = try? await firestore.query(
            Visit.self,
            collection: Visit.collectionPath,
            filters: [
                ("patientId", .isEqualTo, userId),
                ("status", .isEqualTo, Visit.VisitStatus.scheduled.rawValue)
            ],
            orderBy: ("scheduledAt", descending: false),
            limit: 1
        )
        upcomingVisit = visits?.first
    }

    // MARK: - Active prescription
    @MainActor private func loadActivePrescription(user: OngoUser) async {
        guard let rxId = user.activePrescriptionId else { return }
        activePrescription = try? await firestore.get(
            Prescription.self,
            collection: Prescription.collectionPath,
            documentId: rxId
        )
    }

    // MARK: - Assigned doctor
    @MainActor private func loadAssignedDoctor(user: OngoUser) async {
        guard let doctorId = user.assignedDoctorId else { return }
        assignedDoctor = try? await firestore.get(
            Doctor.self,
            collection: Doctor.collectionPath,
            documentId: doctorId
        )
    }

    // MARK: - ATF messages (cached, scored, sorted)
    @MainActor private func loadATFMessages(user: OngoUser) async {
        let messages = (try? await firestore.fetchATFMessages()) ?? []
        atfMessages = score(messages: messages, user: user)
        startATFRotation()
    }

    private func score(messages: [SmartATFMessage], user: OngoUser) -> [SmartATFMessage] {
        let today = Date()
        let dayOfWeek = Calendar.current.component(.weekday, from: today)

        return messages
            .filter { msg in
                guard let cond = msg.conditions else { return true }
                if let dow = cond.dayOfWeek, !dow.contains(dayOfWeek) { return false }
                if let hasMed = cond.hasMedication, hasMed != (user.activePrescriptionId != nil) { return false }
                return true
            }
            .sorted {
                let tierA = $0.tier.sortPriority
                let tierB = $1.tier.sortPriority
                if tierA != tierB { return tierA > tierB }
                return $0.score > $1.score
            }
    }

    private func startATFRotation() {
        atfRotationTask?.cancel()
        atfRotationTask = Task {
            while !Task.isCancelled && !atfMessages.isEmpty {
                try? await Task.sleep(for: .seconds(6))
                await MainActor.run {
                    withAnimation(.easeInOut(duration: 0.4)) {
                        currentATFIndex = (currentATFIndex + 1) % max(1, atfMessages.count)
                    }
                }
            }
        }
    }

    // MARK: - Daily action quick-log helpers
    @MainActor
    func logWaterCup(userId: String) async {
        let docId = DailyCheckin.documentId(userId: userId, date: Date())
        var entry = todayCheckin?.water ?? DailyCheckin.WaterEntry(cupsLogged: 0, goalCups: 8, loggedAt: Date())
        entry.cupsLogged = min(entry.cupsLogged + 1, entry.goalCups)
        entry.loggedAt = Date()

        var updates: [String: Any] = ["water": try! Firestore.Encoder().encode(entry)]
        updates["updatedAt"] = Date()
        updates["userId"] = userId
        updates["date"] = Date().midnightUTC
        if todayCheckin == nil { updates["createdAt"] = Date() }

        let ref = Firestore.firestore()
            .collection(DailyCheckin.collectionPath).document(docId)
        try? await ref.setData(updates, merge: true)
        AnalyticsService.logCheckinLogged(type: "water")
    }

    // MARK: - Cleanup
    func cleanup() {
        checkinListener?.remove()
        visitListener?.remove()
        atfRotationTask?.cancel()
    }
}
