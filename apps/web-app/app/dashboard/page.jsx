// app/dashboard/page.jsx
//
// Role router. Anyone landing on /dashboard gets sent to the dashboard that
// matches their role. Not signed in → /login. Unknown role → /login as a
// safe fallback.
//
// This is the only place that knows the role → subroute mapping; each
// dashboard page enforces its own role using useRequireRole, so even a user
// who hand-types /dashboard/admin in the URL is bounced.

"use client";

import { signOut } from "firebase/auth";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase/auth";
import { useAuthUser } from "@/lib/auth/useAuthUser";
import { redirectAfterAuth } from "@/lib/auth/redirectAfterAuth";
import {
  markSignedOutSession,
  resolveLoginRedirectUrl,
  useAuthSessionGuard,
} from "@/lib/auth/signOut";
import {
  dashboardUrl,
  isSplitSiteMode,
  marketingUrl,
} from "@/lib/urls/siteOrigins";

const ROLE_HOME = {
  patient: "/dashboard/patient",
  doctor: "/dashboard/doctor",
  admin: "/dashboard/admin",
  // Super-admin shares the admin dashboard; APIs return cross-portal data
  // automatically when `auth.isSuper` is true (see `scopedOrgSlug`).
  superadmin: "/dashboard/admin",
};

export default function DashboardIndex() {
  const router = useRouter();
  const { user, profile, role, loading, profileReady } = useAuthUser();

  useAuthSessionGuard("/login");

  useEffect(() => {
    if (loading) return;
    if (!user) {
      if (isSplitSiteMode()) {
        window.location.assign(
          marketingUrl("/login", {
            query: { next: dashboardUrl("/dashboard") },
          }),
        );
      } else {
        router.replace("/login?next=/dashboard");
      }
      return;
    }
    if (!profileReady) return;
    if (!profile) {
      markSignedOutSession();
      signOut(auth)
        .catch(() => {})
        .finally(() => {
          window.location.replace(resolveLoginRedirectUrl("/login"));
        });
      return;
    }
    redirectAfterAuth({
      router,
      role,
      orgSlug: profile.orgSlug,
      defaultNext: ROLE_HOME[role] || "/dashboard/patient",
    });
  }, [loading, profileReady, user, profile, role, router]);

  // Brief flash while we wait for auth + role to resolve. No layout shift.
  return (
    <main style={{ padding: 32, fontFamily: 'var(--font-site)' }}>
      Loading your dashboard…
    </main>
  );
}
