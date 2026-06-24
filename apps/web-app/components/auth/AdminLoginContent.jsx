// components/auth/AdminLoginContent.jsx
//
// Reusable admin sign-in panel. Used by:
//   - /admin/admin-login                       (default Ongo entry)
//   - /[organization]/admin/admin-login        (per-portal entry)

"use client";

import AuthShell, { authStyles } from "@/components/auth/AuthShell";
import LoginEmailPasswordFields from "@/components/auth/LoginEmailPasswordFields";
import { useEmailPasswordSignIn } from "@/lib/auth/useEmailPasswordSignIn";
import { useLoginBackGuard } from "@/lib/auth/signOut";

export default function AdminLoginContent({
  brand,
  panel,
  card,
  defaultNext = "/dashboard/admin",
  emailPlaceholder = "admin@example.com",
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
    submitting,
    canSubmit,
    signIn,
  } = useEmailPasswordSignIn({
    defaultNext,
    loginOrgSlug,
    allowedRoles: ["admin", "superadmin"],
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
          emailLabel="Admin email"
          emailPlaceholder={emailPlaceholder}
        />

        {error && (
          <div className={authStyles.error} role="alert">
            {error}
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
