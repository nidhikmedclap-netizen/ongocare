import Foundation
import Observation
import FirebaseFirestore

// MARK: - Booking AI chat state machine
// Mirrors the prototype bookingPage conversational flow
@Observable
final class BookingViewModel {
    // MARK: - Chat
    var messages: [BookingMessage] = []
    var inputText: String = ""
    var isTyping: Bool = false  // AI typing indicator

    // MARK: - Flow state
    var flowStep: BookingFlowStep = .greeting
    var selectedVisitType: Visit.VisitType? = nil
    var selectedDoctor: Doctor? = nil
    var selectedSlot: AvailabilitySlot? = nil
    var availableSlots: [AvailabilitySlot] = []
    var availableDoctors: [Doctor] = []

    // MARK: - Booking result
    var createdVisit: Visit? = nil
    var isBookingComplete: Bool = false
    var error: String? = nil

    private let firestore = FirestoreService.shared

    enum BookingFlowStep {
        case greeting
        case selectVisitType
        case loadingDoctors
        case selectDoctor      // skipped when autoAssignDoctorMode = true
        case loadingSlots
        case selectSlot
        case confirm
        case booking
        case success
    }

    // MARK: - Start conversation
    @MainActor
    func startConversation(autoAssign: Bool, patientName: String) async {
        appendAI("Hi \(patientName)! 👋 I'm your Ongo booking assistant. I'll help you schedule a visit with one of our doctors.")
        try? await Task.sleep(for: .milliseconds(900))
        appendAI("What type of visit works best for you?", options: visitTypeOptions)
        flowStep = .selectVisitType
    }

    // MARK: - User selects visit type
    @MainActor
    func selectVisitType(_ type: Visit.VisitType, autoAssign: Bool, patientState: String?) async {
        selectedVisitType = type
        appendUser(type.displayName)
        flowStep = .loadingDoctors
        isTyping = true
        try? await Task.sleep(for: .milliseconds(1200))
        isTyping = false

        if autoAssign {
            appendAI("Perfect! I'm matching you with the best available doctor in our network.")
            await loadDoctors(state: patientState, autoAssign: true)
        } else {
            appendAI("Great choice. Let me find available doctors for you.")
            await loadDoctors(state: patientState, autoAssign: false)
        }
    }

    // MARK: - Load doctors from Firestore
    @MainActor
    private func loadDoctors(state: String?, autoAssign: Bool) async {
        var filters: [(field: String, op: FirestoreService.ComparisonOperator, value: Any)] = [
            ("isAvailable", .isEqualTo, true),
            ("active", .isEqualTo, true)
        ]
        if let state {
            filters.append(("licensedStates", .arrayContains, state))
        }

        let doctors = (try? await firestore.query(
            Doctor.self,
            collection: Doctor.collectionPath,
            filters: filters,
            limit: autoAssign ? 1 : 5
        )) ?? []

        availableDoctors = doctors

        if autoAssign {
            selectedDoctor = doctors.first
            flowStep = .loadingSlots
            if let doc = selectedDoctor {
                appendAI("You've been matched with **\(doc.fullName)** — \(doc.specialty). Rated ⭐ \(String(format: "%.1f", doc.rating)) by \(doc.reviewCount) patients.")
            } else {
                appendAI("Finding availability for you now…")
            }
            await loadSlots()
        } else {
            if doctors.isEmpty {
                appendAI("I'm having trouble finding available doctors right now. Please try again in a moment or contact support.")
                flowStep = .greeting
            } else {
                flowStep = .selectDoctor
                appendAI("Here are our available doctors:", doctorOptions: doctors)
            }
        }
    }

    // MARK: - User selects doctor (manual mode)
    @MainActor
    func selectDoctor(_ doctor: Doctor) async {
        selectedDoctor = doctor
        appendUser("Dr. \(doctor.lastName)")
        isTyping = true
        try? await Task.sleep(for: .milliseconds(900))
        isTyping = false
        flowStep = .loadingSlots
        appendAI("Great! Let me pull up Dr. \(doctor.lastName)'s availability.")
        await loadSlots()
    }

    // MARK: - Load available time slots
    @MainActor
    private func loadSlots() async {
        guard let doctorId = selectedDoctor?.id else { return }
        let tomorrow = Calendar.current.date(byAdding: .day, value: 1, to: Date()) ?? Date()
        let slots = (try? await firestore.query(
            AvailabilitySlot.self,
            collection: AvailabilitySlot.collectionPath,
            filters: [
                ("doctorId", .isEqualTo, doctorId),
                ("isBooked", .isEqualTo, false),
                ("startTime", .isGreaterThan, tomorrow)
            ],
            orderBy: ("startTime", descending: false),
            limit: 20
        )) ?? []

        availableSlots = slots
        flowStep = .selectSlot

        if slots.isEmpty {
            appendAI("It looks like there are no slots available in the next few days. Please check back soon or try a different visit type.")
        } else {
            appendAI("Here are the next available times. Tap one to select it:")
        }
    }

