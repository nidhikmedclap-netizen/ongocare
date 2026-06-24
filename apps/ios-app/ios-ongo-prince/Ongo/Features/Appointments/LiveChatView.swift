import SwiftUI
import FirebaseFirestore

// Matches prototype #liveChatPage — patient ↔ doctor WhatsApp-style thread
struct LiveChatView: View {
    let visit: Visit
    @Environment(AppState.self) private var appState
    @Environment(\.dismiss) private var dismiss

    @State private var messages: [Message] = []
    @State private var inputText: String = ""
    @State private var isLoading: Bool = false
    @FocusState private var inputFocused: Bool
    private var listener: ListenerRegistration? = nil

    init(visit: Visit) {
        self.visit = visit
    }

    private var threadId: String {
        guard let userId = appState.ongoUser?.id else { return "" }
        return Message.threadId(patientId: userId, doctorId: visit.doctorId)
    }

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                chatHeader
                Divider()
                messageList
                inputBar
            }
            .background(Color.ongoBackground)
            .navigationBarHidden(true)
        }
        .task { await loadMessages() }
    }

    // MARK: - Header
    private var chatHeader: some View {
        HStack(spacing: OngoSpacing.sm) {
            Button { dismiss() } label: {
                Image(systemName: "chevron.left")
                    .font(.system(size: 17, weight: .semibold))
                    .foregroundStyle(Color.ongoTextPrimary)
            }
            OngoAvatarView(initials: String(visit.doctorName.prefix(2)), size: 38)
            VStack(alignment: .leading, spacing: 1) {
                Text(visit.doctorName)
                    .font(OngoFont.subheadline())
                HStack(spacing: 4) {
                    OnlineDot()
                    Text("Your Ongo Doctor")
                        .font(OngoFont.caption(11))
                        .foregroundStyle(Color.ongoTextSecondary)
                }
            }
            Spacer()
            // Call/video quick actions
            Button {  } label: {
                Image(systemName: "phone.fill")
                    .font(.system(size: 16))
                    .foregroundStyle(Color.ongoPrimary)
            }
            Button {  } label: {
                Image(systemName: "video.fill")
                    .font(.system(size: 16))
                    .foregroundStyle(Color.ongoPrimary)
            }
        }
        .padding(.horizontal, OngoSpacing.md)
        .padding(.vertical, OngoSpacing.sm)
        .background(Color.ongoCard)
    }

    // MARK: - Message list
    private var messageList: some View {
        ScrollViewReader { proxy in
            ScrollView {
                LazyVStack(spacing: OngoSpacing.xs) {
                    ChatDayPill(label: "Today")
                        .frame(maxWidth: .infinity)
                        .padding(.top, OngoSpacing.sm)

                    ForEach(messages) { msg in
                        ChatBubble(
                            text: msg.body,
                            isFromUser: msg.isFromCurrentUser,
                            timestamp: msg.sentAt
                        )
                        .padding(.horizontal, OngoSpacing.md)
                        .id(msg.id)
                    }

                    if messages.isEmpty {
                        Text("Start the conversation with your doctor.")
                            .font(OngoFont.body())
                            .foregroundStyle(Color.ongoTextSecondary)
                            .padding(.top, OngoSpacing.xxxl)
                            .frame(maxWidth: .infinity)
                    }
                }
                .padding(.bottom, OngoSpacing.md)
            }
            .onChange(of: messages.count) { _, _ in
                withAnimation { proxy.scrollTo(messages.last?.id, anchor: .bottom) }
            }
        }
    }

    // MARK: - Input bar
    private var inputBar: some View {
        HStack(spacing: OngoSpacing.xs) {
            TextField("Message…", text: $inputText, axis: .vertical)
                .font(OngoFont.body())
                .lineLimit(1...4)
                .padding(.horizontal, OngoSpacing.sm)
                .padding(.vertical, OngoSpacing.xs)
                .background(Color.ongoCardAlt)
                .clipShape(RoundedRectangle(cornerRadius: 20))
                .focused($inputFocused)

            Button { sendMessage() } label: {
                Image(systemName: "paperplane.fill")
                    .font(.system(size: 18))
                    .foregroundStyle(inputText.isEmpty ? Color.ongoTextTertiary : Color.ongoPrimary)
                    .frame(width: 40, height: 40)
            }
            .disabled(inputText.trimmingCharacters(in: .whitespaces).isEmpty || isLoading)
        }
        .padding(.horizontal, OngoSpacing.md)
        .padding(.vertical, OngoSpacing.xs)
        .background(Color.ongoCard)
    }

    // MARK: - Load + listen to messages
    private func loadMessages() async {
        guard !threadId.isEmpty else { return }
        _ = FirestoreService.shared.listenQuery(
            Message.self,
            collection: Message.collectionPath,
            filters: [("threadId", .isEqualTo, threadId)],
            orderBy: ("sentAt", descending: false)
        ) { [self] fetched in
            let userId = appState.ongoUser?.id ?? ""
            messages = fetched.map { msg in
                var m = msg
                m.isFromCurrentUser = m.senderId == userId
                return m
            }
        }
    }

    // MARK: - Send message
    private func sendMessage() {
        let text = inputText.trimmingCharacters(in: .whitespaces)
        guard !text.isEmpty, let userId = appState.ongoUser?.id else { return }
        inputText = ""
        isLoading = true

        let msg = Message(
            threadId: threadId,
            senderId: userId,
            senderType: .patient,
            senderName: appState.ongoUser?.displayName ?? "",
            body: text,
            readBy: [userId],
            sentAt: Date()
        )
        Task {
            _ = try? await FirestoreService.shared.add(msg, collection: Message.collectionPath)
            await MainActor.run { isLoading = false }
        }
    }
}
