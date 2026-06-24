// components/auth/PatientLoginContent.jsx
//
// Reusable patient sign-in panel shared by:
//   - /login                       (default Ongo entry)
//   - /[organization]/login        (per-portal entry)

"use client";

import Link from "next/link";
import AuthShell, { authStyles } from "@/components/auth/AuthShell";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";
import HipaaGoogleConsentModal from "@/components/auth/HipaaGoogleConsentModal";
import LoginEmailPasswordFields from "@/components/auth/LoginEmailPasswordFields";
import { useEmailPasswordSignIn } from "@/lib/auth/useEmailPasswordSignIn";
import { useLoginBackGuard } from "@/lib/auth/signOut";

export default function PatientLoginContent({
  brand,
  panel,
  card,
  defaultNext = "/dashboard",
  startJourneyHref = "/weightloss-onboard?start=1",
  resetReturnUrl = null,
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
    signInWithGoogleAccount,
    sendResetEmail,
    hipaaModalOpen,
    hipaaSubmitting,
    hipaaError,
    confirmGoogleHipaa,
    cancelGoogleHipaa,
  } = useEmailPasswordSignIn({
    defaultNext,
    resetReturnUrl,
    loginOrgSlug,
    allowedRoles: ["patient"],
    resetRole: "patient",
    googleHipaaBootstrap: true,
  });

  return (
    <AuthShell variant="patient" brand={brand} panel={panel} card={card}>
      <HipaaGoogleConsentModal
        open={hipaaModalOpen}
        submitting={hipaaSubmitting}
        error={hipaaError}
        onConfirm={confirmGoogleHipaa}
        onCancel={cancelGoogleHipaa}
      />
      <form onSubmit={signIn} className={authStyles.form} noValidate>
        <LoginEmailPasswordFields
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          fieldErrors={fieldErrors}
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

        <div className={authStyles.orRow}>
          <span className={authStyles.orLine} aria-hidden />
          <span className={authStyles.orLabel}>or</span>
          <span className={authStyles.orLine} aria-hidden />
        </div>

        <GoogleSignInButton
          onClick={signInWithGoogleAccount}
          disabled={submitting}
        />

        <p className={authStyles.smallMeta}>
          Don&apos;t have an account?{" "}
          <Link href={startJourneyHref} className={authStyles.metaLink}>
            Start your journey →
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
