//
//  RecentsView.swift
//  TwilioCallApp
//
//  Call history list plus Recordings (PSTN voicemail log + Twilio account recordings from the hosted server).
//

import AVFoundation
import OSLog
import SwiftUI

private enum RecentsSegment: String, CaseIterable, Identifiable {
    case calls = "Calls"
    case missed = "Missed"
    case recordings = "Recordings"
    var id: String { rawValue }
}

struct RecentsView: View {
    @Environment(AppState.self) private var appState
    @State private var segment: RecentsSegment = .calls
    @State private var voicemailAlertPresented = false
    @State private var path = NavigationPath()

    var body: some View {
        @Bindable var state = appState
        NavigationStack(path: $path) {
            ZStack {
                Theme.background.ignoresSafeArea()
                VStack(spacing: 0) {
                    Picker("Section", selection: $segment) {
                        ForEach(RecentsSegment.allCases) { s in
                            Text(s.rawValue).tag(s)
                        }
                    }
                    .pickerStyle(.segmented)
                    .padding(.horizontal, 16)
                    .padding(.top, 8)
                    .padding(.bottom, 4)

                    BusinessFilterStrip(businesses: appState.businesses,
                                        selection: $state.selectedBusinessFilter)
                        .padding(.top, 6)

                    switch segment {
                    case .calls:
                        callsContent
                    case .missed:
                        missedCallsContent
                    case .recordings:
                        recordingsContent
                    }
                }
            }
            .navigationTitle("Recents")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    if segment == .calls || segment == .missed {
                        if let id = appState.selectedBusinessFilter,
                           let biz = appState.business(id) {
                            BusinessChip(business: biz)
                        } else {
                            Text("All Businesses")
                                .font(.system(size: 12, weight: .medium))
                                .foregroundStyle(Theme.accentLavender)
                        }
                    } else {
                        Button {
                            Task { await appState.refreshVoicemails() }
                        } label: {
                            Image(systemName: "arrow.clockwise")
                                .font(.system(size: 14, weight: .semibold))
                                .foregroundStyle(Theme.accentLavender)
                        }
                    }
                }
            }
            .refreshable {
                if segment == .recordings {
                    await appState.refreshVoicemails()
                }
            }
            .onChange(of: appState.lastVoicemailError) { _, new in
                voicemailAlertPresented = new != nil
            }
            .alert("Recordings", isPresented: $voicemailAlertPresented) {
                Button("OK") {
                    appState.lastVoicemailError = nil
                    voicemailAlertPresented = false
                }
            } message: {
                Text(appState.lastVoicemailError ?? "")
            }
            .navigationDestination(for: CallRecord.self) { call in
                if let contact = appState.contact(call.contactId) {
                    ContactDetailView(contact: contact, path: $path)
                } else {
                    RecentNumberDetailView(call: call, business: appState.business(call.businessId), path: $path)
                }
            }
            .navigationDestination(for: UUID.self) { id in
                ConversationView(conversationId: id)
            }
        }
    }

    @ViewBuilder
    private var callsContent: some View {
        if appState.filteredCalls.isEmpty {
            callsEmptyState
        } else {
            List {
                ForEach(appState.filteredCalls) { call in
                    CallRow(call: call,
                            business: appState.business(call.businessId),
                            contact: appState.contact(call.contactId),
                            onAvatarTap: { path.append(call) })
                        .listRowBackground(Color.clear)
                        .listRowSeparator(.hidden)
                }
            }
            .listStyle(.plain)
            .scrollContentBackground(.hidden)
        }
    }

    @ViewBuilder
    private var missedCallsContent: some View {
        if appState.filteredMissedCalls.isEmpty {
            missedCallsEmptyState
        } else {
            List {
                ForEach(appState.filteredMissedCalls) { call in
                    CallRow(call: call,
                            business: appState.business(call.businessId),
                            contact: appState.contact(call.contactId),
                            onAvatarTap: { path.append(call) })
                        .listRowBackground(Color.clear)
                        .listRowSeparator(.hidden)
                }
            }
            .listStyle(.plain)
            .scrollContentBackground(.hidden)
        }
    }

    @ViewBuilder
    private var recordingsContent: some View {
        if appState.filteredVoicemails.isEmpty {
            recordingsEmptyState
        } else {
            List {
                ForEach(appState.filteredVoicemails) { vm in
                    VoicemailRowView(item: vm)
                        .listRowBackground(Color.clear)
                        .listRowSeparator(.hidden)
                }
            }
            .listStyle(.plain)
            .scrollContentBackground(.hidden)
        }
    }

    private var callsEmptyState: some View {
        VStack(spacing: 8) {
            Image(systemName: "phone.arrow.up.right")
                .font(.system(size: 36))
                .foregroundStyle(Theme.textFade)
            Text("No recent calls")
                .font(.system(size: 16, weight: .semibold))
            Text("Calls in and out of all your business lines show up here.")
                .font(.system(size: 13))
                .foregroundStyle(Theme.textDim)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 30)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private var missedCallsEmptyState: some View {
        VStack(spacing: 8) {
            Image(systemName: "phone.badge.waveform.fill")
                .font(.system(size: 36))
                .foregroundStyle(Theme.textFade)
            Text("No missed calls")
                .font(.system(size: 16, weight: .semibold))
            Text("Calls you did not answer appear here. The business filter above applies to this list too.")
                .font(.system(size: 13))
                .foregroundStyle(Theme.textDim)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 30)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private var recordingsEmptyState: some View {
        VStack(spacing: 8) {
            Image(systemName: "recordingtape")
                .font(.system(size: 36))
                .foregroundStyle(Theme.textFade)
            Text("No recordings yet")
                .font(.system(size: 16, weight: .semibold))
            Text("Voicemails from your line and other Twilio call recordings show here after your server merges them. Only the last 30 days are listed in the app; older items stay in Twilio.")
                .font(.system(size: 13))
                .foregroundStyle(Theme.textDim)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 24)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

private struct VoicemailRowView: View {
    let item: VoicemailItem
    @Environment(AppState.self) private var appState
    @State private var player: AVPlayer?
    @State private var isPlaying = false
    @State private var endObserver: NSObjectProtocol?
    @State private var failObserver: NSObjectProtocol?
    @State private var localPlaybackFile: URL?
    @State private var downloadTask: Task<Void, Never>?
    @State private var playbackErrorMessage: String?

    private static let playbackLog = Logger(subsystem: Bundle.main.bundleIdentifier ?? "TwilioCallApp", category: "VoicemailPlayback")

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .top, spacing: 12) {
                Image(systemName: "waveform.circle.fill")
                    .font(.system(size: 36))
                    .foregroundStyle(Theme.accentLavender)

                VStack(alignment: .leading, spacing: 4) {
                    Text(item.displayCaller)
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundStyle(.white)
                    if !item.to.isEmpty {
                        Text("To \(item.to)")
                            .font(.system(size: 11))
                            .foregroundStyle(Theme.textFade)
                    }
                    if let d = item.durationSeconds, d > 0 {
                        Text("\(d)s")
                            .font(.system(size: 11))
                            .foregroundStyle(Theme.textFade)
                    }
                    if let kind = item.recordingKindCaption {
                        Text(kind)
                            .font(.system(size: 10))
                            .foregroundStyle(Theme.textFade.opacity(0.9))
                    }
                }
                Spacer(minLength: 8)
                Button {
                    togglePlayback()
                } label: {
                    Image(systemName: isPlaying ? "stop.circle.fill" : "play.circle.fill")
                        .font(.system(size: 34))
                        .foregroundStyle(Theme.accentLavender)
                }
                .buttonStyle(.plain)
            }

            if item.hasTranscription {
                Text(item.transcription)
                    .font(.system(size: 14))
                    .foregroundStyle(Color.white.opacity(0.92))
                    .fixedSize(horizontal: false, vertical: true)
            } else if item.transcriptionStatus.lowercased() == "failed" {
                Text("Transcription unavailable.")
                    .font(.system(size: 13))
                    .foregroundStyle(Theme.textFade)
            } else if item.transcriptionStatus.lowercased() == "absent" {
                Text("No audio captured for this leg.")
                    .font(.system(size: 13))
                    .foregroundStyle(Theme.textFade)
            } else {
                Text("No transcript on file.")
                    .font(.system(size: 13))
                    .foregroundStyle(Theme.textFade)
            }

            Text(timeText)
                .font(.system(size: 11))
                .foregroundStyle(Theme.textFade)
        }
        .padding(.vertical, 6)
        .alert("Couldn’t play recording", isPresented: Binding(
            get: { playbackErrorMessage != nil },
            set: { if !$0 { playbackErrorMessage = nil } }
        )) {
            Button("OK") { playbackErrorMessage = nil }
        } message: {
            Text(playbackErrorMessage ?? "")
        }
        .onDisappear {
            stopAndCleanup()
        }
    }

    private var timeText: String {
        let f = DateFormatter()
        f.dateStyle = .medium
        f.timeStyle = .short
        return f.string(from: item.createdAt)
    }

    private func togglePlayback() {
        if isPlaying {
            downloadTask?.cancel()
            downloadTask = nil
            stopAndCleanup()
            return
        }
        playbackErrorMessage = nil
        guard let base = appState.apiBaseURL,
              let url = VoicemailAPIClient.audioStreamURL(baseURL: base, recordingSid: item.recordingSid)
        else {
            playbackErrorMessage = "Set your voice token server in Settings so the app can load recordings."
            return
        }

        let sid = item.recordingSid
        let bearerRaw = appState.messagingBearerToken.trimmingCharacters(in: .whitespacesAndNewlines)

        downloadTask?.cancel()
        downloadTask = Task { @MainActor in
            await downloadAndPlayVoicemail(
                remoteURL: url,
                recordingSid: sid,
                bearerRaw: bearerRaw,
                firebaseIDToken: nil
            )
        }
    }

    /// Loads MP3 with `URLSession` (Bearer) into a temp file — reliable on Simulator; `AVURLAsset` + headers often fails silently.
    private func downloadAndPlayVoicemail(
        remoteURL: URL,
        recordingSid: String,
        bearerRaw: String,
        firebaseIDToken: String?
    ) async {
        playbackErrorMessage = nil
        VoiceAudioSession.activateForMediaPlayback()

        var req = URLRequest(url: remoteURL)
        req.httpMethod = "GET"
        if !bearerRaw.isEmpty {
            var tok = bearerRaw
            if tok.lowercased().hasPrefix("bearer ") {
                tok = String(tok.dropFirst(7)).trimmingCharacters(in: .whitespacesAndNewlines)
            }
            req.setValue("Bearer \(tok)", forHTTPHeaderField: "Authorization")
        }
        if let idToken = firebaseIDToken?.trimmingCharacters(in: .whitespacesAndNewlines), !idToken.isEmpty {
            req.setValue(idToken, forHTTPHeaderField: "X-Firebase-ID-Token")
        }

        let data: Data
        let status: Int
        do {
            let (d, resp) = try await URLSession.shared.data(for: req)
            guard let http = resp as? HTTPURLResponse else {
                Self.playbackLog.error("Voicemail download: not HTTP sid=\(recordingSid, privacy: .public)")
                playbackErrorMessage = "The server didn’t return a valid HTTP response."
                return
            }
            status = http.statusCode
            data = d
        } catch {
            Self.playbackLog.error("Voicemail download failed sid=\(recordingSid, privacy: .public): \(error.localizedDescription, privacy: .public)")
            playbackErrorMessage = "Couldn’t download the recording. \(error.localizedDescription)"
            return
        }

        guard !Task.isCancelled else { return }

        guard (200 ..< 300).contains(status) else {
            let snippet = String(data: data.prefix(120), encoding: .utf8) ?? ""
            Self.playbackLog.error("Voicemail download HTTP \(status) sid=\(recordingSid, privacy: .public) body=\(snippet, privacy: .public)")
            switch status {
            case 401, 403:
                playbackErrorMessage = "Not authorized to play this recording (HTTP \(status)). Check your API token in Settings."
            case 404:
                playbackErrorMessage = "Recording audio not found (404). Your server should expose GET /api/voicemails/{sid}/media (and proxy to Twilio)."
            default:
                playbackErrorMessage = "Couldn’t load the recording (HTTP \(status))."
            }
            return
        }

        if data.count < 500, let s = String(data: data, encoding: .utf8), s.contains("html") || s.contains("404") {
            Self.playbackLog.error("Voicemail download: server returned HTML/error, not MP3 sid=\(recordingSid, privacy: .public)")
            playbackErrorMessage = "The server returned a web page instead of audio. Check the voicemail audio URL on your backend."
            return
        }

        let safeSid = recordingSid.replacingOccurrences(of: "/", with: "_")
        let tmp = FileManager.default.temporaryDirectory.appendingPathComponent("voicemail-\(safeSid)-\(UUID().uuidString).mp3")
        do {
            try data.write(to: tmp, options: .atomic)
        } catch {
            Self.playbackLog.error("Voicemail temp write failed: \(error.localizedDescription, privacy: .public)")
            playbackErrorMessage = "Couldn’t save audio for playback on this device."
            return
        }

        guard !Task.isCancelled else {
            try? FileManager.default.removeItem(at: tmp)
            return
        }

        localPlaybackFile = tmp
        let playerItem = AVPlayerItem(url: tmp)
        let p = AVPlayer(playerItem: playerItem)
        p.play()
        player = p
        isPlaying = true

        endObserver = NotificationCenter.default.addObserver(
            forName: .AVPlayerItemDidPlayToEndTime,
            object: playerItem,
            queue: .main
        ) { _ in
            stopAndCleanup()
        }

        failObserver = NotificationCenter.default.addObserver(
            forName: .AVPlayerItemFailedToPlayToEndTime,
            object: playerItem,
            queue: .main
        ) { note in
            let err = (note.userInfo?[AVPlayerItemFailedToPlayToEndTimeErrorKey] as? Error)?.localizedDescription ?? "unknown"
            Self.playbackLog.error("Voicemail playback failed sid=\(recordingSid, privacy: .public): \(err, privacy: .public)")
            playbackErrorMessage = "Playback failed. The file may be missing, damaged, or not a supported format."
            stopAndCleanup()
        }
    }

    private func stopAndCleanup() {
        if let o = endObserver {
            NotificationCenter.default.removeObserver(o)
            endObserver = nil
        }
        if let o = failObserver {
            NotificationCenter.default.removeObserver(o)
            failObserver = nil
        }
        player?.pause()
        player = nil
        isPlaying = false
        if let f = localPlaybackFile {
            try? FileManager.default.removeItem(at: f)
            localPlaybackFile = nil
        }
    }
}