    // MARK: - User selects a time slot
    @MainActor
    func selectSlot(_ slot: AvailabilitySlot) async {
        selectedSlot = slot
        appendUser(slot.startTime.dayMonthYear + " at " + slot.startTime.timeOnly)
        isTyping = true
        try? await Task.sleep(for: .milliseconds(700))
        isTyping = false
        flowStep = .confirm

        let doctorName = selectedDoctor.map { "Dr. \($0.lastName)" } ?? "your doctor"
        let visitTypeName = selectedVisitType?.displayName ?? "visit"
        appendAI("Got it! Here's your booking summary:\n\n📅 **\(slot.startTime.dayMonthYear)**\n⏰ **\(slot.startTime.timeOnly)**\n👨‍⚕️ **\(doctorName)**\n💬 **\(visitTypeName)**\n\nShall I confirm this?", confirmAction: true)
    }

    // MARK: - Confirm booking
    @MainActor
    func confirmBooking(patientId: String) async {
        guard let slot = selectedSlot,
              let doctor = selectedDoctor,
              let visitType = selectedVisitType else { return }

        appendUser("Yes, confirm!")
        flowStep = .booking
        isTyping = true

        let visit = Visit(
            patientId: patientId,
            doctorId: doctor.id ?? "",
            doctorName: doctor.fullName,
            doctorPhotoURL: doctor.photoURL,
            visitType: visitType,
            status: .scheduled,
            scheduledAt: slot.startTime,
            durationMinutes: 30,
            createdAt: Date(),
            updatedAt: Date()
        )

        do {
            _ = try await firestore.add(visit, collection: Visit.collectionPath)
            // Mark slot as booked
            let ref = Firestore.firestore()
                .collection(AvailabilitySlot.collectionPath).document(slot.id)
            try await ref.updateData(["isBooked": true])

            createdVisit = visit
            flowStep = .success
            isTyping = false
            appendAI("🎉 You're booked! Your appointment is confirmed.\n\nYou'll receive a reminder 24 hours before. See you soon!")
            isBookingComplete = true
            AnalyticsService.logBookingCompleted(visitType: visitType.rawValue)
        } catch {
            isTyping = false
            self.error = "Booking failed. Please try again."
            flowStep = .confirm
        }
    }

    // MARK: - Send free-text message (fallback / FAQ)
    @MainActor
    func sendMessage(_ text: String) async {
        guard !text.trimmingCharacters(in: .whitespaces).isEmpty else { return }
        appendUser(text)
        inputText = ""
        isTyping = true
        try? await Task.sleep(for: .milliseconds(1000))
        isTyping = false
        // Simple FAQ routing; full AI integration is v2
        let lower = text.lowercased()
        if lower.contains("cancel") {
            appendAI("To cancel an existing appointment, go to Account → Appointments and tap Cancel.")
        } else if lower.contains("insurance") {
            appendAI("We accept most major insurance plans. Your doctor will confirm coverage at your first visit.")
        } else {
            appendAI("I'm here to help you book a visit! Use the options above or type your question.")
        }
    }

    // MARK: - Message helpers
    private func appendAI(_ text: String,
                           options: [QuickReply]? = nil,
                           doctorOptions: [Doctor]? = nil,
                           confirmAction: Bool = false) {
        messages.append(BookingMessage(
            sender: .ai,
            text: text,
            quickReplies: options,
            doctorOptions: doctorOptions,
            showConfirmButton: confirmAction
        ))
    }

    private func appendUser(_ text: String) {
        messages.append(BookingMessage(sender: .user, text: text))
    }

    // MARK: - Visit type quick replies
    private var visitTypeOptions: [QuickReply] {
        Visit.VisitType.allCases.map { type in
            QuickReply(id: type.rawValue, label: type.displayName, icon: type.icon)
        }
    }
}

// MARK: - Supporting types
struct BookingMessage: Identifiable {
    let id = UUID()
    let sender: Sender
    let text: String
    var quickReplies: [QuickReply]? = nil
    var doctorOptions: [Doctor]? = nil
    var showConfirmButton: Bool = false
    let sentAt = Date()

    enum Sender { case ai, user }
    var isFromUser: Bool { sender == .user }
}

struct QuickReply: Identifiable {
    let id: String
    let label: String
    let icon: String
}

import FirebaseFirestore
