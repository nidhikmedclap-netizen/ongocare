// app/[organization]/dashboard/admin/_AdminPortalShell.jsx
//
// Client wrapper that role-gates the per-portal admin dashboard, then
// renders the shared AdminSidebar with the org's branding + per-portal
// `basePath` so every nav link, brand link, and sign-out target stays
// inside the slug-scoped URL space.
//
// Tenant guard: if the signed-in admin's orgSlug doesn't match the URL
// slug, we redirect them to their own portal. Superadmins are allowed
// across all portals.

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRequireRole } from "@/lib/auth/useRequireRole";
import AdminSidebar from "@/app/dashboard/admin/AdminSidebar";
import { AdminPortalProvider } from "@/app/dashboard/admin/AdminPortalContext";
import AdminPortalBanner from "@/app/dashboard/admin/AdminPortalBanner";
import styles from "@/app/dashboard/patient/dashboard.module.css";

export default function AdminPortalShell({ slug, branding, children }) {
  const { ready, user, profile } = useRequireRole("admin");
  const router = useRouter();

  // Cross-tenant guard. Once auth has resolved and we know the user's
  // own portal, send them away if they wandered into a portal that
  // isn't theirs. Superadmins are exempt. Default Ongo users (orgSlug
  // "ongo" or unset) get routed to the un-slugged /dashboard/admin
  // because no /ongo/* route exists.
  const userOrg = profile?.orgSlug || null;
  const isSuper = profile?.role === "superadmin";
  useEffect(() => {
    if (!ready) return;
    if (isSuper) return;
    if (!userOrg || userOrg === slug) return;
    const target =
      userOrg === "ongo" ? "/dashboard/admin" : `/${userOrg}/dashboard/admin`;
    router.replace(target);
  }, [ready, isSuper, userOrg, slug, router]);

  if (!ready) {
    return <main className={styles.loading}>Loading admin console…</main>;
  }

  return (
    <AdminPortalProvider>
      <div className={styles.shell}>
        <AdminSidebar
          profile={profile}
          user={user}
          basePath={`/${slug}`}
          branding={branding}
        />
        <div className={styles.main}>
          <AdminPortalBanner />
          {children}
        </div>
      </div>
    </AdminPortalProvider>
  );
}
