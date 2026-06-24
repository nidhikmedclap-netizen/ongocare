import Foundation
import FirebaseAuth
import FirebaseFirestore

@Observable
final class AuthService: @unchecked Sendable {
    var currentUser: FirebaseAuth.User? = Auth.auth().currentUser
    var isLoading: Bool = false
    var error: String? = nil

    private var authStateHandle: AuthStateDidChangeListenerHandle?

    init() {
        authStateHandle = Auth.auth().addStateDidChangeListener { [weak self] _, user in
            self?.currentUser = user
        }
    }

    deinit {
        if let handle = authStateHandle {
            Auth.auth().removeStateDidChangeListener(handle)
        }
    }

    var isAuthenticated: Bool { currentUser != nil }
    var userId: String? { currentUser?.uid }

    // MARK: - Email / Password
    func signUp(email: String, password: String) async throws {
        isLoading = true
        defer { isLoading = false }
        let result = try await Auth.auth().createUser(withEmail: email, password: password)
        currentUser = result.user
    }

    func signIn(email: String, password: String) async throws {
        isLoading = true
        defer { isLoading = false }
        let result = try await Auth.auth().signIn(withEmail: email, password: password)
        currentUser = result.user
    }

    func resetPassword(email: String) async throws {
        try await Auth.auth().sendPasswordReset(withEmail: email)
    }

    // MARK: - Phone OTP
    // Returns verificationID to pass to verifyOTP
    func sendPhoneOTP(phoneNumber: String) async throws -> String {
        let verificationID = try await PhoneAuthProvider.provider()
            .verifyPhoneNumber(phoneNumber, uiDelegate: nil)
        return verificationID
    }

    func verifyOTP(verificationID: String, code: String) async throws {
        isLoading = true
        defer { isLoading = false }
        let credential = PhoneAuthProvider.provider().credential(
            withVerificationID: verificationID,
            verificationCode: code
        )
        let result = try await Auth.auth().signIn(with: credential)
        currentUser = result.user
    }

    // MARK: - Sign Out
    func signOut() throws {
        try Auth.auth().signOut()
        currentUser = nil
    }

    // MARK: - Delete Account
    func deleteAccount() async throws {
        guard let user = currentUser else { throw AuthError.notAuthenticated }
        try await user.delete()
        currentUser = nil
    }

    // MARK: - Update Email / Profile
    func updateDisplayName(_ name: String) async throws {
        guard let user = currentUser else { throw AuthError.notAuthenticated }
        let changeRequest = user.createProfileChangeRequest()
        changeRequest.displayName = name
        try await changeRequest.commitChanges()
    }

    enum AuthError: LocalizedError {
        case notAuthenticated
        var errorDescription: String? {
            switch self {
            case .notAuthenticated: return "You must be signed in to continue."
            }
        }
    }
}
