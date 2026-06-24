// lib/orgs/portalLabels.js
//
// Human-readable portal names for UI. Slugs (medclap1, medclap2, …) stay in
// URLs, Firestore, and API params; labels come from data/organizations.js.

import { organizations, organizationSlugs } from "@/data/organizations";
import { DEFAULT_ORG_SLUG } from "@/lib/orgs";

export const ONGO_PORTAL_LABEL = "Ongo";

/** Display name for a portal slug, e.g. medclap1 → "MedClap One". */
export function portalDisplayName(slug) {
  if (!slug) return "—";
  if (slug === DEFAULT_ORG_SLUG) return ONGO_PORTAL_LABEL;
  return organizations[slug]?.name || slug;
}

/** Comma-separated display names for one or more portal slugs. */
export function formatPortalList(slugs) {
  const list = Array.isArray(slugs) ? slugs : slugs ? [slugs] : [];
  return list.filter(Boolean).map(portalDisplayName).join(", ");
}

/** Value/label pairs for portal <select> menus in admin forms. */
export const PORTAL_SELECT_OPTIONS = [
  { value: DEFAULT_ORG_SLUG, label: ONGO_PORTAL_LABEL },
  ...organizationSlugs.map((slug) => ({
    value: slug,
    label: organizations[slug]?.name || slug,
  })),
];
