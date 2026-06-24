// app/auth/handoff/page.jsx
//
// Dashboard-site landing page: completes cross-domain login via custom token.

"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signInWithCustomToken } from "firebase/auth";
import { auth } from "@/lib/firebase/auth";
import { isSafeDashboardPath, marketingLoginRedirectForDashboardPath } from "@/lib/urls/siteOrigins";
import { dashboardPathForRole } from "@/lib/urls/dashboardPaths";

function redirectToLogin(nextPath) {
  const safeNext = isSafeDashboardPath(nextPath)
    ? nextPath
    : dashboardPathForRole("patient", null);
  window.location.replace(marketingLoginRedirectForDashboardPath(safeNext));
}

function HandoffInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handoffId = searchParams.get("handoff");
    const next =
      searchParams.get("next") || dashboardPathForRole("patient", null);

    if (!handoffId) {
      redirectToLogin(next);
      return;
    }

    if (!isSafeDashboardPath(next)) {
      redirectToLogin(dashboardPathForRole("patient", null));
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/auth/handoff/consume", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ handoffId }),
        });
        const data = await res.json();
        if (!data?.success || !data?.customToken) {
          throw new Error(data?.message || "Handoff expired.");
        }
        await signInWithCustomToken(auth, data.customToken);
        if (cancelled) return;
        router.replace(next);
      } catch {
        if (!cancelled) {
          redirectToLogin(next);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams, router]);

  return (
    <main style={{ padding: 32, fontFamily: 'var(--font-site)' }}>
      <p style={{ color: "var(--color-text-muted, #64748b)" }}>
        Signing you in…
      </p>
    </main>
  );
}

export default function AuthHandoffPage() {
  return (
    <Suspense
      fallback={
        <main style={{ padding: 32, fontFamily: 'var(--font-site)' }}>
          Signing you in…
        </main>
      }
    >
      <HandoffInner />
    </Suspense>
  );
}
