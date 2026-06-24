import Foundation

// Per-user notification preferences — Firestore `notificationSettings/{userId}`
struct NotificationSettings: Codable {
    var masterEnabled: Bool
    var waterEnabled: Bool
    var moodEnabled: Bool
    var stepsEnabled: Bool
    var medsEnabled: Bool

    static let collectionPath = "notificationSettings"

    static let `default` = NotificationSettings(
        masterEnabled: true,
        waterEnabled: true,
        moodEnabled: true,
        stepsEnabled: true,
        medsEnabled: true
    )
}
