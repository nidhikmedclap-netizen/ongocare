import SwiftUI

// Matches prototype #accountDeletePage — irreversible account deletion with "DELETE" confirmation
struct DeleteAccountView: View {
    @Environment(AppState.self) private var appState
    @Environment(\.dismiss) private var dismiss
    @State private var confirmText: String = ""
    @State private var isDeleting: Bool = false
    @State private var showFinalConfirm: Bool = false
    @State private var deleteError: String? = nil

    private var canDelete: Bool { confirmText == "DELETE" }

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(spacing: OngoSpacing.md) {
                // Warning card
                OngoCard(cornerRadius: OngoRadius.md) {
                    VStack(spacing: OngoSpacing.md) {
                        Image(systemName: "exclamationmark.triangle.fill")
                            .font(.system(size: 40))
                            .foregroundStyle(Color.ongoError)
                        Text("This cannot be undone")
                            .font(OngoFont.headline(20))
                        Text("Deleting your account permanently removes all your data from Ongo. This action is irreversible.")
                            .font(OngoFont.body())
                            .foregroundStyle(Color.ongoTextSecondary)
                            .multilineTextAlignment(.center)
                    }
                    .frame(maxWidth: .infinity)
                }

                // What gets deleted
                OngoCard {
                    VStack(alignment: .leading, spacing: OngoSpacing.sm) {
                        Text("What will be deleted")
                            .font(OngoFont.subheadline())

                        ForEach([
                            "Profile, medical history, and onboarding answers",
                            "Weight log, mood entries, water and step tracking",
                            "Past visit notes and prescription records",
                            "Active subscriptions (will be cancelled immediately)",
                        ], id: \.self) { item in
                            HStack(alignment: .top, spacing: OngoSpacing.sm) {
                                Image(systemName: "xmark.circle.fill")
                                    .font(.system(size: 16))
                                    .foregroundStyle(Color.ongoError)
                                Text(item)
                                    .font(OngoFont.body())
                                    .foregroundStyle(Color.ongoTextPrimary)
                            }
                        }
                    }
                }

                // Confirmation input
                OngoCard {
                    VStack(alignment: .leading, spacing: OngoSpacing.sm) {
                        Text("Type DELETE to confirm")
                            .font(OngoFont.subheadline())
                        OngoTextField(
                            placeholder: "Type DELETE here",
                            text: $confirmText,
                            keyboardType: .asciiCapable
                        )
                        .onChange(of: confirmText) { _, new in
                            confirmText = String(new.prefix(6)).uppercased()
                        }
                    }
                }

                // Error
                if let error = deleteError {
                    Text(error)
                        .font(OngoFont.caption())
                        .foregroundStyle(Color.ongoError)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }

                // Delete button
                Button {
                    showFinalConfirm = true
                } label: {
                    HStack {
                        if isDeleting { ProgressView().tint(.white) }
                        Text(isDeleting ? "Deleting…" : "Delete my account")
                            .font(OngoFont.subheadline())
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .background(canDelete ? Color.ongoError : Color.ongoTextTertiary)
                    .foregroundStyle(.white)
                    .clipShape(RoundedRectangle(cornerRadius: OngoRadius.pill))
                }
                .disabled(!canDelete || isDeleting)
                .confirmationDialog(
                    "Are you absolutely sure?",
                    isPresented: $showFinalConfirm,
                    titleVisibility: .visible
                ) {
                    Button("Delete my account", role: .destructive) {
                        Task { await deleteAccount() }
                    }
                    Button("Cancel", role: .cancel) {}
                } message: {
                    Text("This action is permanent and cannot be reversed.")
                }
            }
            .padding(.horizontal, OngoSpacing.md)
            .padding(.vertical, OngoSpacing.md)
            .padding(.bottom, 100)
        }
        .background(Color.ongoBackground)
        .navigationTitle("Delete Account")
        .navigationBarTitleDisplayMode(.inline)
        .dismissKeyboardOnTap()
    }

    @MainActor private func deleteAccount() async {
        guard canDelete else { return }
        isDeleting = true
        deleteError = nil
        do {
            try await appState.auth.deleteAccount()
            appState.signOut()
        } catch {
            deleteError = "Failed to delete account: \(error.localizedDescription)"
            isDeleting = false
        }
    }
}