private struct CallRow: View {
    let call: CallRecord
    let business: Business?
    let contact: Contact?
    let onAvatarTap: () -> Void

    var body: some View {
        HStack(spacing: 12) {
            Button(action: onAvatarTap) {
                AvatarView(
                    initials: contact?.initials ?? "·",
                    gradientIndex: contact?.gradientIndex ?? 5,
                    size: 44,
                    businessDotColor: business?.tint.color
                )
            }
            .buttonStyle(.plain)

            VStack(alignment: .leading, spacing: 3) {
                HStack(spacing: 6) {
                    Text(call.displayName)
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundStyle(call.isMissed ? Color(red: 0.94, green: 0.27, blue: 0.27) : .white)
                    if call.outcome == .missed { /* counter could go here */ }
                }
                HStack(spacing: 5) {
                    directionIcon
                    Text(subtitleText)
                        .font(.system(size: 12))
                        .foregroundStyle(Theme.textFade)
                }
                if let biz = business {
                    BusinessChip(business: biz)
                        .padding(.top, 2)
                }
            }
            Spacer(minLength: 8)

            VStack(alignment: .trailing, spacing: 6) {
                Text(timeText)
                    .font(.system(size: 11))
                    .foregroundStyle(Theme.textFade)
                Button(action: onAvatarTap) {
                    Image(systemName: "info.circle")
                        .font(.system(size: 14))
                        .foregroundStyle(Theme.accentLavender)
                        .frame(width: 24, height: 24)
                        .background(Circle().fill(Color.white.opacity(0.06)))
                }
                .buttonStyle(.plain)
            }
        }
        .padding(.vertical, 4)
    }

