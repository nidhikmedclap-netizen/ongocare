// app/[organization]/admin/admin-login/page.jsx
//
// Per-portal admin sign-in. Mirrors /admin/admin-login but with the org's
// branding. Note: admins are seeded out-of-band (scripts/seed-admin.js)
// and the user doc is the source of truth for orgSlug — this URL just
// gives portal admins a branded entry point they can bookmark.

import { notFound } from "next/navigation";
import { Suspense } from "react";
import AdminLoginContent from "@/components/auth/AdminLoginContent";
import { authStyles } from "@/components/auth/AuthShell";
import { logoBrandingFromOrg } from "@/lib/branding/defaults";
import {
  getOrganizationData,
  listOrganizationSlugs,
} from "@/lib/getOrganizationData";

export function generateStaticParams() {
  return listOrganizationSlugs().map((organization) => ({ organization }));
}

export async function generateMetadata({ params }) {
  const org = await getOrganizationData(params.organization);
  if (!org) return { title: "Not found" };
  return {
    title: `Admin sign in · ${org.name}`,
    robots: { index: false, follow: false },
  };
}

export default async function OrganizationAdminLoginPage({ params }) {
  const org = await getOrganizationData(params.organization);
  if (!org) notFound();

  const basePath = `/${org.slug}`;

  return (
    <Suspense fallback={<Fallback />}>
      <AdminLoginContent
        brand={logoBrandingFromOrg(org, basePath)}
        panel={{
          kicker: `${org.name} · Operations console`,
          title: "Sign in to manage the portal.",
          subtitle:
            "Review clinician applications, manage patient accounts, and keep an eye on bookings and revenue for your portal.",
          features: [
            { title: "Doctor verification", desc: "Approve, reject, and prioritize clinicians" },
            { title: "Patient & account oversight", desc: "Search, edit, or remove user accounts" },
            { title: "Activity & growth", desc: "Daily signups, bookings, and revenue at a glance" },
          ],
        }}
        card={{
          kicker: `${org.name} administrator sign in`,
          title: "Sign in to the admin console",
          subtitle: "Authorized personnel only.",
        }}
        defaultNext={`${basePath}/dashboard/admin`}
        loginOrgSlug={org.slug}
        emailPlaceholder={`admin@${org.slug}.example`}
      />
    </Suspense>
  );
}

function Fallback() {
  return (
    <main className={`${authStyles.page} ${authStyles.clinician}`}>
      <div className={authStyles.loadingFallback}>Loading…</div>
    </main>
  );
}
