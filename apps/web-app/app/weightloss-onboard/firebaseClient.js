// app/weightloss-onboard/firebaseClient.js
//
// Client-side helpers for the onboarding form's auth + persistence flow.
//
// Design — user types email + password on Screen S20:
//
//   1. Create a NEW Firebase Auth user. Strict separation — we never try
//      sign-in here. If the email is already registered (regardless of
//      password) we hard-fail with EMAIL_ALREADY_REGISTERED and direct the
//      user to /login. Onboarding is for new patients only; returning
//      patients sign in via the dedicated /login page.
//   2. Fire-and-forget a Firebase email-verification email. The user can
//      verify later from the dashboard banner — we don't block signup or
//      the onboarding flow on it.
//   3. Call our save-progress route to persist the form snapshot into
//      users/{uid}.
//
// Passwords NEVER leave the browser except via the Firebase Auth SDK, which
// sends them over HTTPS straight to Firebase. Our backend never sees them
// and our Firestore document never stores them.

"use client";

import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
} from "firebase/auth";
import { auth } from "@/lib/firebase/auth";
import { signInWithGoogle } from "@/lib/auth/googleSignIn";

/**
 * Strict-separation registration for the onboarding form's email screen.
 * Only creates new Firebase Auth accounts — never signs in. If the email is
 * already registered, the user is redirected to /login.
 *
 * Email plausibility / ownership is NOT checked upfront here. Firebase Auth
 * validates the syntax server-side; ownership is confirmed asynchronously
 * via the verification email + dashboard banner.
 *
 * Throws on:
 *   - 'EMAIL_ALREADY_REGISTERED' → an account with this email already exists
 *   - 'WEAK_PASSWORD'            → Firebase rejected the password
 *   - any other unexpected error
 */
/**
 * Google sign-up / sign-in for the onboarding email screen.
 * Returns isNew=false when the Google account already exists (user should
 * go to /login instead of continuing onboarding as a new patient).
 */
export async function signUpWithGoogle() {
  const { uid, email, isNew } = await signInWithGoogle();
  if (!isNew) {
    const e = new Error(
      "This email is already registered. Please sign in to continue.",
    );
    e.kind = "EMAIL_ALREADY_REGISTERED";
    throw e;
  }
  return { uid, email, isNew: true };
}

export async function signUpNewUser(email, password) {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    // Fire-and-forget verification email. The dashboard banner was removed,
    // but the email still goes out as a courtesy so users CAN verify later
    // if we ever gate features (e.g. payment) on emailVerified === true.
    sendEmailVerification(cred.user).catch((err) => {
      // eslint-disable-next-line no-console
      console.warn("[verification] initial send failed:", err);
    });
    return { uid: cred.user.uid, isNew: true };
  } catch (err) {
    const code = err?.code || "";
    if (code === "auth/email-already-in-use") {
      const e = new Error(
        "This email is already registered. Please sign in to continue.",
      );
      e.kind = "EMAIL_ALREADY_REGISTERED";
      throw e;
    }
    if (code === "auth/weak-password") {
      const e = new Error("Password is too weak. Please choose a stronger one.");
      e.kind = "WEAK_PASSWORD";
      throw e;
    }
    throw err;
  }
}

/**
 * Resend the verification email to the currently-signed-in user. Returns
 * true if Firebase accepted the request; throws a friendly error otherwise.
 * Common failure: `auth/too-many-requests` if the user has hit Firebase's
 * rate limit (typically 5 sends in 5 minutes).
 */
export async function resendVerificationEmail() {
  const user = auth.currentUser;
  if (!user) throw new Error("Sign in first.");
  if (user.emailVerified) return { alreadyVerified: true };
  await sendEmailVerification(user);
  return { alreadyVerified: false };
}

/**
 * After the user clicks the link in their verification email (in a separate
 * tab or device), our local Firebase Auth session still thinks
 * emailVerified === false because the cached ID token is up to an hour old.
 * Call this to force a token refresh and pull the latest verification state
 * from Firebase.
 */
export async function refreshVerificationStatus() {
  const user = auth.currentUser;
  if (!user) return { verified: false, signedIn: false };
  await user.reload();
  // Force a token refresh so the next save-progress request carries the
  // updated email_verified claim — which our save-progress route mirrors
  // into Firestore so the dashboard banner disappears.
  await user.getIdToken(true);
  return { verified: user.emailVerified, signedIn: true };
}

/**
 * Trigger a branded password-reset email via the server API (role + portal checks).
 */
export async function sendResetEmail(email, { role = "patient", orgSlug = null } = {}) {
  const res = await fetch("/api/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: String(email || "").trim().toLowerCase(),
      role,
      orgSlug,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Could not send reset email.");
  }
  return data;
}

/**
 * Save the current form snapshot for the signed-in user.
 * Best-effort: failures are swallowed so a background save never blocks UX.
 * Sends `password` is stripped server-side regardless, but we also strip it
 * here defensively so it never even goes over the wire.
 *
 * `orgSlug` identifies the portal the user is signing up on. Only honored
 * by the server on the first save (doc creation) — subsequent saves can't
 * move a user between portals.
 */
export async function saveOnboardingProgress(
  form,
  currentStep,
  status,
  orgSlug,
  stepHistory,
  options = {},
) {
  const user = auth.currentUser;
  if (!user) return { skipped: true };

  let idToken;
  try {
    idToken = await user.getIdToken();
  } catch {
    return { skipped: true };
  }

  // Defensive: strip auth-related fields before sending. Server also blocks
  // these (services/firebase/users.js BLOCKLISTED_FIELDS), but no reason to
  // even put them on the wire.
  const { password, passwordConfirm, ...safeForm } = form || {};

  try {
    const res = await fetch("/api/onboarding/save-progress", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        form: safeForm,
        currentStep,
        status,
        orgSlug,
        ...(Array.isArray(stepHistory) && stepHistory.length
          ? { stepHistory }
          : {}),
        ...(options.welcomeEmailTrigger ? { welcomeEmailTrigger: true } : {}),
      }),
      keepalive: true,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[onboarding] save-progress network error:", err);
  }
  return { skipped: false };
}

/**
 * Resolves once Firebase Auth has restored its session from storage (or
 * determined that none exists). Useful for hydration on mount.
 */
export function waitForAuthReady() {
  return new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, (user) => {
      unsub();
      resolve(user);
    });
  });
}