    private var directionIcon: some View {
        let symbol: String
        let color: Color
        switch call.outcome {
        case .missed:
            symbol = "arrow.down.left"; color = Color(red: 0.94, green: 0.27, blue: 0.27)
        default:
            symbol = call.direction == .outgoing ? "arrow.up.right" : "arrow.down.left"
            color = Theme.textFade
        }
        return Image(systemName: symbol)
            .font(.system(size: 10, weight: .bold))
            .foregroundStyle(color)
    }

    private var subtitleText: String {
        switch call.outcome {
        case .missed:
            return "Missed · \(relativeWord)"
        case .declined:
            return "Declined"
        case .answered:
            let kind = call.direction == .outgoing ? "Outgoing" : "Incoming"
            if call.durationSeconds > 0 {
                let mins = call.durationSeconds / 60
                let secs = call.durationSeconds % 60
                return "\(kind) · \(mins)m \(String(format: "%02d", secs))s"
            }
            return kind
        }
    }

    private var relativeWord: String {
        let mins = Int(Date().timeIntervalSince(call.timestamp) / 60)
        if mins < 60 { return "\(mins)m" }
        return "\(mins / 60)h"
    }

    private var timeText: String {
        let mins = Int(Date().timeIntervalSince(call.timestamp) / 60)
        if mins < 60 {
            let formatter = DateFormatter()
            formatter.dateFormat = "h:mm a"
            return formatter.string(from: call.timestamp)
        }
        if mins < 60 * 24 { return "Yesterday" }
        if mins < 60 * 24 * 7 {
            let formatter = DateFormatter()
            formatter.dateFormat = "EEE"
            return formatter.string(from: call.timestamp)
        }
        let formatter = DateFormatter()
        formatter.dateFormat = "M/d"
        return formatter.string(from: call.timestamp)
    }
}

