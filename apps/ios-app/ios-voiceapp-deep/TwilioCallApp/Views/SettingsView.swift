//
//  SettingsView.swift
//  TwilioCallApp
//
//  Twilio account credentials, sync action, and global preferences.
//  Per-business settings live in BusinessDetailView.
//

import SwiftUI
import FirebaseAuth
import GoogleSignIn

struct SettingsView: View {
    @Environment(AppState.self) private var appState
    @State private var notificationsOn = true
    @State private var greetingReminderOn = true
    @State private var transcriptionOn = false
    @State private var twilioNumbersSheetPresented = false
    @State private var contactDiagnostics: FirestoreHistoryService.ContactDiagnosticsSnapshot?
    @State private var diagnosticsLoading = false

    var body: some View {
        @Bindable var state = appState
        ZStack {
            Theme.background.ignoresSafeArea()
            ScrollView {
                VStack(spacing: 18) {
                    section("Account") {
                        row(icon: "person.fill",
                            iconBg: LinearGradient(colors: [Color(red: 0.02, green: 0.71, blue: 0.83), Color(red: 0.49, green: 0.23, blue: 0.93)], startPoint: .topLeading, endPoint: .bottomTrailing),
                            label: "Primary business",
                            value: "\(appState.businesses.first?.name ?? "Acme Dental") ›")
                        divider
                        row(icon: "building.2.fill",
                            iconBg: LinearGradient(colors: [Color(red: 0.93, green: 0.28, blue: 0.60), Color(red: 0.96, green: 0.62, blue: 0.04)], startPoint: .topLeading, endPoint: .bottomTrailing),
                            label: "Businesses & Numbers",
                            value: "\(appState.businesses.count) lines ›")
                    }
                    section("Twilio Connection") {
                        row(icon: "lock.fill",
                            iconBg: LinearGradient(colors: [Color(red: 0.94, green: 0.27, blue: 0.27), Color(red: 0.93, green: 0.28, blue: 0.60)], startPoint: .topLeading, endPoint: .bottomTrailing),
                            label: "Account SID",
                            value: "\(appState.twilioAccountSidMasked) ›")
                        divider
                        row(icon: "checkmark",
                            iconBg: LinearGradient(colors: [Color(red: 0.13, green: 0.77, blue: 0.37), Color(red: 0.52, green: 0.80, blue: 0.09)], startPoint: .topLeading, endPoint: .bottomTrailing),
                            label: "Voice token",
                            value: appState.effectiveVoiceAccessTokenURL.isEmpty ? "Not set ›" : "Configured ›",
                            valueColor: appState.effectiveVoiceAccessTokenURL.isEmpty
                                ? Color(red: 0.94, green: 0.27, blue: 0.27)
                                : Color(red: 0.13, green: 0.77, blue: 0.37))
                        divider
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Access token URL")
                                .font(.system(size: 12, weight: .semibold))
                                .foregroundStyle(Theme.textFade)
                            TextField("Leave empty to use app default (HTTPS)", text: tokenURLBinding)
                                .textContentType(.URL)
                                .keyboardType(.URL)
                                .autocorrectionDisabled()
                                .textInputAutocapitalization(.never)
                                .font(.system(size: 14))
                                .padding(12)
                                .background(RoundedRectangle(cornerRadius: 10, style: .continuous).fill(Color.white.opacity(0.06)))
                            Text(tokenURLFootnote)
                                .font(.system(size: 11))
                                .foregroundStyle(Theme.textDim)
                        }
                        .padding(.horizontal, 14)
                        .padding(.vertical, 12)
                        divider
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Voice client identity")
                                .font(.system(size: 12, weight: .semibold))
                                .foregroundStyle(Theme.textFade)
                            Text(appState.voiceClientIdentity.isEmpty ? "— (fetching from server…)" : appState.voiceClientIdentity)
                                .font(.system(size: 14, design: .monospaced))
                                .foregroundStyle(Theme.textPrimary)
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .padding(12)
                                .background(RoundedRectangle(cornerRadius: 10, style: .continuous).fill(Color.white.opacity(0.06)))
                            Text("Provided by your backend: GET /api/voice-session (preferred) or GET /token without ?identity=. Set TWILIO_VOICE_CLIENT_IDENTITY on the server so PSTN <Dial><Client> matches. Twilio number Voice URL: POST …/webhook/voice-incoming (not the TwiML App URL).")
                                .font(.system(size: 11))
                                .foregroundStyle(Theme.textDim)
                        }
                        .padding(.horizontal, 14)
                        .padding(.vertical, 12)
                        divider
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Twilio SMS number (E.164)")
                                .font(.system(size: 12, weight: .semibold))
                                .foregroundStyle(Theme.textFade)
                            TextField("+15551234567", text: messagingTwilioLineBinding)
                                .textContentType(.telephoneNumber)
                                .keyboardType(.phonePad)
                                .font(.system(size: 14))
                                .padding(12)
                                .background(RoundedRectangle(cornerRadius: 10, style: .continuous).fill(Color.white.opacity(0.06)))
                            Text("Your Twilio SMS number (E.164). Optional for send: leave empty and the server uses its default From (same as curl with only to + body). If set, it is sent as from and used to match inbound history.")
                                .font(.system(size: 11))
                                .foregroundStyle(Theme.textDim)
                        }
                        .padding(.horizontal, 14)
                        .padding(.vertical, 12)
                        divider
                        row(icon: "checkmark",
                            iconBg: LinearGradient(colors: [Color(red: 0.13, green: 0.77, blue: 0.37), Color(red: 0.52, green: 0.80, blue: 0.09)], startPoint: .topLeading, endPoint: .bottomTrailing),
                            label: "Last token fetch",
                            value: appState.twilioConnected ? "OK" : "—",
                            valueColor: appState.twilioConnected
                                ? Color(red: 0.13, green: 0.77, blue: 0.37)
                                : Theme.textFade)
                        divider
                        row(icon: "icloud.fill",
                            iconBg: LinearGradient(colors: [Color(red: 0.20, green: 0.56, blue: 0.98), Color(red: 0.02, green: 0.71, blue: 0.83)], startPoint: .topLeading, endPoint: .bottomTrailing),
                            label: "History sync (Firestore)",
                            value: FirebaseBootstrap.hasConfigPlist ? "Configured" : "Add GoogleService-Info.plist",
                            valueColor: FirebaseBootstrap.hasConfigPlist
                                ? Color(red: 0.13, green: 0.77, blue: 0.37)
                                : Color(red: 0.96, green: 0.62, blue: 0.04))
                        divider
                        Button {
                            Task {
                                await appState.syncTwilioPhoneNumbersFromAPI()
                                await MainActor.run { twilioNumbersSheetPresented = true }
                            }
                        } label: {
                            row(icon: "arrow.triangle.2.circlepath",
                                iconBg: LinearGradient(colors: [Color(red: 0.49, green: 0.23, blue: 0.93), Color(red: 0.65, green: 0.55, blue: 0.98)], startPoint: .topLeading, endPoint: .bottomTrailing),
                                label: "Sync numbers now",
                                value: state.twilioNumbersSyncInProgress
                                    ? "…"
                                    : (state.twilioFetchedNumbers.isEmpty ? "Tap to fetch" : "\(state.twilioFetchedNumbers.count) loaded"))
                        }
                        .buttonStyle(.plain)
                        .disabled(state.twilioNumbersSyncInProgress)
                    }
                    incomingCallDiagnosticsSection
                    section("Contact Sync Diagnostics") {
                        VStack(alignment: .leading, spacing: 10) {
                            row(icon: "scope",
                                iconBg: LinearGradient(colors: [Color(red: 0.49, green: 0.23, blue: 0.93), Color(red: 0.20, green: 0.56, blue: 0.98)], startPoint: .topLeading, endPoint: .bottomTrailing),
                                label: "Active namespace",
                                value: contactDiagnostics?.activeNamespace ?? "—")
                            divider
                            row(icon: "square.and.arrow.down",
                                iconBg: LinearGradient(colors: [Color(red: 0.02, green: 0.71, blue: 0.83), Color(red: 0.13, green: 0.77, blue: 0.37)], startPoint: .topLeading, endPoint: .bottomTrailing),
                                label: "Last write",
                                value: diagnosticsLine(status: contactDiagnostics?.lastWriteStatus, at: contactDiagnostics?.lastWriteAt))
                            divider
                            row(icon: "eye.fill",
                                iconBg: LinearGradient(colors: [Color(red: 0.96, green: 0.62, blue: 0.04), Color(red: 0.93, green: 0.28, blue: 0.60)], startPoint: .topLeading, endPoint: .bottomTrailing),
                                label: "Last read",
                                value: diagnosticsLine(status: contactDiagnostics?.lastReadStatus, at: contactDiagnostics?.lastReadAt))
                            divider
                            VStack(alignment: .leading, spacing: 6) {
                                Text("Namespace contact counts")
                                    .font(.system(size: 12, weight: .semibold))
                                    .foregroundStyle(Theme.textFade)
                                if let rows = contactDiagnostics?.namespaceCounts, !rows.isEmpty {
                                    ForEach(rows) { row in
                                        HStack {
                                            Text(row.namespace)
                                                .font(.system(size: 12, design: .monospaced))
                                                .foregroundStyle(Theme.textPrimary)
                                                .lineLimit(1)
                                            Spacer()
                                            if let err = row.error, !err.isEmpty {
                                                Text("ERR")
                                                    .font(.system(size: 11, weight: .semibold))
                                                    .foregroundStyle(Color(red: 1, green: 0.45, blue: 0.45))
                                                Text(err)
                                                    .font(.system(size: 11))
                                                    .foregroundStyle(Theme.textDim)
                                                    .lineLimit(1)
                                            } else {
                                                Text("\(row.count)")
                                                    .font(.system(size: 12, weight: .semibold))
                                                    .foregroundStyle(Theme.textPrimary)
                                            }
                                        }
                                    }
                                } else {
                                    Text("No diagnostics yet. Tap refresh.")
                                        .font(.system(size: 12))
                                        .foregroundStyle(Theme.textDim)
                                }
                            }
                            .padding(.horizontal, 14)
                            .padding(.bottom, 8)
                            divider
                            Button {
                                Task { await refreshContactDiagnostics() }
                            } label: {
                                row(icon: "arrow.clockwise",
                                    iconBg: LinearGradient(colors: [Color(red: 0.20, green: 0.56, blue: 0.98), Color(red: 0.02, green: 0.71, blue: 0.83)], startPoint: .topLeading, endPoint: .bottomTrailing),
                                    label: "Refresh diagnostics",
                                    value: diagnosticsLoading ? "Loading…" : "Run now")
                            }
                            .buttonStyle(.plain)
                            .disabled(diagnosticsLoading)
                        }
                    }
                    section("Preferences") {
                        toggleRow(icon: "bell.fill", label: "Notifications", isOn: $notificationsOn)
                        divider
                        toggleRow(icon: "message.fill", label: "Show greeting reminder", isOn: $greetingReminderOn)
                        divider
                        toggleRow(icon: "ear.fill", label: "Voicemail transcription", isOn: $transcriptionOn)
                    }
                    section("Account") {
                        Button {
                            do {
                                VoicePushCoordinator.shared.unregisterIfPossible()
                                try Auth.auth().signOut()
                                GIDSignIn.sharedInstance.signOut()
                            } catch {
                                appState.lastVoiceError = "Sign out failed: \(error.localizedDescription)"
                            }
                        } label: {
                            row(
                                icon: "rectangle.portrait.and.arrow.right",
                                iconBg: LinearGradient(
                                    colors: [Color(red: 0.93, green: 0.28, blue: 0.60), Color(red: 0.94, green: 0.27, blue: 0.27)],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                ),
                                label: "Sign out",
                                value: "Tap to sign out"
                            )
                        }
                        .buttonStyle(.plain)
                    }
                    Spacer(minLength: 30)
                }
                .padding(.bottom, 30)
            }
        }
        .navigationTitle("Settings")
        .navigationBarTitleDisplayMode(.large)
        .sheet(isPresented: $twilioNumbersSheetPresented) {
            TwilioNumbersListSheet()
                .environment(appState)
                .preferredColorScheme(.dark)
        }
        .task {
            await refreshContactDiagnostics()
        }
    }

    @ViewBuilder
    private var incomingCallDiagnosticsSection: some View {
        @Bindable var voip = VoiceRegistrationDiagnostics.shared
        section("Incoming calls (VoIP)") {
            VStack(alignment: .leading, spacing: 10) {
                row(icon: "antenna.radiowaves.left.and.right",
                    iconBg: LinearGradient(colors: [Color(red: 0.96, green: 0.62, blue: 0.04), Color(red: 0.93, green: 0.28, blue: 0.60)], startPoint: .topLeading, endPoint: .bottomTrailing),
                    label: "APNs environment (this build)",
                    value: voip.apnsEnvironmentLabel,
                    valueColor: Theme.textPrimary)
                divider
                row(icon: "key.fill",
                    iconBg: LinearGradient(colors: [Color(red: 0.49, green: 0.23, blue: 0.93), Color(red: 0.20, green: 0.56, blue: 0.98)], startPoint: .topLeading, endPoint: .bottomTrailing),
                    label: "VoIP token",
                    value: voip.voipTokenLength > 0 ? "\(voip.voipTokenLength) bytes · \(voip.voipTokenHexPrefix)…" : "Not received",
                    valueColor: voip.voipTokenLength > 0 ? Color(red: 0.13, green: 0.77, blue: 0.37) : Color(red: 0.94, green: 0.27, blue: 0.27))
                divider
                row(icon: "person.crop.circle.badge.checkmark",
                    iconBg: LinearGradient(colors: [Color(red: 0.13, green: 0.77, blue: 0.37), Color(red: 0.52, green: 0.80, blue: 0.09)], startPoint: .topLeading, endPoint: .bottomTrailing),
                    label: "Twilio register",
                    value: voip.lastRegisterStatus,
                    valueColor: voip.lastRegisterStatus.contains("OK")
                        ? Color(red: 0.13, green: 0.77, blue: 0.37)
                        : (voip.lastRegisterStatus.contains("failed") || voip.lastRegisterStatus.contains("not configured")
                            ? Color(red: 0.94, green: 0.27, blue: 0.27)
                            : Theme.textFade))
                if let err = voip.lastRegisterError, !err.isEmpty {
                    divider
                    Text(err)
                        .font(.system(size: 11))
                        .foregroundStyle(Color(red: 0.94, green: 0.27, blue: 0.27))
                        .padding(.horizontal, 14)
                        .padding(.bottom, 4)
                }
                divider
                row(icon: "lock.shield",
                    iconBg: LinearGradient(colors: [Color(red: 0.20, green: 0.56, blue: 0.98), Color(red: 0.02, green: 0.71, blue: 0.83)], startPoint: .topLeading, endPoint: .bottomTrailing),
                    label: "JWT push credential",
                    value: voip.jwtIncludesPushCredential ? "Present in token" : "Missing — server env",
                    valueColor: voip.jwtIncludesPushCredential
                        ? Color(red: 0.13, green: 0.77, blue: 0.37)
                        : Color(red: 0.94, green: 0.27, blue: 0.27))
                if let pushAt = voip.lastVoipPushAt {
                    divider
                    row(icon: "bell.badge",
                        iconBg: LinearGradient(colors: [Color(red: 0.02, green: 0.71, blue: 0.83), Color(red: 0.49, green: 0.23, blue: 0.93)], startPoint: .topLeading, endPoint: .bottomTrailing),
                        label: "Last VoIP push",
                        value: pushAt.formatted(date: .omitted, time: .shortened),
                        valueColor: Theme.textPrimary)
                }
                divider
                Text(voip.twilio52134Hint)
                    .font(.system(size: 11))
                    .foregroundStyle(Theme.textDim)
                    .padding(.horizontal, 14)
                    .padding(.bottom, 6)
                divider
                Button {
                    VoicePushCoordinator.shared.reregisterNow()
                } label: {
                    row(icon: "arrow.clockwise",
                        iconBg: LinearGradient(colors: [Color(red: 0.20, green: 0.56, blue: 0.98), Color(red: 0.02, green: 0.71, blue: 0.83)], startPoint: .topLeading, endPoint: .bottomTrailing),
                        label: "Re-register VoIP with Twilio",
                        value: "Tap after server credential fix")
                }
                .buttonStyle(.plain)
                divider
                Button {
                    appState.testIncomingCallUI()
                } label: {
                    row(icon: "phone.arrow.down.left",
                        iconBg: LinearGradient(colors: [Color(red: 0.13, green: 0.77, blue: 0.37), Color(red: 0.02, green: 0.71, blue: 0.83)], startPoint: .topLeading, endPoint: .bottomTrailing),
                        label: "Test incoming screen (UI only)",
                        value: "No Twilio push needed")
                }
                .buttonStyle(.plain)
            }
        }
    }

    @ViewBuilder
    private func section<Content: View>(_ title: String, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            SectionTitle(text: title)
                .padding(.horizontal, 22)
            VStack(spacing: 0) {
                content()
            }
            .padding(.vertical, 4)
            .glassCard()
            .padding(.horizontal, 16)
        }
    }

    private func row(icon: String,
                     iconBg: LinearGradient,
                     label: String,
                     value: String,
                     valueColor: Color = Theme.textFade) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.system(size: 13))
                .foregroundStyle(.white)
                .frame(width: 30, height: 30)
                .background(RoundedRectangle(cornerRadius: 8, style: .continuous).fill(iconBg))
            Text(label).font(.system(size: 14))
            Spacer()
            Text(value).font(.system(size: 13)).foregroundStyle(valueColor)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 12)
    }

    private func toggleRow(icon: String, label: String, isOn: Binding<Bool>) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.system(size: 13))
                .foregroundStyle(.white)
                .frame(width: 30, height: 30)
                .background(RoundedRectangle(cornerRadius: 8, style: .continuous).fill(Theme.primaryGradient))
            Text(label).font(.system(size: 14))
            Spacer()
            Toggle("", isOn: isOn)
                .labelsHidden()
                .tint(Theme.accentLavender)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 12)
    }

    private var divider: some View {
        Rectangle().fill(Color.white.opacity(0.05)).frame(height: 1)
    }

    private var tokenURLFootnote: String {
        let active = appState.effectiveVoiceAccessTokenURL
        let bundled = VoiceConfiguration.bundledTokenURL
        if bundled.isEmpty {
            return "Set VOICE_TOKEN_BASE_URL to your hosted https://…/token (same host serves /api/voice-session). Optional override above is for QA. Local Simulator: LocalDev.xcconfig.example."
        }
        return "Built-in: \(bundled). Active: \(active.isEmpty ? "—" : active). Clear the field to use the built-in URL on every device."
    }

    private var tokenURLBinding: Binding<String> {
        Binding(
            get: { appState.voiceTokenURLOverride },
            set: { appState.setVoiceTokenURLOverride($0) }
        )
    }

    private var messagingTwilioLineBinding: Binding<String> {
        Binding(
            get: { appState.messagingTwilioLineE164 },
            set: { appState.messagingTwilioLineE164 = $0 }
        )
    }

    private func refreshContactDiagnostics() async {
        await MainActor.run { diagnosticsLoading = true }
        let snapshot = await FirestoreHistoryService.fetchContactDiagnostics()
        await MainActor.run {
            contactDiagnostics = snapshot
            diagnosticsLoading = false
        }
    }

    private func diagnosticsLine(status: String?, at: Date?) -> String {
        let s = (status ?? "—").trimmingCharacters(in: .whitespacesAndNewlines)
        let t = at.map { Self.diagnosticsDateFormatter.string(from: $0) } ?? "no-time"
        return "\(s.isEmpty ? "—" : s) @ \(t)"
    }

    private static let diagnosticsDateFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd HH:mm:ss"
        return f
    }()
}

