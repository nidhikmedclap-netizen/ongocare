import SwiftUI

// Matches prototype #bookingPage — WhatsApp-style AI booking assistant
struct BookingView: View {
    @Environment(AppState.self) private var appState
    @Environment(\.dismiss) private var dismiss
    @State private var vm = BookingViewModel()
    @State private var showCalendar = false
    @State private var showDoctorProfile: Doctor? = nil
    @FocusState private var inputFocused: Bool

    var body: some View {
        VStack(spacing: 0) {
            bookingHeader
            Divider()
            chatArea
            inputBar
        }
        .background(Color.ongoBackground)
        .navigationBarHidden(true)
        .task {
            let name = appState.ongoUser?.firstName ?? "there"
            let autoAssign = appState.autoAssignDoctorMode
            await vm.startConversation(autoAssign: autoAssign, patientName: name)
        }
        .sheet(item: $showDoctorProfile) { doctor in
            DoctorProfileView(doctor: doctor)
        }
        .onChange(of: vm.isBookingComplete) { _, complete in
            if complete {
                appState.firstBookingCompleted()
                DispatchQueue.main.asyncAfter(deadline: .now() + 2) { dismiss() }
            }
        }
    }

    // MARK: - Header (matches .bk-header)
    private var bookingHeader: some View {
        HStack(spacing: OngoSpacing.sm) {
            Button { dismiss() } label: {
                Image(systemName: "chevron.left")
                    .font(.system(size: 17, weight: .semibold))
                    .foregroundStyle(Color.ongoTextPrimary)
            }

            ZStack {
                Circle().fill(Color.ongoGreenMuted).frame(width: 40, height: 40)
                Image(systemName: "person.crop.circle.badge.checkmark")
                    .font(.system(size: 20))
                    .foregroundStyle(Color.ongoPrimary)
            }

            VStack(alignment: .leading, spacing: 1) {
                Text("Ongo Assistant")
                    .font(OngoFont.subheadline())
                    .foregroundStyle(Color.ongoTextPrimary)
                HStack(spacing: 4) {
                    OnlineDot()
                    Text("Smart Booking Assistant")
                        .font(OngoFont.caption(11))
                        .foregroundStyle(Color.ongoTextSecondary)
                }
            }
            Spacer()
        }
        .padding(.horizontal, OngoSpacing.md)
        .padding(.vertical, OngoSpacing.sm)
        .background(Color.ongoCard)
    }

    // MARK: - Chat scroll area
    private var chatArea: some View {
        ScrollViewReader { proxy in
            ScrollView {
                LazyVStack(alignment: .leading, spacing: OngoSpacing.sm) {
                    ChatDayPill(label: "Today")
                        .frame(maxWidth: .infinity)
                        .padding(.top, OngoSpacing.sm)

                    ForEach(vm.messages) { msg in
                        messageView(msg)
                            .id(msg.id.uuidString)
                    }

                    if vm.isTyping {
                        HStack {
                            TypingIndicator()
                            Spacer()
                        }
                        .padding(.horizontal, OngoSpacing.md)
                        .id("typing")
                    }
                }
                .padding(.bottom, OngoSpacing.md)
            }
            .onChange(of: vm.messages.count) { _, _ in
                withAnimation {
                    proxy.scrollTo(vm.messages.last?.id.uuidString ?? "typing", anchor: .bottom)
                }
            }
            .onChange(of: vm.isTyping) { _, _ in
                withAnimation { proxy.scrollTo("typing", anchor: .bottom) }
            }
        }
    }

    // MARK: - Single message view
    @ViewBuilder
    private func messageView(_ msg: BookingMessage) -> some View {
        VStack(alignment: msg.isFromUser ? .trailing : .leading, spacing: OngoSpacing.xs) {
            ChatBubble(text: msg.text, isFromUser: msg.isFromUser, timestamp: msg.sentAt)
                .padding(.horizontal, OngoSpacing.md)

            // Quick reply chips (visit type selection)
            if let replies = msg.quickReplies, !replies.isEmpty {
                quickReplyRow(replies)
            }

            // Doctor cards
            if let doctors = msg.doctorOptions {
                doctorCardRow(doctors)
            }

            // Slot picker trigger
            if vm.flowStep == .selectSlot && !msg.isFromUser && msg == vm.messages.last {
                slotPickerButton
            }

            // Confirm button
            if msg.showConfirmButton && vm.flowStep == .confirm {
                confirmButton
            }
        }
    }