private struct RecentNumberDetailView: View {
    let call: CallRecord
    let business: Business?
    @Binding var path: NavigationPath
    @Environment(AppState.self) private var appState
    @State private var noteDraft: String = ""
    @State private var notes: [ContactNoteEntry] = []
    @State private var isFavorite: Bool = false
    @State private var lists: [String] = []
    @State private var addListPresented = false
    @State private var createListPresented = false
    @State private var newListName: String = ""
    @State private var editNotePresented = false
    @State private var editingNoteId: UUID?
    @State private var editingNoteText: String = ""
    @State private var addContactPresented = false

    var body: some View {
        ZStack {
            Theme.background.ignoresSafeArea()
            ScrollView {
                VStack(spacing: 14) {
                    AvatarView(initials: initials, gradientIndex: 5, size: 100, businessDotColor: business?.tint.color)
                        .padding(.top, 24)
                    Text(call.displayName)
                        .font(.system(size: 22, weight: .bold))
                        .foregroundStyle(.white)
                    if let biz = business {
                        BusinessChip(business: biz)
                    }
                    VStack(alignment: .leading, spacing: 6) {
                        Text("Phone")
                            .font(.system(size: 11, weight: .semibold))
                            .foregroundStyle(Theme.textFade)
                        Text(call.rawNumber)
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundStyle(Theme.accentLavender)
                    }
                    .padding(16)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .glassCard()

                    VStack(spacing: 10) {
                        actionButton("Call", system: "phone.fill") {
                            if let biz = business {
                                appState.outboundBusinessId = biz.id
                            } else if appState.outboundBusinessId == nil {
                                appState.outboundBusinessId = appState.businesses.first?.id
                            }
                            appState.dialedNumber = call.rawNumber
                            appState.startOutboundCall()
                        }
                        actionButton("Message", system: "message.fill") {
                            let bizId = appState.outboundBusinessId ?? appState.businesses.first?.id
                            guard let b = bizId, let convoId = appState.findOrCreateConversation(peerRawNumber: call.rawNumber, businessId: b) else { return }
                            path.append(convoId)
                        }
                    }

                    VStack(alignment: .leading, spacing: 12) {
                        Button {
                            addContactPresented = true
                        } label: {
                            HStack {
                                Image(systemName: "person.badge.plus")
                                Text("Add New Contact")
                                    .font(.system(size: 15, weight: .semibold))
                                Spacer()
                            }
                            .foregroundStyle(Theme.accentLavender)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 10)
                            .background(Color.white.opacity(0.06))
                            .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                        }
                        .buttonStyle(.plain)

                        Text("Notes")
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundStyle(Theme.textFade)
                        TextEditor(text: $noteDraft)
                            .scrollContentBackground(.hidden)
                            .frame(minHeight: 90)
                            .padding(8)
                            .background(Color.white.opacity(0.06))
                            .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                        Button("Save Note") {
                            saveDraftNote()
                        }
                        .buttonStyle(.plain)
                        .foregroundStyle(Theme.accentLavender)
                        .disabled(noteDraft.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                        if notes.isEmpty {
                            Text("No saved notes yet.")
                                .font(.system(size: 12))
                                .foregroundStyle(Theme.textFade)
                        } else {
                            let sorted = notes.sorted(by: { $0.createdAt > $1.createdAt })
                            VStack(alignment: .leading, spacing: 10) {
                                ForEach(sorted) { entry in
                                    VStack(alignment: .leading, spacing: 4) {
                                        HStack {
                                            Text(noteDateText(entry.createdAt))
                                                .font(.system(size: 11, weight: .semibold))
                                                .foregroundStyle(Theme.textFade)
                                            Spacer()
                                            Button("Edit") { beginEdit(entry) }
                                                .buttonStyle(.plain)
                                                .font(.system(size: 11, weight: .semibold))
                                                .foregroundStyle(Theme.accentLavender)
                                            Button("Delete", role: .destructive) { deleteNote(entry.id) }
                                                .buttonStyle(.plain)
                                                .font(.system(size: 11, weight: .semibold))
                                        }
                                        Text(entry.body)
                                            .font(.system(size: 14))
                                            .foregroundStyle(.white.opacity(0.9))
                                    }
                                    .frame(maxWidth: .infinity, alignment: .leading)
                                    .padding(.vertical, 6)
                                    if entry.id != sorted.last?.id {
                                        Rectangle().fill(Color.white.opacity(0.06)).frame(height: 1)
                                    }
                                }
                            }
                            .padding(10)
                            .background(Color.white.opacity(0.04))
                            .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                        }
                        if !lists.isEmpty {
                            Text("Lists: \(lists.joined(separator: ", "))")
                                .font(.system(size: 12))
                                .foregroundStyle(Theme.textFade)
                        }
                        Button(isFavorite ? "Remove from Favourites" : "Add to Favourites") {
                            isFavorite.toggle()
                            savePrefs()
                        }
                        .buttonStyle(.plain)
                        .foregroundStyle(Theme.accentLavender)
                        Button("Add to List") {
                            if availableLists.isEmpty {
                                createListPresented = true
                            } else {
                                addListPresented = true
                            }
                        }
                        .buttonStyle(.plain)
                        .foregroundStyle(Theme.accentLavender)
                    }
                    .padding(16)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .glassCard()
                }
                .padding(.horizontal, 18)
                .padding(.bottom, 32)
            }
        }
        .navigationTitle("Details")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear { loadPrefs() }
        .confirmationDialog("Add to List", isPresented: $addListPresented, titleVisibility: .visible) {
            ForEach(availableLists, id: \.self) { name in
                Button(name) { addToList(name) }
            }
            Button("Create New List") {
                createListPresented = true
            }
            Button("Cancel", role: .cancel) { }
        }
        .alert("Create List", isPresented: $createListPresented) {
            TextField("List name", text: $newListName)
            Button("Cancel", role: .cancel) {
                newListName = ""
            }
            Button("Create") {
                let name = newListName.trimmingCharacters(in: .whitespacesAndNewlines)
                guard !name.isEmpty else { return }
                ContactProfilePreferencesStore.addGlobalList(name)
                addToList(name)
                newListName = ""
            }
        }
        .alert("Edit Note", isPresented: $editNotePresented) {
            TextField("Note", text: $editingNoteText, axis: .vertical)
            Button("Cancel", role: .cancel) {
                editingNoteId = nil
                editingNoteText = ""
            }
            Button("Save") {
                saveEditedNote()
            }
        }
        .sheet(isPresented: $addContactPresented) {
            RecentAddContactSheet(prefilledNumber: call.rawNumber) { contact in
                appState.contacts.append(contact)
                appState.contacts.sort { $0.name.localizedCaseInsensitiveCompare($1.name) == .orderedAscending }
                Task.detached(priority: .userInitiated) {
                    await FirestoreHistoryService.saveContacts([contact])
                    await appState.pushUserDataToFirestore()
                }
            }
        }
    }