private struct TwilioNumbersListSheet: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(AppState.self) private var appState

    var body: some View {
        NavigationStack {
            List {
                if let err = appState.lastTwilioNumbersError, !err.isEmpty {
                    Section {
                        Text(err)
                            .font(.system(size: 14))
                            .foregroundStyle(Color(red: 1, green: 0.45, blue: 0.45))
                    }
                } else if appState.twilioFetchedNumbers.isEmpty {
                    Section {
                        Text("No numbers yet. The server must expose GET /api/twilio/phone-numbers with TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN, and accept Firebase ID token auth from the app.")
                            .font(.system(size: 14))
                            .foregroundStyle(Theme.textDim)
                    }
                }
                if !appState.twilioFetchedNumbers.isEmpty {
                    Section {
                        ForEach(appState.twilioFetchedNumbers) { n in
                        VStack(alignment: .leading, spacing: 6) {
                            Text(n.phoneNumber)
                                .font(.system(size: 16, weight: .semibold))
                                .foregroundStyle(.white)
                            if let name = n.friendlyName, !name.isEmpty {
                                Text(name)
                                    .font(.system(size: 13))
                                    .foregroundStyle(Theme.textDim)
                            }
                            Text(capabilitiesLine(n))
                                .font(.system(size: 12))
                                .foregroundStyle(Theme.textFade)
                        }
                        .listRowBackground(Color.white.opacity(0.04))
                        .padding(.vertical, 4)
                        }
                    }
                }
            }
            .scrollContentBackground(.hidden)
            .background(Theme.background)
            .navigationTitle("Twilio numbers")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Done") { dismiss() }
                }
            }
        }
    }

    private func capabilitiesLine(_ n: TwilioIncomingNumber) -> String {
        [n.voice ? "Voice" : nil, n.sms ? "SMS" : nil, n.mms ? "MMS" : nil]
            .compactMap { $0 }
            .joined(separator: " · ")
    }
}

#Preview {
    NavigationStack {
        SettingsView()
            .environment(AppState.previewMock())
            .preferredColorScheme(.dark)
    }
}
