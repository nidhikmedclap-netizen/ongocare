//
//  ContactDetailView.swift
//  TwilioCallApp
//

import SwiftUI

struct ContactDetailView: View {
    let contact: Contact
    @Binding var path: NavigationPath
    @Environment(AppState.self) private var appState
    @Environment(\.dismiss) private var dismiss
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

    var body: some View {
        ZStack {
            Theme.background.ignoresSafeArea()
            ScrollView {
                VStack(spacing: 0) {
                    hero
                    actionPills
                        .padding(.top, 18)
                    infoCard
                        .padding(.top, 18)
                    statsCard
                        .padding(.top, 14)
                    preferencesCard
                        .padding(.top, 14)
                    Spacer(minLength: 40)
                }
                .padding(.horizontal, 18)
            }
        }
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button("Edit") { /* edit flow */ }
                    .tint(Theme.accentLavender)
            }
        }
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
    }

    private var hero: some View {
        VStack(spacing: 14) {
            AvatarView(initials: contact.initials,
                       gradientIndex: contact.gradientIndex,
                       size: 100)
                .shadow(color: Color(red: 0.02, green: 0.71, blue: 0.83).opacity(0.4), radius: 16, y: 12)
            Text(contact.name)
                .font(.system(size: 22, weight: .bold))
            if let company = contact.company {
                Text(company)
                    .font(.system(size: 13))
                    .foregroundStyle(Theme.textFade)
            }
        }
        .padding(.top, 26)
    }

    private var actionPills: some View {
        HStack(spacing: 16) {
            actionPill(label: "Call", system: "phone.fill") {
                if appState.outboundBusinessId == nil {
                    appState.outboundBusinessId = appState.businesses.first?.id
                }
                appState.dialedNumber = contact.primaryNumber
                appState.startOutboundCall()
            }
            actionPill(label: "Message", system: "message.fill") {
                let bizId = appState.outboundBusinessId ?? appState.businesses.first?.id
                guard let businessId = bizId else { return }
                guard let convoId = appState.findOrCreateConversation(peerRawNumber: contact.primaryNumber, businessId: businessId) else { return }
                path.append(convoId)
            }
            actionPill(label: "Video", system: "video.fill") { }
            actionPill(label: "Email", system: "envelope.fill") { }
        }
    }

    private func actionPill(label: String, system: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            VStack(spacing: 6) {
                Image(systemName: system)
                    .font(.system(size: 18))
                    .foregroundStyle(Theme.accentLavender)
                    .frame(width: 48, height: 48)
                    .background(
                        RoundedRectangle(cornerRadius: 14, style: .continuous)
                            .fill(Color.white.opacity(0.08))
                            .overlay(
                                RoundedRectangle(cornerRadius: 14, style: .continuous)
                                    .strokeBorder(Color.white.opacity(0.12), lineWidth: 1)
                            )
                    )
                Text(label)
                    .font(.system(size: 11, weight: .medium))
                    .foregroundStyle(Theme.accentLavender)
            }
        }
        .buttonStyle(.plain)
    }

    private var infoCard: some View {
        VStack(spacing: 0) {
            ForEach(contact.phoneNumbers, id: \.number) { entry in
                infoRow(label: entry.kind.rawValue.capitalized, value: entry.number)
                if entry != contact.phoneNumbers.last { divider }
            }
            if let email = contact.email {
                divider
                infoRow(label: "Email", value: email)
            }
        }
        .padding(.vertical, 6)
        .padding(.horizontal, 16)
        .glassCard()
    }

    private func infoRow(label: String, value: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(label.uppercased())
                .font(.system(size: 11, weight: .semibold))
                .tracking(0.7)
                .foregroundStyle(Theme.textFade)
            Text(value)
                .font(.system(size: 15, weight: .medium))
                .foregroundStyle(Theme.accentLavender)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.vertical, 8)
    }

    private var divider: some View {
        Rectangle().fill(Color.white.opacity(0.06)).frame(height: 1)
    }

    private var statsCard: some View {
        let callCount = appState.calls.filter { $0.contactId == contact.id }.count
        let msgCount = appState.conversations
            .first(where: { $0.contactId == contact.id })?
            .messages.count ?? 0

        return HStack {
            Text("Recent")
                .font(.system(size: 11, weight: .semibold))
                .tracking(0.7)
                .foregroundStyle(Theme.textFade)
            Spacer()
            Text("\(callCount) calls · \(msgCount) messages")
                .font(.system(size: 13))
                .foregroundStyle(.white.opacity(0.85))
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 14)
        .glassCard()
    }

    private var preferencesCard: some View {
        VStack(alignment: .leading, spacing: 12) {
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
                            divider
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
        .padding(.horizontal, 16)
        .padding(.vertical, 14)
        .glassCard()
    }

    private func loadPrefs() {
        let prefs = ContactProfilePreferencesStore.load(for: contact.primaryNumber)
        notes = prefs.notes
        isFavorite = prefs.isFavorite
        lists = prefs.lists
    }

    private func savePrefs() {
        ContactProfilePreferencesStore.save(
            ContactProfilePreferences(notes: notes, isFavorite: isFavorite, lists: lists),
            for: contact.primaryNumber
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

#Preview {
    let state = AppState.previewMock()
    return NavigationStack {
        ContactDetailView(contact: state.contacts.first!, path: .constant(NavigationPath()))
    }
    .environment(state)
    .preferredColorScheme(.dark)
}
