//
//  ContactsView.swift
//  TwilioCallApp
//
//  Alphabetical list of contacts with gradient avatars + add FAB.
//

import SwiftUI

private enum ContactNavRoute: Hashable {
    case allContacts
    case list(String)
}

struct ContactsView: View {
    @Environment(AppState.self) private var appState
    @State private var path = NavigationPath()
    @State private var addListPresented = false
    @State private var newListName = ""
    @State private var listsVersion = 0

    var body: some View {
        NavigationStack(path: $path) {
            ZStack {
                Theme.background.ignoresSafeArea()
                ScrollView {
                    VStack(spacing: 16) {
                        Button {
                            path.append(ContactNavRoute.allContacts)
                        } label: {
                            HStack {
                                Image(systemName: "person.2.fill")
                                    .foregroundStyle(.white)
                                Text("All Contacts")
                                    .font(.system(size: 18, weight: .semibold))
                                    .foregroundStyle(.white)
                                Spacer()
                                Text("\(appState.contacts.count)")
                                    .font(.system(size: 20, weight: .medium))
                                    .foregroundStyle(Theme.textFade)
                                Image(systemName: "chevron.right")
                                    .font(.system(size: 12, weight: .semibold))
                                    .foregroundStyle(Theme.textFade)
                            }
                            .padding(16)
                            .glassCard()
                        }
                        .buttonStyle(.plain)

                        VStack(alignment: .leading, spacing: 10) {
                            Text("My Lists")
                                .font(.system(size: 20, weight: .bold))
                                .foregroundStyle(.white)
                            VStack(spacing: 0) {
                                ForEach(listNames, id: \.self) { listName in
                                    Button {
                                        path.append(ContactNavRoute.list(listName))
                                    } label: {
                                        HStack {
                                            Text(listName)
                                                .font(.system(size: 17))
                                                .foregroundStyle(.white)
                                            Spacer()
                                            Text("\(count(for: listName))")
                                                .font(.system(size: 18, weight: .medium))
                                                .foregroundStyle(Theme.textFade)
                                            Image(systemName: "chevron.right")
                                                .font(.system(size: 12, weight: .semibold))
                                                .foregroundStyle(Theme.textFade)
                                        }
                                        .padding(.horizontal, 14)
                                        .padding(.vertical, 12)
                                    }
                                    .buttonStyle(.plain)
                                    if listName != listNames.last {
                                        Divider().background(Color.white.opacity(0.08))
                                    }
                                }
                            }
                            .glassCard()
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                    }
                    .padding(16)
                }
            }
            .navigationTitle("Lists")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Edit") { }
                        .foregroundStyle(.white)
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Add List") { addListPresented = true }
                        .foregroundStyle(.white)
                }
            }
            .navigationDestination(for: ContactNavRoute.self) { route in
                switch route {
                case .allContacts:
                    AllContactsListView(path: $path)
                case .list(let name):
                    ListMembersView(listName: name)
                }
            }
            .navigationDestination(for: Contact.self) { c in
                ContactDetailView(contact: c, path: $path)
            }
            .navigationDestination(for: UUID.self) { id in
                ConversationView(conversationId: id)
            }
            .alert("Add List", isPresented: $addListPresented) {
                TextField("List name", text: $newListName)
                Button("Cancel", role: .cancel) {
                    newListName = ""
                }
                Button("Add") {
                    let name = newListName.trimmingCharacters(in: .whitespacesAndNewlines)
                    guard !name.isEmpty else { return }
                    ContactProfilePreferencesStore.addGlobalList(name)
                    newListName = ""
                }
            }
            .onReceive(NotificationCenter.default.publisher(for: ContactProfilePreferencesStore.didChangeNotification)) { _ in
                listsVersion += 1
            }
        }
    }

    private var listNames: [String] {
        _ = listsVersion
        let names = ContactProfilePreferencesStore.globalListNames().sorted()
        return names.isEmpty ? ["Favorites", "General"] : names
    }

    private func count(for listName: String) -> Int {
        ContactProfilePreferencesStore.countInGlobalList(listName)
    }
}

private struct ListMembersView: View {
    let listName: String
    @Environment(AppState.self) private var appState
    @State private var version = 0

