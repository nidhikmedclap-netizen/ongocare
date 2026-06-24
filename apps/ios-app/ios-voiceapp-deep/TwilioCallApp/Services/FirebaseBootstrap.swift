//
//  FirebaseBootstrap.swift
//  TwilioCallApp
//

import FirebaseCore
import Foundation

enum FirebaseBootstrap {
    /// `GoogleService-Info.plist` must be in the app target (download from Firebase Console).
    static var hasConfigPlist: Bool {
        Bundle.main.path(forResource: "GoogleService-Info", ofType: "plist") != nil
    }

    static var isConfigured: Bool {
        FirebaseApp.app() != nil
    }

    /// Stable Firebase project id from GoogleService-Info.plist (if present).
    static var projectID: String? {
        if let configured = FirebaseApp.app()?.options.projectID?
            .trimmingCharacters(in: .whitespacesAndNewlines),
           !configured.isEmpty {
            return configured
        }
        guard let path = Bundle.main.path(forResource: "GoogleService-Info", ofType: "plist"),
              let dict = NSDictionary(contentsOfFile: path) as? [String: Any],
              let raw = dict["PROJECT_ID"] as? String
        else { return nil }
        let t = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        return t.isEmpty ? nil : t
    }

    static func configureIfNeeded() {
        guard hasConfigPlist else { return }
        if FirebaseApp.app() == nil {
            FirebaseApp.configure()
        }
    }
}
