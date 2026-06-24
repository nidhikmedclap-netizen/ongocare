// lib/branding/orgBranding.js
//
// Resolve organization display + email branding for any portal slug.

import { DEFAULT_LOGO, EMAIL_LOGO } from "@/lib/branding/defaults";
import { DEFAULT_ORG_SLUG } from "@/lib/orgs";
import { portalDisplayName } from "@/lib/orgs/portalLabels";
import { getOrganizationData } from "@/lib/getOrganizationData";

const DEFAULT_ONGO_BRANDING = {
  name: "Ongo Weight Loss",
  shortName: "Ongo",
  tagline: "Doctor-led GLP-1 weight loss plans built around you.",
  email: "info@ongoweightloss.com",
  copyrightName: "Ongo Weight Loss",
  footerTagline: "Doctor-led GLP-1 care, made for you.",
  logoSrc: DEFAULT_LOGO.logoSrc,
  logoAlt: DEFAULT_LOGO.logoAlt,
};

/** Branding fields used in transactional emails. */
export async function resolveOrgEmailBranding(orgSlug) {
  const slug = orgSlug || DEFAULT_ORG_SLUG;
  const org =
    slug === DEFAULT_ORG_SLUG ? null : await getOrganizationData(slug);
  const branding = org?.branding || {};

  return {
    orgSlug: slug,
    orgName: org?.name || portalDisplayName(slug),
    shortName: branding.shortName || branding.logoText || portalDisplayName(slug),
    tagline: branding.tagline || DEFAULT_ONGO_BRANDING.tagline,
    supportEmail: branding.email || DEFAULT_ONGO_BRANDING.email,
    contactEmail: branding.email || DEFAULT_ONGO_BRANDING.email,
    copyrightName: branding.copyrightName || org?.name || DEFAULT_ONGO_BRANDING.copyrightName,
    footerTagline: branding.footerTagline || DEFAULT_ONGO_BRANDING.footerTagline,
    logoSrc: branding.logoSrc || DEFAULT_ONGO_BRANDING.logoSrc,
    logoAlt: branding.logoAlt || org?.name || DEFAULT_ONGO_BRANDING.logoAlt,
    emailLogoSrc: branding.emailLogoSrc || EMAIL_LOGO.logoSrc,
    emailLogoAlt: branding.emailLogoAlt || branding.logoAlt || org?.name || EMAIL_LOGO.logoAlt,
  };
}
