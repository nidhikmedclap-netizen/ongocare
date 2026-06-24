// app/[organization]/login/page.jsx
//
// Per-portal patient sign-in page. Renders the same component as
// /login (PatientLoginContent) but wires brand + copy from the org
// config and points "Start your journey" at the org-scoped onboarding
// flow so visitors stay inside their portal end-to-end.

import { notFound } from "next/navigation";
import { Suspense } from "react";
import PatientLoginContent from "@/components/auth/PatientLoginContent";
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
    title: `Sign in · ${org.name}`,
    robots: { index: false, follow: true },
  };
}

export default async function OrganizationLoginPage({ params }) {
  const org = await getOrganizationData(params.organization);
  if (!org) notFound();

  const basePath = `/${org.slug}`;

  return (
    <Suspense fallback={<Fallback />}>
      <PatientLoginContent
        brand={logoBrandingFromOrg(org, basePath)}
        panel={{
          kicker: `${org.name} · Patient portal`,
          title: "Welcome back.",
          subtitle:
            org.branding?.tagline ||
            "Pick up your weight-loss plan, refills, and care messages right where you left off.",
          features: [
            { title: "Your progress", desc: "Weekly check-ins and weight trends" },
            { title: "Your medication", desc: "Refills, deliveries, and dosing schedule" },
            { title: "Your care team", desc: "Message your clinician and review notes" },
          ],
        }}
        card={{
          title: "Sign in to your dashboard",
          subtitle: "Use the email you signed up with.",
        }}
        defaultNext="/dashboard"
        startJourneyHref={`${basePath}/weightloss-onboard?start=1`}
        loginOrgSlug={org.slug}
        // Bare path — the hook resolves it against window.location.origin
        // at send time so this works in dev (localhost) and prod without
        // needing NEXT_PUBLIC_SITE_URL set.
        resetReturnUrl={`${basePath}/login`}
      />
    </Suspense>
  );
}

function Fallback() {
  return (
    <main className={authStyles.page}>
      <div className={authStyles.loadingFallback}>Loading…</div>
    </main>
  );
}