    // MARK: - Quick reply row
    private func quickReplyRow(_ replies: [QuickReply]) -> some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: OngoSpacing.xs) {
                ForEach(replies) { reply in
                    Button {
                        if let type = Visit.VisitType(rawValue: reply.id) {
                            Task {
                                await vm.selectVisitType(
                                    type,
                                    autoAssign: appState.autoAssignDoctorMode,
                                    patientState: nil
                                )
                            }
                        }
                    } label: {
                        Label(reply.label, systemImage: reply.icon)
                            .font(OngoFont.subheadline(13))
                            .foregroundStyle(Color.ongoPrimary)
                            .padding(.horizontal, OngoSpacing.sm)
                            .padding(.vertical, OngoSpacing.xs)
                            .background(Color.ongoGreenMuted)
                            .clipShape(Capsule())
                    }
                }
            }
            .padding(.horizontal, OngoSpacing.md)
        }
    }

    // MARK: - Doctor mini-cards
    private func doctorCardRow(_ doctors: [Doctor]) -> some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: OngoSpacing.sm) {
                ForEach(doctors) { doctor in
                    doctorMiniCard(doctor)
                }
            }
            .padding(.horizontal, OngoSpacing.md)
        }
    }

    private func doctorMiniCard(_ doctor: Doctor) -> some View {
        VStack(alignment: .leading, spacing: OngoSpacing.xs) {
            OngoAvatarView(initials: String(doctor.firstName.prefix(1) + doctor.lastName.prefix(1)), size: 44)
            Text(doctor.displayName)
                .font(OngoFont.subheadline(13))
                .foregroundStyle(Color.ongoTextPrimary)
            Text(doctor.specialty)
                .font(OngoFont.caption(11))
                .foregroundStyle(Color.ongoTextSecondary)
            HStack(spacing: 3) {
                Image(systemName: "star.fill").font(.system(size: 10)).foregroundStyle(Color.ongoOrange)
                Text(String(format: "%.1f", doctor.rating)).font(OngoFont.label(10))
            }
            HStack(spacing: OngoSpacing.xxs) {
                Button("Select") {
                    Task { await vm.selectDoctor(doctor) }
                }
                .font(OngoFont.label(11))
                .foregroundStyle(.white)
                .padding(.horizontal, OngoSpacing.xs)
                .padding(.vertical, 4)
                .background(Color.ongoPrimary)
                .clipShape(Capsule())

                Button("Bio") { showDoctorProfile = doctor }
                    .font(OngoFont.label(11))
                    .foregroundStyle(Color.ongoPrimary)
                    .padding(.horizontal, OngoSpacing.xs)
                    .padding(.vertical, 4)
                    .background(Color.ongoGreenMuted)
                    .clipShape(Capsule())
            }
        }
        .padding(OngoSpacing.sm)
        .background(Color.ongoCard)
        .clipShape(RoundedRectangle(cornerRadius: OngoRadius.md))
        .ongoCardShadow()
        .frame(width: 140)
    }

    // MARK: - Slot picker button (opens calendar sheet)
    private var slotPickerButton: some View {
        Button {
            showCalendar = true
        } label: {
            Label("Pick a time", systemImage: "calendar")
                .font(OngoFont.subheadline(14))
                .foregroundStyle(Color.ongoPrimary)
                .frame(maxWidth: .infinity)
                .frame(height: 48)
                .background(Color.ongoGreenMuted)
                .clipShape(RoundedRectangle(cornerRadius: OngoRadius.xl))
        }
        .padding(.horizontal, OngoSpacing.md)
        .sheet(isPresented: $showCalendar) {
            SlotPickerView(slots: vm.availableSlots) { slot in
                showCalendar = false
                Task { await vm.selectSlot(slot) }
            }
            .presentationDetents([.large])
        }
    }

    // MARK: - Confirm button
    private var confirmButton: some View {
        OngoPrimaryButton(
            title: "Confirm Appointment",
            isLoading: vm.flowStep == .booking
        ) {
            guard let userId = appState.ongoUser?.id else { return }
            Task { await vm.confirmBooking(patientId: userId) }
        }
        .padding(.horizontal, OngoSpacing.md)
    }

    // MARK: - Input bar
    private var inputBar: some View {
        HStack(spacing: OngoSpacing.xs) {
            TextField("Type a message…", text: $vm.inputText)
                .font(OngoFont.body())
                .padding(.horizontal, OngoSpacing.sm)
                .padding(.vertical, OngoSpacing.xs)
                .background(Color.ongoCardAlt)
                .clipShape(Capsule())
                .focused($inputFocused)

            Button {
                let text = vm.inputText
                Task { await vm.sendMessage(text) }
            } label: {
                Image(systemName: "paperplane.fill")
                    .font(.system(size: 18))
                    .foregroundStyle(vm.inputText.isEmpty ? Color.ongoTextTertiary : Color.ongoPrimary)
                    .frame(width: 40, height: 40)
            }
            .disabled(vm.inputText.isEmpty)
        }
        .padding(.horizontal, OngoSpacing.md)
        .padding(.vertical, OngoSpacing.xs)
        .background(Color.ongoCard)
    }
}

// Equatable conformance for message comparison in view
extension BookingMessage: Equatable {
    static func == (lhs: BookingMessage, rhs: BookingMessage) -> Bool { lhs.id == rhs.id }
}
