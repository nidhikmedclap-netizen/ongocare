import SwiftUI

// Matches prototype #aptPage — upcoming appointment detail
struct AppointmentDetailView: View {
    let visit: Visit
    @State private var showLiveChat = false
    @State private var showCall = false
    @State private var showVideo = false
    @State private var showCancelConfirm = false

    var body: some View {
        ScrollView {
            VStack(spacing: OngoSpacing.lg) {
                // Status banner
                statusBanner

                // Doctor card
                doctorCard

                // Appointment info
                infoCard

                // Join actions
                joinActions

                // Cancel
                Button("Cancel appointment") { showCancelConfirm = true }
                    .font(OngoFont.caption())
                    .foregroundStyle(Color.ongoError)
                    .padding(.top, OngoSpacing.sm)
            }
            .padding(.horizontal, OngoSpacing.md)
            .padding(.top, OngoSpacing.md)
            .padding(.bottom, 100)
        }
        .background(Color.ongoBackground)
        .navigationTitle("Your Appointment")
        .navigationBarTitleDisplayMode(.inline)
        .sheet(isPresented: $showLiveChat) {
            LiveChatView(visit: visit)
        }
        .fullScreenCover(isPresented: $showCall) {
            CallView(visit: visit, isVideo: false)
        }
        .fullScreenCover(isPresented: $showVideo) {
            CallView(visit: visit, isVideo: true)
        }
        .confirmationDialog("Cancel appointment?", isPresented: $showCancelConfirm, titleVisibility: .visible) {
            Button("Yes, cancel", role: .destructive) { cancelAppointment() }
            Button("Keep it", role: .cancel) { }
        } message: {
            Text("This will free up the slot. You can rebook anytime.")
        }
    }

    // MARK: - Status banner
    private var statusBanner: some View {
        HStack {
            Image(systemName: statusIcon)
                .font(.system(size: 18))
                .foregroundStyle(statusColor)
            Text(visit.status.displayName)
                .font(OngoFont.subheadline())
                .foregroundStyle(statusColor)
            Spacer()
            if visit.status == .scheduled {
                Text(timeUntilLabel)
                    .font(OngoFont.caption())
                    .foregroundStyle(Color.ongoTextSecondary)
            }
        }
        .padding(OngoSpacing.sm)
        .background(statusColor.opacity(0.1))
        .clipShape(RoundedRectangle(cornerRadius: OngoRadius.md))
    }

    private var statusIcon: String {
        switch visit.status {
        case .scheduled:  return "calendar.badge.clock"
        case .inProgress: return "circle.fill"
        case .completed:  return "checkmark.circle.fill"
        case .cancelled:  return "xmark.circle.fill"
        case .noShow:     return "exclamationmark.circle.fill"
        }
    }

    private var statusColor: Color {
        Color.visitStatusColor(for: visit.status)
    }

    private var timeUntilLabel: String {
        let interval = visit.scheduledAt.timeIntervalSinceNow
        if interval < 3600 { return "< 1 hour away" }
        let hours = Int(interval / 3600)
        if hours < 24 { return "\(hours)h away" }
        let days = hours / 24
        return "\(days)d away"
    }

    // MARK: - Doctor card
    private var doctorCard: some View {
        OngoCard {
            HStack(spacing: OngoSpacing.sm) {
                if let url = visit.doctorPhotoURL.flatMap(URL.init) {
                    OngoAvatarView(initials: "", photoURL: url, size: 56)
                } else {
                    OngoAvatarView(initials: String(visit.doctorName.prefix(2)), size: 56)
                }
                VStack(alignment: .leading, spacing: 4) {
                    Text(visit.doctorName)
                        .font(OngoFont.subheadline(16))
                        .foregroundStyle(Color.ongoTextPrimary)
                    Text("Your Ongo Doctor")
                        .font(OngoFont.caption())
                        .foregroundStyle(Color.ongoTextSecondary)
                }
                Spacer()
            }
        }
    }

    // MARK: - Info card
    private var infoCard: some View {
        OngoCard {
            VStack(spacing: OngoSpacing.sm) {
                infoRow(icon: "calendar", label: "Date", value: visit.scheduledAt.dayMonthYear)
                Divider()
                infoRow(icon: "clock", label: "Time", value: visit.scheduledAt.timeOnly)
                Divider()
                infoRow(icon: visit.visitType.icon, label: "Type", value: visit.visitType.displayName)
                Divider()
                infoRow(icon: "timer", label: "Duration", value: "\(visit.durationMinutes) minutes")
            }
        }
    }

    private func infoRow(icon: String, label: String, value: String) -> some View {
        HStack {
            Image(systemName: icon)
                .font(.system(size: 16))
                .foregroundStyle(Color.ongoPrimary)
                .frame(width: 24)
            Text(label)
                .font(OngoFont.body())
                .foregroundStyle(Color.ongoTextSecondary)
            Spacer()
            Text(value)
                .font(OngoFont.subheadline())
                .foregroundStyle(Color.ongoTextPrimary)
        }
    }

    // MARK: - Join actions (context-aware based on visit type)
    private var joinActions: some View {
        VStack(spacing: OngoSpacing.xs) {
            switch visit.visitType {
            case .chat:
                OngoPrimaryButton(title: "Open Chat") { showLiveChat = true }
            case .call:
                OngoPrimaryButton(title: "Join Call") { showCall = true }
            case .video:
                OngoPrimaryButton(title: "Join Video") { showVideo = true }
            }
        }
    }

    // MARK: - Cancel
    private func cancelAppointment() {
        Task {
            guard let visitId = visit.id else { return }
            let ref = Firestore.firestore()
                .collection(Visit.collectionPath).document(visitId)
            try? await ref.updateData([
                "status": Visit.VisitStatus.cancelled.rawValue,
                "updatedAt": Date()
            ])
        }
    }
}

extension Visit.VisitStatus {
    var displayName: String {
        switch self {
        case .scheduled:  return "Scheduled"
        case .inProgress: return "In Progress"
        case .completed:  return "Completed"
        case .cancelled:  return "Cancelled"
        case .noShow:     return "No Show"
        }
    }
}

import FirebaseFirestore