    var body: some View {
        ZStack {
            Theme.background.ignoresSafeArea()
            if contactsInList.isEmpty {
                VStack(spacing: 8) {
                    Image(systemName: "person.3.sequence.fill")
                        .font(.system(size: 34))
                        .foregroundStyle(Theme.textFade)
                    Text("No contacts in this list")
                        .font(.system(size: 16, weight: .semibold))
                    Text("Add contacts from profile screens, then manage removals here.")
                        .font(.system(size: 13))
                        .foregroundStyle(Theme.textFade)
                }
            } else {
                List {
                    ForEach(contactsInList) { contact in
                        HStack(spacing: 12) {
                            ContactRow(contact: contact)
                            Button("Remove") {
                                remove(contact)
                            }
                            .buttonStyle(.plain)
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundStyle(Color.red.opacity(0.92))
                        }
                        .listRowBackground(Color.clear)
                        .listRowSeparator(.hidden)
                    }
                }
                .listStyle(.plain)
                .scrollContentBackground(.hidden)
            }
        }
        .navigationTitle(listName)
        .navigationBarTitleDisplayMode(.inline)
        .onReceive(NotificationCenter.default.publisher(for: ContactProfilePreferencesStore.didChangeNotification)) { _ in
            version += 1
        }
    }

    private var contactsInList: [Contact] {
        _ = version
        return appState.contacts
            .filter { c in
                let prefs = ContactProfilePreferencesStore.load(for: c.primaryNumber)
                return prefs.lists.contains(where: { $0.caseInsensitiveCompare(listName) == .orderedSame })
            }
            .sorted { $0.name.localizedCaseInsensitiveCompare($1.name) == .orderedAscending }
    }

    private func remove(_ contact: Contact) {
        var prefs = ContactProfilePreferencesStore.load(for: contact.primaryNumber)
        prefs.lists.removeAll { $0.caseInsensitiveCompare(listName) == .orderedSame }
        ContactProfilePreferencesStore.save(prefs, for: contact.primaryNumber)
    }
}

private struct AllContactsListView: View {
    @Environment(AppState.self) private var appState
    @Binding var path: NavigationPath
    @State private var addPresented = false

    var body: some View {
        ZStack(alignment: .bottomTrailing) {
            Theme.background.ignoresSafeArea()
            List {
                ForEach(grouped, id: \.letter) { section in
                    Section {
                        ForEach(section.contacts) { contact in
                            NavigationLink(value: contact) {
                                ContactRow(contact: contact)
                            }
                            .listRowBackground(Color.clear)
                            .listRowSeparator(.hidden)
                        }
                    } header: {
                        Text(section.letter)
                            .font(.system(size: 12, weight: .bold))
                            .tracking(1)
                            .foregroundStyle(Theme.textFade)
                            .padding(.vertical, 4)
                    }
                }
            }
            .listStyle(.plain)
            .scrollContentBackground(.hidden)

            Button {
                addPresented = true
            } label: {
                Image(systemName: "plus")
                    .font(.system(size: 22, weight: .bold))
                    .foregroundStyle(.white)
                    .frame(width: 56, height: 56)
                    .background(Theme.primaryGradient)
                    .clipShape(Circle())
                    .shadow(color: Color(red: 0.49, green: 0.23, blue: 0.93).opacity(0.6),
                            radius: 18, x: 0, y: 12)
            }
            .padding(.trailing, 20)
            .padding(.bottom, 20)
        }
        .navigationTitle("All Contacts")
        .navigationBarTitleDisplayMode(.inline)
        .sheet(isPresented: $addPresented) {
            AddContactSheet { contact in
                appState.contacts.append(contact)
                appState.contacts.sort { $0.name.localizedCaseInsensitiveCompare($1.name) == .orderedAscending }
                Task.detached(priority: .userInitiated) {
                    await FirestoreHistoryService.saveContacts([contact])
                    await appState.pushUserDataToFirestore()
                }
            }
        }
    }

    private struct LetterSection {
        let letter: String
        let contacts: [Contact]
    }

    private var grouped: [LetterSection] {
        let sorted = appState.contacts.sorted { $0.name.localizedCompare($1.name) == .orderedAscending }
        let bucketed = Dictionary(grouping: sorted) { c -> String in
            String(c.name.prefix(1)).uppercased()
        }
        return bucketed.keys.sorted().map { LetterSection(letter: $0, contacts: bucketed[$0] ?? []) }
    }
}

private struct AddContactSheet: View {
    @Environment(\.dismiss) private var dismiss
    @State private var name: String = ""
    @State private var phone: String = ""
    @State private var email: String = ""
    @State private var company: String = ""

    let onSave: (Contact) -> Void

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

private struct ContactRow: View {
    let contact: Contact
    var body: some View {
        HStack(spacing: 12) {
            AvatarView(initials: contact.initials,
                       gradientIndex: contact.gradientIndex,
                       size: 44)
            VStack(alignment: .leading, spacing: 2) {
                Text(contact.name)
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(.white)
                Text(contact.primaryNumber)
                    .font(.system(size: 12))
                    .foregroundStyle(Theme.textFade)
            }
            Spacer()
        }
        .padding(.vertical, 4)
    }
}

#Preview {
    ContactsView()
        .environment(AppState.previewMock())
        .preferredColorScheme(.dark)
}
