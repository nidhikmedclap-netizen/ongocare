// app/admin/admin-login/page.jsx
//
// Default Ongo admin sign-in. Per-portal admin login lives at
// /<slug>/admin/admin-login and reuses the same content component.
// Lives on its own URL with no link from the public marketing site so the
// entry point isn't advertised to end users.

"use client";

import { Suspense } from "react";
import AdminLoginContent from "@/components/auth/AdminLoginContent";
import { authStyles } from "@/components/auth/AuthShell";
import { DEFAULT_LOGO } from "@/lib/branding/defaults";
import { DEFAULT_ORG_SLUG } from "@/lib/orgs";

const BRAND = {
  href: "/",
  ...DEFAULT_LOGO,
};

const PANEL = {
  kicker: "Operations console",
  title: "Sign in to manage the platform.",
  subtitle:
    "Review clinician applications, manage patient accounts, and keep an eye on bookings and revenue.",
  features: [
    {
      title: "Doctor verification",
      desc: "Approve, reject, and prioritize clinicians",
    },
    {
      title: "Patient & account oversight",
      desc: "Search, edit, or remove user accounts",
    },
    {
      title: "Activity & growth",
      desc: "Daily signups, bookings, and revenue at a glance",
    },
  ],
};

const CARD = {
  kicker: "Administrator sign in",
  title: "Sign in to the admin console",
  subtitle: "Authorized personnel only.",
};

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<AdminLoginFallback />}>
      <AdminLoginContent
        brand={BRAND}
        panel={PANEL}
        card={CARD}
        defaultNext="/dashboard/admin"
        loginOrgSlug={DEFAULT_ORG_SLUG}
        emailPlaceholder="admin@ongo.example"
      />
    </Suspense>
  );
}

function AdminLoginFallback() {
  return (
    <main className={`${authStyles.page} ${authStyles.clinician}`}>
      <div className={authStyles.loadingFallback}>Loading…</div>
    </main>
  );
}
