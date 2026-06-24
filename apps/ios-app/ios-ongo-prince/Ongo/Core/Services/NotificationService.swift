import Foundation
import FirebaseMessaging
import UserNotifications
import UIKit

@Observable
final class NotificationService: NSObject, @unchecked Sendable {
    static let shared = NotificationService()
    var fcmToken: String? = nil
    var pendingDeepLink: String? = nil

    private override init() {
        super.init()
        Messaging.messaging().delegate = self
        UNUserNotificationCenter.current().delegate = self
    }

    // MARK: - Request permission and register
    func requestPermission() async -> Bool {
        do {
            let granted = try await UNUserNotificationCenter.current()
                .requestAuthorization(options: [.alert, .sound, .badge])
            if granted {
                await MainActor.run {
                    UIApplication.shared.registerForRemoteNotifications()
                }
            }
            return granted
        } catch {
            return false
        }
    }

    // MARK: - Handle incoming remote notification data
    func handleNotification(_ userInfo: [AnyHashable: Any]) {
        // Ongo notification payload convention:
        // { "action": "openAppointment", "id": "..." }
        if let action = userInfo["action"] as? String {
            pendingDeepLink = action
        }
    }

    // MARK: - Update APNs token with Firebase
    func setAPNSToken(_ token: Data) {
        Messaging.messaging().apnsToken = token
    }
}

// MARK: - MessagingDelegate
extension NotificationService: MessagingDelegate {
    func messaging(_ messaging: Messaging, didReceiveRegistrationToken fcmToken: String?) {
        self.fcmToken = fcmToken
    }
}

// MARK: - UNUserNotificationCenterDelegate
extension NotificationService: UNUserNotificationCenterDelegate {
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
    ) {
        completionHandler([.banner, .sound, .badge])
    }

    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse,
        withCompletionHandler completionHandler: @escaping () -> Void
    ) {
        handleNotification(response.notification.request.content.userInfo)
        completionHandler()
    }
}
