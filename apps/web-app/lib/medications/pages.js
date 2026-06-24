import { getLiveMedications } from "./content";

/** Build path for a medication landing page. */
export function medicationPath(slug) {
  return `/medications/${slug}`;
}

/** @deprecated Use medicationPath("wegovy") — kept for existing imports */
export const WEGOVY_PAGE = medicationPath("wegovy");

export const MEDICATION_NAV = getLiveMedications().map((med) => ({
  href: medicationPath(med.slug),
  label: med.name,
  live: med.live,
}));
