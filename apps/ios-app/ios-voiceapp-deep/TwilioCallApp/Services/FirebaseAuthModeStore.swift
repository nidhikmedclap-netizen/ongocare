//
//  FirebaseAuthModeStore.swift
//  TwilioCallApp
//

import FirebaseAuth
import Foundation

enum FirebaseAuthMode: String, CaseIterable, Identifiable {
    case anonymous
    case emailPassword
    case customToken

    var id: String { rawValue }

    var title: String {
        switch self {
        case .anonymous: return "Anonymous"
        case .emailPassword: return "Email/Password"
        case .customToken: return "Custom Token"
        }
    }
}

enum FirebaseAuthModeStore {
    private enum Keys {
        static let mode = "firebase_auth_mode"
        static let email = "firebase_auth_email"
        static let password = "firebase_auth_password"
        static let customToken = "firebase_auth_custom_token"
    }

    static var mode: FirebaseAuthMode {
        get {
            let raw = UserDefaults.standard.string(forKey: Keys.mode) ?? FirebaseAuthMode.anonymous.rawValue
            return FirebaseAuthMode(rawValue: raw) ?? .anonymous
        }
        set { UserDefaults.standard.set(newValue.rawValue, forKey: Keys.mode) }
    }

    static var email: String {
        get { UserDefaults.standard.string(forKey: Keys.email) ?? "" }
        set { UserDefaults.standard.set(newValue, forKey: Keys.email) }
    }

    static var password: String {
        get { UserDefaults.standard.string(forKey: Keys.password) ?? "" }
        set { UserDefaults.standard.set(newValue, forKey: Keys.password) }
    }

    static var customToken: String {
        get { UserDefaults.standard.string(forKey: Keys.customToken) ?? "" }
        set { UserDefaults.standard.set(newValue, forKey: Keys.customToken) }
    }

    static func ensureSignedInForSelectedMode(forceSelectedMode: Bool = false) async throws -> String {
        let auth = Auth.auth()
        let selected = mode
        if let user = auth.currentUser, (!forceSelectedMode || userMatchesSelectedMode(user, selected: selected)) {
            return user.uid
        }
        if forceSelectedMode, auth.currentUser != nil {
            try auth.signOut()
        }

        switch selected {
        case .anonymous:
            let result = try await auth.signInAnonymously()
            return result.user.uid
        case .emailPassword:
            let email = email.trimmingCharacters(in: .whitespacesAndNewlines)
            let password = password.trimmingCharacters(in: .whitespacesAndNewlines)
            guard !email.isEmpty, !password.isEmpty else {
                throw NSError(domain: "FirebaseAuthModeStore", code: 1001, userInfo: [
                    NSLocalizedDescriptionKey: "Email/password mode is selected but credentials are empty."
                ])
            }
            do {
                let result = try await auth.signIn(withEmail: email, password: password)
                return result.user.uid
            } catch {
                let ns = error as NSError
                if ns.code == AuthErrorCode.userNotFound.rawValue {
                    let created = try await auth.createUser(withEmail: email, password: password)
                    return created.user.uid
                }
                throw error
            }
        case .customToken:
            let token = customToken.trimmingCharacters(in: .whitespacesAndNewlines)
            guard !token.isEmpty else {
                throw NSError(domain: "FirebaseAuthModeStore", code: 1002, userInfo: [
                    NSLocalizedDescriptionKey: "Custom token mode is selected but token is empty."
                ])
            }
            let result = try await auth.signIn(withCustomToken: token)
            return result.user.uid
        }
    }

    private static func userMatchesSelectedMode(_ user: User, selected: FirebaseAuthMode) -> Bool {
        switch selected {
        case .anonymous:
            return user.isAnonymous
        case .emailPassword:
            return !user.isAnonymous && user.providerData.contains(where: { $0.providerID == "password" })
        case .customToken:
            return !user.isAnonymous
        }
    }
}