    private var initials: String {
        let t = call.displayName.trimmingCharacters(in: .whitespacesAndNewlines)
        if let first = t.first { return String(first).uppercased() }
        return "#"
    }

    private func actionButton(_ title: String, system: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack {
                Image(systemName: system)
                Text(title)
                    .font(.system(size: 15, weight: .semibold))
                Spacer()
            }
            .foregroundStyle(.white)
            .padding(.horizontal, 14)
            .padding(.vertical, 12)
            .background(Color.white.opacity(0.08))
            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
        }
        .buttonStyle(.plain)
    }

    private func loadPrefs() {
        let prefs = ContactProfilePreferencesStore.load(for: call.rawNumber)
        notes = prefs.notes
        isFavorite = prefs.isFavorite
        lists = prefs.lists
    }

    private func savePrefs() {
        ContactProfilePreferencesStore.save(
            ContactProfilePreferences(notes: notes, isFavorite: isFavorite, lists: lists),
            for: call.rawNumber
        )
    }

    private func saveDraftNote() {
        let text = noteDraft.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else { return }
        notes.append(ContactNoteEntry(body: text))
        noteDraft = ""
        savePrefs()
    }

    private func noteDateText(_ date: Date) -> String {
        let f = DateFormatter()
        f.dateStyle = .medium
        f.timeStyle = .short
        return f.string(from: date)
    }

    private func beginEdit(_ note: ContactNoteEntry) {
        editingNoteId = note.id
        editingNoteText = note.body
        editNotePresented = true
    }

    private func saveEditedNote() {
        guard let id = editingNoteId else { return }
        let text = editingNoteText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else { return }
        guard let idx = notes.firstIndex(where: { $0.id == id }) else { return }
        notes[idx] = ContactNoteEntry(id: notes[idx].id, body: text, createdAt: notes[idx].createdAt)
        savePrefs()
        editingNoteId = nil
        editingNoteText = ""
    }

    private func deleteNote(_ id: UUID) {
        notes.removeAll(where: { $0.id == id })
        savePrefs()
    }

    private var availableLists: [String] {
        ContactProfilePreferencesStore.globalListNames().sorted()
    }

    private func addToList(_ rawName: String) {
        let name = rawName.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !name.isEmpty else { return }
        if !lists.contains(where: { $0.caseInsensitiveCompare(name) == .orderedSame }) {
            lists.append(name)
            lists.sort()
            ContactProfilePreferencesStore.addGlobalList(name)
            savePrefs()
        }
    }
}

