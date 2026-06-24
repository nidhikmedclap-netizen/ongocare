//
//  ContactProfilePreferencesStore.swift
//  TwilioCallApp
//

import Foundation

struct ContactNoteEntry: Codable, Hashable, Identifiable {
    let id: UUID
    let body: String
    let createdAt: Date

    init(id: UUID = UUID(), body: String, createdAt: Date = Date()) {
        self.id = id
        self.body = body
        self.createdAt = createdAt
    }
}

struct ContactProfilePreferences: Codable {
    var notes: [ContactNoteEntry]
    var isFavorite: Bool
    var lists: [String]

    private enum CodingKeys: String, CodingKey {
        case notes
        case isFavorite
        case lists
    }

    init(notes: [ContactNoteEntry], isFavorite: Bool, lists: [String]) {
        self.notes = notes
        self.isFavorite = isFavorite
        self.lists = lists
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        if let arr = try? c.decode([ContactNoteEntry].self, forKey: .notes) {
            notes = arr
        } else if let legacy = try? c.decode(String.self, forKey: .notes) {
            let t = legacy.trimmingCharacters(in: .whitespacesAndNewlines)
            notes = t.isEmpty ? [] : [ContactNoteEntry(body: t)]
        } else {
            notes = []
        }
        isFavorite = (try? c.decode(Bool.self, forKey: .isFavorite)) ?? false
        lists = (try? c.decode([String].self, forKey: .lists)) ?? []
    }
}

enum ContactProfilePreferencesStore {
    private static let globalListsKey = "contact_global_lists_v1"
    private static let globalListMembersKey = "contact_global_list_members_v1"
    static let didChangeNotification = Notification.Name("ContactProfilePreferencesStoreDidChange")

    private static func key(for rawNumber: String) -> String {
        "contact_profile_prefs_" + PhoneNumberE164.normalize(rawNumber)
    }

    static func globalListNames() -> [String] {
        UserDefaults.standard.stringArray(forKey: globalListsKey) ?? []
    }

    static func countInGlobalList(_ listName: String) -> Int {
        let n = listName.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !n.isEmpty else { return 0 }
        let key = normalizeListKey(n)
        let map = UserDefaults.standard.dictionary(forKey: globalListMembersKey) as? [String: [String]] ?? [:]
        return Set(map[key] ?? []).count
    }

    static func addGlobalList(_ rawName: String) {
        let name = rawName.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !name.isEmpty else { return }
        var all = globalListNames()
        if !all.contains(where: { $0.caseInsensitiveCompare(name) == .orderedSame }) {
            all.append(name)
            all.sort()
            UserDefaults.standard.set(all, forKey: globalListsKey)
            NotificationCenter.default.post(name: didChangeNotification, object: nil)
        }
    }

    static func load(for rawNumber: String) -> ContactProfilePreferences {
        let k = key(for: rawNumber)
        guard let data = UserDefaults.standard.data(forKey: k),
              let decoded = try? JSONDecoder().decode(ContactProfilePreferences.self, from: data) else {
            return ContactProfilePreferences(notes: [], isFavorite: false, lists: [])
        }
        return decoded
    }

    static func save(_ prefs: ContactProfilePreferences, for rawNumber: String) {
        let normalizedNumber = PhoneNumberE164.normalize(rawNumber)
        let previous = load(for: rawNumber)
        let k = key(for: rawNumber)
        guard let data = try? JSONEncoder().encode(prefs) else { return }
        UserDefaults.standard.set(data, forKey: k)
        for name in prefs.lists {
            addGlobalList(name)
        }
        updateGlobalListMembers(
            normalizedNumber: normalizedNumber,
            oldLists: previous.lists,
            newLists: prefs.lists
        )
        NotificationCenter.default.post(name: didChangeNotification, object: nil)
    }

    private static func normalizeListKey(_ raw: String) -> String {
        raw.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
    }

    private static func updateGlobalListMembers(
        normalizedNumber: String,
        oldLists: [String],
        newLists: [String]
    ) {
        guard !normalizedNumber.isEmpty else { return }
        var map = UserDefaults.standard.dictionary(forKey: globalListMembersKey) as? [String: [String]] ?? [:]
        let oldKeys = Set(oldLists.map(normalizeListKey))
        let newKeys = Set(newLists.map(normalizeListKey))
        let toRemove = oldKeys.subtracting(newKeys)
        let toAdd = newKeys

        for key in toRemove {
            var set = Set(map[key] ?? [])
            set.remove(normalizedNumber)
            map[key] = Array(set)
        }
        for key in toAdd {
            var set = Set(map[key] ?? [])
            set.insert(normalizedNumber)
            map[key] = Array(set)
        }
        UserDefaults.standard.set(map, forKey: globalListMembersKey)
    }
}

