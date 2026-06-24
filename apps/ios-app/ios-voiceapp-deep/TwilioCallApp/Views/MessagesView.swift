//
//  MessagesView.swift
//  TwilioCallApp
//
//  Conversation list. Same business filter strip pattern as Recents
//  so the user can isolate inbound traffic to one Twilio line at a time.
//

import SwiftUI

struct MessagesView: View {
    @Environment(AppState.self) private var appState
    @State private var messagingErrorPresented = false
    @State private var path: [UUID] = []
    @State private var newMessagePresented = false

    var body: some View {
        @Bindable var state = appState
        NavigationStack(path: $path) {
            ZStack(alignment: .bottomTrailing) {
                Theme.background.ignoresSafeArea()

                VStack(spacing: 0) {
                    BusinessFilterStrip(businesses: appState.businesses,
                                        selection: $state.selectedBusinessFilter)
                        .padding(.top, 6)

                    if appState.filteredConversations.isEmpty {
                        emptyState
                    } else {
                        List {
                            ForEach(appState.filteredConversations) { convo in
                                NavigationLink(value: convo.id) {
                                    ConversationRow(
                                        convo: convo,
                                        business: appState.business(convo.businessId),
                                        contact: appState.contact(convo.contactId)
                                    )
                                }
                                .listRowBackground(Color.clear)
                                .listRowSeparator(.hidden)
                            }
                        }
                        .listStyle(.plain)
                        .scrollContentBackground(.hidden)
                    }
                }

                Button {
                    newMessagePresented = true
                } label: {
                    Image(systemName: "square.and.pencil")
                        .font(.system(size: 20))
                        .foregroundStyle(.white)
                        .frame(width: 56, height: 56)
                        .background(Theme.primaryGradient)
                        .clipShape(Circle())
                        .shadow(color: Color(red: 0.49, green: 0.23, blue: 0.93).opacity(0.6),
                                radius: 18, y: 12)
                }
                .padding(.trailing, 20)
                .padding(.bottom, 20)
            }
            .navigationTitle("Messages")
            .navigationDestination(for: UUID.self) { id in
                ConversationView(conversationId: id)
            }
            .sheet(isPresented: $newMessagePresented) {
                NewMessageComposeSheet(path: $path, isPresented: $newMessagePresented)
            }
            .refreshable {
                await appState.refreshConversationsFromServer()
            }
            .onChange(of: appState.lastMessagingError) { _, new in
                messagingErrorPresented = new != nil
            }
            .alert("Messaging", isPresented: $messagingErrorPresented) {
                Button("OK") {
                    appState.lastMessagingError = nil
                    messagingErrorPresented = false
                }
            } message: {
                Text(appState.lastMessagingError ?? "")
            }
        }
    }

    private var emptyState: some View {
        VStack(spacing: 8) {
            Image(systemName: "bubble.left.and.bubble.right")
                .font(.system(size: 36))
                .foregroundStyle(Theme.textFade)
            Text("No conversations").font(.system(size: 16, weight: .semibold))
            Text("New SMS to your business numbers will arrive here.")
                .font(.system(size: 13))
                .foregroundStyle(Theme.textDim)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 30)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

private struct ConversationRow: View {
    let convo: Conversation
    let business: Business?
    let contact: Contact?

    var body: some View {
        HStack(spacing: 12) {
            AvatarView(
                initials: contact?.initials ?? "·",
                gradientIndex: contact?.gradientIndex ?? 5,
                size: 44,
                businessDotColor: business?.tint.color
            )

            VStack(alignment: .leading, spacing: 2) {
                HStack {
                    Text(convo.displayName)
                        .font(.system(size: 15, weight: convo.unreadCount > 0 ? .bold : .semibold))
                        .foregroundStyle(.white)
                    Spacer()
                    Text(timeText)
                        .font(.system(size: 11))
                        .foregroundStyle(Theme.textFade)
                }
                Text(convo.lastMessagePreview)
                    .font(.system(size: 13, weight: convo.unreadCount > 0 ? .medium : .regular))
                    .foregroundStyle(convo.unreadCount > 0 ? Color.white.opacity(0.85) : Theme.textDim)
                    .lineLimit(1)
                if let biz = business {
                    BusinessChip(business: biz)
                        .padding(.top, 2)
                }
            }

            if convo.unreadCount > 0 {
                Circle()
                    .fill(Theme.primaryGradient)
                    .frame(width: 8, height: 8)
            }
        }
        .padding(.vertical, 4)
    }

    private var timeText: String {
        let mins = Int(Date().timeIntervalSince(convo.lastMessageTimestamp) / 60)
        if mins < 60 {
            let f = DateFormatter(); f.dateFormat = "h:mm a"
            return f.string(from: convo.lastMessageTimestamp)
        }
        if mins < 60 * 24 { return "Yesterday" }
        if mins < 60 * 24 * 7 {
            let f = DateFormatter(); f.dateFormat = "EEE"
            return f.string(from: convo.lastMessageTimestamp)
        }
        let f = DateFormatter(); f.dateFormat = "M/d"
        return f.string(from: convo.lastMessageTimestamp)
    }
}

private struct NewMessageComposeSheet: View {
    @Environment(AppState.self) private var appState
    @Binding var path: [UUID]
    @Binding var isPresented: Bool
    @State private var phone: String = ""
    @FocusState private var phoneFocused: Bool

    var body: some View {
        NavigationStack {
            ZStack {
                Theme.background.ignoresSafeArea()
                VStack(alignment: .leading, spacing: 16) {
                    Text("Start a text thread with any number. Messages send through your backend using the outbound business line and Twilio SMS number from Settings.")
                        .font(.system(size: 13))
                        .foregroundStyle(Theme.textDim)
                        .fixedSize(horizontal: false, vertical: true)

                    TextField("Phone number", text: $phone)
                        .textContentType(.telephoneNumber)
                        .keyboardType(.phonePad)
                        .focused($phoneFocused)
                        .font(.system(size: 16))
                        .padding(14)
                        .background(RoundedRectangle(cornerRadius: 12, style: .continuous).fill(Color.white.opacity(0.06)))

                    if let biz = appState.outboundBusiness {
                        HStack(spacing: 8) {
                            Text("Line:")
                                .font(.system(size: 12, weight: .semibold))
                                .foregroundStyle(Theme.textFade)
                            BusinessChip(business: biz, compact: true)
                        }
                    } else {
                        Text("Select an outbound business from the Keypad tab first.")
                            .font(.system(size: 12))
                            .foregroundStyle(Color(red: 0.94, green: 0.27, blue: 0.27))
                    }

                    Spacer()
                }
                .padding(20)
            }
            .navigationTitle("New message")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { isPresented = false }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Open") {
                        guard let bid = appState.outboundBusinessId else { return }
                        if let id = appState.findOrCreateConversation(peerRawNumber: phone, businessId: bid) {
                            path.append(id)
                        }
                        isPresented = false
                    }
                    .disabled(appState.outboundBusinessId == nil || phone.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }
            }
            .onAppear { phoneFocused = true }
        }
    }
}

#Preview {
    MessagesView()
        .environment(AppState.previewMock())
        .preferredColorScheme(.dark)
}
