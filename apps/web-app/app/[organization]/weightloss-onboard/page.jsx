import { notFound } from "next/navigation";
import { Suspense } from "react";
import WeightlossOnboardForm from "@/app/weightloss-onboard/WeightlossOnboardForm";
import { getOrganizationData, listOrganizationSlugs } from "@/lib/getOrganizationData";

export function generateStaticParams() {
  return listOrganizationSlugs().map((organization) => ({ organization }));
}

export async function generateMetadata({ params }) {
  const org = await getOrganizationData(params.organization);
  if (!org) return { title: "Not found" };
  const seo = org.seo || {};
  return {
    title: `Weight Loss Onboarding · ${org.name}`,
    description: seo.description,
    alternates: { canonical: `/${org.slug}/weightloss-onboard` },
    robots: { index: false, follow: true },
    openGraph: {
      title: `Weight Loss Onboarding · ${org.name}`,
      description: seo.description,
      type: "website",
    },
  };
}

export default async function OrganizationOnboardingPage({ params }) {
  const org = await getOrganizationData(params.organization);
  if (!org) notFound();

  // The org's full branding (logo, contact info) is reused inside the form's
  // top bar. Onboarding-specific content (per-screen overrides) lives at
  // `org.onboarding`; absent keys fall back to each screen's defaults.
  return (
    <Suspense fallback={null}>
      <WeightlossOnboardForm
        content={org.onboarding || null}
        branding={onboardingBranding(org)}
        basePath={`/${org.slug}`}
        // The slug travels with every save-progress request so the backend
        // can stamp users/{uid}.orgSlug on first write (and ignore it on
        // updates — orgSlug is immutable after creation).
        orgSlug={org.slug}
      />
    </Suspense>
  );
}

// Maps the org's site-wide branding bundle to the smaller subset the form
// header expects (so we don't have to plumb the whole branding tree).
function onboardingBranding(org) {
  const b = org.branding || {};
  return {
    logoSrc: b.logoSrc ?? "/images/ongo-weight-loss-logo.webp",
    logoAlt: b.logoAlt ?? org.name,
    logoWidth: b.logoWidth ?? 220,
    logoHeight: b.logoHeight ?? 144,
    contactPhone: b.phone ?? "1 (888) 555-0123",
    contactPhoneHref: b.phoneHref ?? "tel:+18885550123",
    copyrightName: b.copyrightName ?? b.logoText ?? org.name,
  };
}
