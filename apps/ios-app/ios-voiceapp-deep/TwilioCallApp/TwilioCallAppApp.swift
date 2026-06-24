//
//  TwilioCallAppApp.swift
//  TwilioCallApp
//
//  Created by Deep Chand on 01/05/26.
//

import SwiftUI
import FirebaseAuth

@main
struct TwilioCallAppApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) private var appDelegate
    @State private var appState: AppState
    @StateObject private var session = FirebaseSessionManager()

    init() {
        FirebaseBootstrap.configureIfNeeded()
        TwilioVoiceSDKConfigurator.configureAtLaunch()
        let initialState = AppState(service: MockTwilioService())
        _appState = State(initialValue: initialState)
        // Ensure incoming push handling has AppState bound as early as possible.
        VoicePushCoordinator.shared.bindAppState(initialState)
        VoicePushCoordinator.shared.ensurePushRegistryAtLaunch()
    }

    var body: some Scene {
        WindowGroup {
            AppRootView(appState: appState, session: session)
        }
    }
}

/// Hosts auth + tabs and presents call UI above everything (CallKit rings, this shows Accept/Decline).
private struct AppRootView: View {
    @Bindable var appState: AppState
    @ObservedObject var session: FirebaseSessionManager

    var body: some View {
        Group {
            if FirebaseBootstrap.hasConfigPlist, !session.isAuthenticated {
                LoginView(session: session)
            } else {
                RootTabView(appState: appState)
                    .task {
                        guard session.isAuthenticated || !FirebaseBootstrap.hasConfigPlist else { return }
                        await appState.bootstrap()
                    }
            }
        }
        .preferredColorScheme(.dark)
        .tint(Theme.accentLavender)
        .environment(appState)
        .task {
            VoicePushCoordinator.shared.startIfNeeded(appState: appState)
            VoiceCallKitCoordinator.shared.bind(appState: appState, voiceBridge: appState.voiceBridge)
        }
        .onChange(of: session.user?.uid) { _, newUid in
            if newUid != nil || !FirebaseBootstrap.hasConfigPlist {
                Task { await appState.bootstrap() }
            }
        }
        .fullScreenCover(item: $appState.incomingCall) { ctx in
            IncomingCallView(context: ctx)
                .environment(appState)
        }
        .fullScreenCover(item: $appState.activeCall, onDismiss: {
            appState.activeCallUIDismissed()
        }) { ctx in
            ActiveCallView(context: ctx)
                .environment(appState)
        }
    }
}
