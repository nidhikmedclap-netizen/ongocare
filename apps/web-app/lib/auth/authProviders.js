// Pure auth-provider helpers — safe for client and server (no firebase-admin).

export const GOOGLE_SIGN_IN_ONLY_CODE = "google-sign-in-only";

export const GOOGLE_SIGN_IN_ONLY_MESSAGE =
  "This account uses Google sign-in. Manage your password in your Google Account (Google Account → Security → Password), or continue signing in with Google.";

export const DOCTOR_EMAIL_PASSWORD_ONLY_CODE = "email-password-only";

export const DOCTOR_EMAIL_PASSWORD_ONLY_MESSAGE =
  "Doctor accounts sign in with email and password only. Google sign-in is not available on the clinician login page.";

/** True when the Auth user can only sign in via Google (no email/password provider). */
export function isGoogleOnlyAuthUser(authUser) {
  const providers = new Set(
    (authUser?.providerData || []).map((p) => p.providerId).filter(Boolean),
  );
  if (!providers.has("google.com")) return false;
  return !providers.has("password");
}
