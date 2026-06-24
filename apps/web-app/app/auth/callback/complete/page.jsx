// app/auth/callback/complete/page.jsx
//
// Legacy redirect shim — handoff callback now lands on the dashboard directly.
// If an old bookmark hits this URL, forward when the session cookie is valid.

"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  dashboardPathForRole,
  dashboardUrl,
  isSafeDashboardPath,
  marketingLoginRedirectForDashboardPath,
  normalizeDashboardNext,
} from "@/lib/urls/siteOrigins";

function redirectToLogin(nextPath) {
  const safeNext = isSafeDashboardPath(nextPath)
    ? nextPath
    : dashboardPathForRole("patient", null);
  window.location.replace(marketingLoginRedirectForDashboardPath(safeNext));
}

function CompleteInner() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const next =
      normalizeDashboardNext(searchParams.get("next")) ||
      dashboardPathForRole("patient", null);

    if (!isSafeDashboardPath(next)) {
      redirectToLogin(dashboardPathForRole("patient", null));
      return;
    }

    (async () => {
      try {
        const establishRes = await fetch("/api/auth/establish", {
          method: "POST",
          credentials: "include",
        });
        if (establishRes.ok) {
          const establishData = await establishRes.json();
          if (establishData?.customToken) {
            const { signInWithCustomToken } = await import("firebase/auth");
            const { auth } = await import("@/lib/firebase/auth");
            await signInWithCustomToken(auth, establishData.customToken);
          }
        }

        const statusRes = await fetch("/api/auth/session/status", {
          credentials: "include",
        });
        if (statusRes.ok) {
          window.location.replace(dashboardUrl(next));
          return;
        }
      } catch {
        // fall through
      }
      redirectToLogin(next);
    })();
  }, [searchParams]);

  return (
    <main style={{ padding: 32, fontFamily: "var(--font-site)" }}>
      <p style={{ color: "var(--color-text-muted, #64748b)" }}>
        Signing you in…
      </p>
    </main>
  );
}

export default function AuthCallbackCompletePage() {
  return (
    <Suspense
      fallback={
        <main style={{ padding: 32, fontFamily: "var(--font-site)" }}>
          Signing you in…
        </main>
      }
    >
      <CompleteInner />
    </Suspense>
  );
}
