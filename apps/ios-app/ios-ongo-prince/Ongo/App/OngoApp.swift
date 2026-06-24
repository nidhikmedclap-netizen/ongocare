import SwiftUI
import FirebaseCore
import FirebaseMessaging
import UserNotifications
import UIKit

@main
struct OngoApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) var delegate

    var body: some Scene {
        WindowGroup {
            RootView()
                .preferredColorScheme(.light)  // Ongo is light-mode only for v1
        }
    }
}

// MARK: - AppDelegate (required for Firebase + push notifications)
final class AppDelegate: NSObject, UIApplicationDelegate {
    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
    ) -> Bool {
        let options = FirebaseOptions(
            googleAppID: "1:553556265121:ios:65d011e8e4b941238a08e0",
            gcmSenderID: "553556265121"
        )
        options.apiKey = "AIzaSyCYlKoRpkO1MKYp1l4nZ72FL0Ewgi9P3hU"
        options.projectID = "ongo-dev-d5735"
        options.storageBucket = "ongo-dev-d5735.firebasestorage.app"
        options.bundleID = "com.ongo.app"
        FirebaseApp.configure(options: options)
        return true
    }

    func application(
        _ application: UIApplication,
        didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
    ) {
        NotificationService.shared.setAPNSToken(deviceToken)
    }

    func application(
        _ application: UIApplication,
        didFailToRegisterForRemoteNotificationsWithError error: Error
    ) {
        // Remote notifications unavailable (simulator, etc.) — safe to ignore
    }

    func application(
        _ application: UIApplication,
        didReceiveRemoteNotification userInfo: [AnyHashable: Any],
        fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void
    ) {
        NotificationService.shared.handleNotification(userInfo)
        completionHandler(.newData)
    }
}
