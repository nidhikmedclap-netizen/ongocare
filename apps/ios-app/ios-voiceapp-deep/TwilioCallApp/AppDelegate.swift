//
//  AppDelegate.swift
//  TwilioCallApp
//
//  PushKit must start as early as possible (Apple / Twilio). SwiftUI `.task` can run after the first VoIP token.
//

import UIKit
import GoogleSignIn

final class AppDelegate: NSObject, UIApplicationDelegate {
    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
    ) -> Bool {
        TwilioVoiceSDKConfigurator.configureAtLaunch()
        VoicePushCoordinator.shared.ensurePushRegistryAtLaunch()
        return true
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        GIDSignIn.sharedInstance.handle(url)
    }
}
