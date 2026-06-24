//
//  ContentView.swift
//  TwilioCallApp
//
//  Replaced by RootTabView in Views/RootTabView.swift.
//  Kept as a compatibility shim so old previews still resolve.
//

import SwiftUI

/// Legacy entry point that simply forwards to the new tab root.
struct ContentView: View {
    @Environment(AppState.self) private var appState

    var body: some View {
        RootTabView(appState: appState)
    }
}

#Preview {
    ContentView()
        .environment(AppState.previewMock())
        .preferredColorScheme(.dark)
}
