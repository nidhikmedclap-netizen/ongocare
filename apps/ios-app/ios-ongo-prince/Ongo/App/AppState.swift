import SwiftUI
import FirebaseAuth

// MARK: - Root routing enum
enum RootDestination: Equatable {
    case splash
    case onboarding          // public quiz (first launch only)
    case welcome             // returning unauthenticated user
    case auth(mode: AuthMode)
    case survey              // post-auth onboarding survey
    case main                // authenticated + survey complete
}

enum AuthMode: Equatable {
    case signUp
    case signIn
}

// MARK: - Global app state
@Observable
final class AppState: @unchecked Sendable {
    // MARK: - Router
    var rootDestination: RootDestination = .splash

    // MARK: - Current user document (loaded from Firestore after auth)
    var ongoUser: OngoUser? = nil

    // MARK: - Transient session flags (never persisted to Firestore)
    var autoAssignDoctorMode: Bool = true  // true until first booking completes
    var isFirstLaunch: Bool = false

    // MARK: - Services
    let auth = AuthService()
    let notifications = NotificationService.shared
    let firestore = FirestoreService.shared

    // MARK: - Quiz answers captured pre-auth (Q1 pattern: local storage → merge on signup)
    var pendingQuizAnswers: OngoUser.QuizAnswers? = nil {
        didSet { persistQuizAnswers() }
    }

    // MARK: - Boot sequence
    @MainActor
    func boot() async {
        // Small delay for launch screen
        try? await Task.sleep(for: .milliseconds(600))

        let hasLaunchedBefore = UserDefaults.standard.bool(forKey: "hasLaunchedBefore")
        isFirstLaunch = !hasLaunchedBefore

        // Sign out any cached session to land on WelcomeView for testing
        try? auth.signOut()

        if let firebaseUser = auth.currentUser {
            await loadUserAndRoute(firebaseUser: firebaseUser)
        } else if isFirstLaunch {
            // First ever launch → public quiz
            rootDestination = .onboarding
            UserDefaults.standard.set(true, forKey: "hasLaunchedBefore")
        } else {
            // Returning unauthenticated user → welcome (not quiz)
            rootDestination = .welcome
        }
    }

    @MainActor
    func loadUserAndRoute(firebaseUser: FirebaseAuth.User) async {
        do {
            let user = try await firestore.getUser(id: firebaseUser.uid)
            ongoUser = user
            if user.surveyCompleted {
                rootDestination = .main
                // Register FCM token if new
                if let token = notifications.fcmToken, token != user.fcmToken {
                    try? await firestore.updateFCMToken(token, userId: firebaseUser.uid)
                }
            } else {
                rootDestination = .survey
            }
        } catch {
            // User document doesn't exist yet (fresh signup)
            rootDestination = .survey
        }
    }

    // MARK: - Called after successful signup to create user document
    @MainActor
    func handleSignUpComplete(firebaseUser: FirebaseAuth.User, email: String) async {
        let user = OngoUser(
            id: firebaseUser.uid,
            firstName: "",
            lastName: "",
            email: email,
            planTier: .none,
            glp1Eligible: false,
            eligibilityStatus: .pending,
            surveyCompleted: false,
            quizAnswers: pendingQuizAnswers,
            createdAt: Date()
        )
        // Seed first name from quiz if captured
        if let answers = pendingQuizAnswers {
            // Will be filled during survey
            _ = answers
        }
        try? await firestore.saveUser(user)
        ongoUser = user
        pendingQuizAnswers = nil
        rootDestination = .survey
    }

    // MARK: - Called when survey fully completes
    @MainActor
    func handleSurveyComplete(profile: SurveyProfile) async {
        guard var user = ongoUser else { return }
        user.firstName = profile.firstName ?? user.firstName
        user.surveyCompleted = true
        user.surveyProgress = nil
        user.eligibilityStatus = profile.hasHardContraindication ? .ineligible : .eligible
        user.glp1Eligible = !profile.hasHardContraindication && !profile.hasSoftContraindication
        user.surveyProfile = profile
        ongoUser = user
        try? await firestore.saveUser(user)
        rootDestination = .main
        _ = await notifications.requestPermission()
    }

    // MARK: - Sign out
    @MainActor
    func signOut() {
        try? auth.signOut()
        ongoUser = nil
        autoAssignDoctorMode = true
        rootDestination = .welcome
    }

    // MARK: - First booking complete — clear auto-assign mode
    func firstBookingCompleted() {
        autoAssignDoctorMode = false
    }

    // MARK: - Persist quiz answers locally so they survive app restarts pre-auth
    private func persistQuizAnswers() {
        if let answers = pendingQuizAnswers,
           let data = try? JSONEncoder().encode(answers) {
            UserDefaults.standard.set(data, forKey: "pendingQuizAnswers")
        } else {
            UserDefaults.standard.removeObject(forKey: "pendingQuizAnswers")
        }
    }

    func loadPersistedQuizAnswers() {
        if let data = UserDefaults.standard.data(forKey: "pendingQuizAnswers"),
           let answers = try? JSONDecoder().decode(OngoUser.QuizAnswers.self, from: data) {
            pendingQuizAnswers = answers
        }
    }
}
