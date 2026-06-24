//
//  RootTabView.swift
//  TwilioCallApp
//
//  5-tab navigation root: Recents, Contacts, Keypad, Messages, Businesses.
//  Settings is reachable from inside Businesses (and any future profile entry).
//

import SwiftUI

struct RootTabView: View {
    @Bindable var appState: AppState
    @Environment(\.scenePhase) private var scenePhase
    @State private var voiceErrorPresented = false
    @State private var selectedTab = 0

    var body: some View {
        TabView(selection: $selectedTab) {
            RecentsView()
                .tabItem { Label("Recents", systemImage: "clock") }
                .tag(0)

            ContactsView()
                .tabItem { Label("Contacts", systemImage: "person.crop.circle") }
                .tag(1)

            KeypadView()
                .tabItem { Label("Keypad", systemImage: "circle.grid.3x3.fill") }
                .tag(2)

            MessagesView()
                .tabItem { Label("Messages", systemImage: "message.fill") }
                .tag(3)

            BusinessesView()
                .tabItem { Label("Businesses", systemImage: "building.2.fill") }
                .tag(4)
        }
        .toolbarBackground(.visible, for: .tabBar)
        .toolbarBackground(Color(red: 0.04, green: 0.02, blue: 0.08).opacity(0.95), for: .tabBar)
        .onChange(of: scenePhase) { _, phase in
            if phase == .background {
                Task { await appState.pushUserDataToFirestore() }
            }
            if phase == .active {
                VoicePushCoordinator.shared.refreshRegistrationIfPossible()
                Task { await appState.refreshConversationsFromServer() }
                Task { await appState.refreshVoicemails() }
            }
        }
        .onChange(of: selectedTab) { _, new in
            if new == 3 {
                Task { await appState.refreshConversationsFromServer() }
            }
            if new == 0 {
                Task { await appState.refreshVoicemails() }
            }
        }
        .onChange(of: appState.lastVoiceError) { _, new in
            voiceErrorPresented = new != nil
        }
        .alert("Voice", isPresented: $voiceErrorPresented) {
            Button("OK") {
                appState.lastVoiceError = nil
                voiceErrorPresented = false
            }
        } message: {
            Text(appState.lastVoiceError ?? "")
        }
        .safeAreaInset(edge: .top) {
            if let msg = appState.lastVoiceError, !msg.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                HStack(spacing: 10) {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .foregroundStyle(.yellow)
                    Text(msg)
                        .font(.system(size: 12, weight: .medium))
                        .foregroundStyle(.white)
                        .lineLimit(3)
                    Spacer(minLength: 8)
                    Button("Dismiss") {
                        appState.lastVoiceError = nil
                        voiceErrorPresented = false
                    }
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundStyle(Theme.accentLavender)
                }
                .padding(.horizontal, 12)
                .padding(.vertical, 10)
                .background(Color.black.opacity(0.85))
                .overlay(
                    RoundedRectangle(cornerRadius: 10)
                        .stroke(Color.white.opacity(0.15), lineWidth: 1)
                )
                .clipShape(RoundedRectangle(cornerRadius: 10))
                .padding(.horizontal, 12)
                .padding(.top, 6)
            }
        }
    }
}

#Preview {
    RootTabView(appState: AppState.previewMock())
        .preferredColorScheme(.dark)
}
