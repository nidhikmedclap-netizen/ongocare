// app/[organization]/doctor/doctor-login/page.jsx
//
// Per-portal doctor sign-in. Mirrors /doctor/doctor-login but with the
// org's branding and an org-scoped "Register as a doctor" link.

import { notFound } from "next/navigation";
import { Suspense } from "react";
import DoctorLoginContent from "@/components/auth/DoctorLoginContent";
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
    title: `Clinician sign in · ${org.name}`,
    robots: { index: false, follow: true },
  };
}

export default async function OrganizationDoctorLoginPage({ params }) {
  const org = await getOrganizationData(params.organization);
  if (!org) notFound();

  const basePath = `/${org.slug}`;

  return (
    <Suspense fallback={<Fallback />}>
      <DoctorLoginContent
        brand={logoBrandingFromOrg(org, basePath)}
        panel={{
          kicker: `${org.name} · Clinician portal`,
          title: "Welcome back.",
          subtitle:
            "Sign in to see today's consults, manage your availability, and review payouts.",
          features: [
            { title: "Patients & consults", desc: "Your dashboard, charts, and chart notes" },
            { title: "Availability", desc: "Adjust weekly hours and block-out dates" },
            { title: "Payouts", desc: "Track earnings and update banking" },
          ],
          footnote: {
            text: `New to ${org.name}?`,
            // Per-portal doctor signup — stamps the tenant at signup time
            // without needing a ?org= query parameter.
            linkHref: `${basePath}/doctor/doctor-onboard`,
            linkLabel: "Register as a doctor →",
          },
        }}
        card={{
          kicker: "Doctor sign in",
          title: "Sign in to your dashboard",
          subtitle: "Use the work email you registered with.",
        }}
        defaultNext={`${basePath}/dashboard/doctor`}
        loginOrgSlug={org.slug}
        resetReturnUrl={`${basePath}/doctor/doctor-login`}
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
