// components/auth/DoctorLoginContent.jsx
//
// Reusable doctor sign-in panel — email/password only (no Google sign-in).
// Used by:
//   - /doctor/doctor-login                       (default Ongo entry)
//   - /[organization]/doctor/doctor-login        (per-portal entry)

"use client";

import AuthShell, { authStyles } from "@/components/auth/AuthShell";
import LoginEmailPasswordFields from "@/components/auth/LoginEmailPasswordFields";
import { useEmailPasswordSignIn } from "@/lib/auth/useEmailPasswordSignIn";
import { useLoginBackGuard } from "@/lib/auth/signOut";

export default function DoctorLoginContent({
  brand,
  panel,
  card,
  defaultNext = "/dashboard/doctor",
  resetReturnUrl = null,
  emailPlaceholder = "vanessa@your-clinic.com",
  emailLabel = "Work email",
  loginOrgSlug = null,
}) {
  useLoginBackGuard();

  const {
    email,
    setEmail,
    password,
    setPassword,
    error,
    fieldErrors,
    resetSent,
    resetInfo,
    submitting,
    canSubmit,
    signIn,
    sendResetEmail,
  } = useEmailPasswordSignIn({
    defaultNext,
    resetReturnUrl,
    loginOrgSlug,
    allowedRoles: ["doctor"],
    resetRole: "doctor",
  });

  return (
    <AuthShell variant="clinician" brand={brand} panel={panel} card={card}>
      <form onSubmit={signIn} className={authStyles.form} noValidate>
        <LoginEmailPasswordFields
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          fieldErrors={fieldErrors}
          emailLabel={emailLabel}
          emailPlaceholder={emailPlaceholder}
          onForgotPassword={sendResetEmail}
        />

        {error && (
          <div className={authStyles.error} role="alert">
            {error}
          </div>
        )}
        {resetInfo && (
          <div className={authStyles.info} role="status">
            {resetInfo}
          </div>
        )}
        {resetSent && (
          <div className={authStyles.info} role="status">
            If an account exists for that email, we sent password reset
            instructions. Check your inbox, then return here to sign in.
          </div>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className={authStyles.submit}
        >
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </AuthShell>
  );
}
