// app/[organization]/dashboard/patient/_PatientPortalShell.jsx
//
// Client wrapper that role-gates the per-portal patient dashboard, enforces
// tenant isolation, and renders the shared PatientSidebar with per-portal
// branding + per-portal basePath.

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRequireRole } from "@/lib/auth/useRequireRole";
import PatientSidebar from "@/app/dashboard/patient/PatientSidebar";
import VerificationBanner from "@/app/dashboard/patient/VerificationBanner";
import styles from "@/app/dashboard/patient/dashboard.module.css";

export default function PatientPortalShell({ slug, branding, children }) {
  const { ready, user, profile } = useRequireRole("patient");
  const router = useRouter();

  // Cross-tenant guard. Ongo users (orgSlug "ongo") get bounced to the
  // un-slugged /dashboard/patient because no /ongo/* route exists.
  const userOrg = profile?.orgSlug || null;
  useEffect(() => {
    if (!ready) return;
    if (!userOrg || userOrg === slug) return;
    const target =
      userOrg === "ongo" ? "/dashboard/patient" : `/${userOrg}/dashboard/patient`;
    router.replace(target);
  }, [ready, userOrg, slug, router]);

  if (!ready) {
    return <main className={styles.loading}>Loading your dashboard…</main>;
  }

  return (
    <div className={styles.shell}>
      <PatientSidebar
        profile={profile}
        user={user}
        basePath={`/${slug}`}
        branding={branding}
      />
      <div className={styles.main}>
        <VerificationBanner />
        {children}
      </div>
    </div>
  );
}
