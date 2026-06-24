// app/[organization]/doctor/doctor-onboard/page.jsx
//
// Per-portal doctor registration. Mirrors /doctor/doctor-onboard but with
// the org's brand + copy applied to the chrome, and `orgSlug` pre-populated
// so the new users/{uid} doc gets stamped with the right tenant on signup.

import { notFound } from "next/navigation";
import DoctorOnboardForm from "@/app/doctor/doctor-onboard/DoctorOnboardForm";
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
    title: `Doctor registration · ${org.name}`,
    robots: { index: false, follow: true },
  };
}

export default async function OrganizationDoctorOnboardPage({ params }) {
  const org = await getOrganizationData(params.organization);
  if (!org) notFound();

  const basePath = `/${org.slug}`;

  return (
    <DoctorOnboardForm
      orgSlug={org.slug}
      branding={{
        ...logoBrandingFromOrg(org, basePath),
        brandHref: basePath,
        signInHref: `${basePath}/doctor/doctor-login`,
      }}
      copy={{
        kicker: `${org.name} · Doctor registration`,
        title: `Join the ${org.name} care network.`,
        subtitle: `Set up your clinician profile, licensure, availability, and payout details for ${org.name}. Patients can book you the moment you finish.`,
        consent: `I confirm the licenses, signature, and banking details above are accurate, and I agree to ${org.name}'s clinician terms.`,
      }}
    />
  );
}