private struct RecentAddContactSheet: View {
    @Environment(\.dismiss) private var dismiss
    @State private var name: String = ""
    @State private var phone: String
    @State private var email: String = ""
    @State private var company: String = ""

    let onSave: (Contact) -> Void

    init(prefilledNumber: String, onSave: @escaping (Contact) -> Void) {
        _phone = State(initialValue: PhoneNumberE164.normalize(prefilledNumber))
        self.onSave = onSave
    }

    var body: some View {
        NavigationStack {
            Form {
                Section("Name") {
                    TextField("Full name", text: $name)
                        .textInputAutocapitalization(.words)
                        .autocorrectionDisabled()
                }
                Section("Phone") {
                    TextField("+1 555 123 4567", text: $phone)
                        .keyboardType(.phonePad)
                }
                Section("Optional") {
                    TextField("Email", text: $email)
                        .keyboardType(.emailAddress)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                    TextField("Company", text: $company)
                        .textInputAutocapitalization(.words)
                }
            }
            .navigationTitle("New Contact")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        let trimmedName = name.trimmingCharacters(in: .whitespacesAndNewlines)
                        let trimmedPhone = PhoneNumberE164.normalize(phone)
                        let e = email.trimmingCharacters(in: .whitespacesAndNewlines)
                        let c = company.trimmingCharacters(in: .whitespacesAndNewlines)

                        let seed = abs(trimmedName.hashValue)
                        let contact = Contact(
                            name: trimmedName,
                            phoneNumbers: [PhoneEntry(kind: .mobile, number: trimmedPhone)],
                            email: e.isEmpty ? nil : e,
                            company: c.isEmpty ? nil : c,
                            gradientIndex: seed % 6
                        )
                        onSave(contact)
                        dismiss()
                    }
                    .disabled(!canSave)
                }
            }
        }
    }

    private var canSave: Bool {
        let n = name.trimmingCharacters(in: .whitespacesAndNewlines)
        let p = PhoneNumberE164.normalize(phone)
        return !n.isEmpty && p.count >= 8
    }
}

#Preview {
    RecentsView()
        .environment(AppState.previewMock())
        .preferredColorScheme(.dark)
}
