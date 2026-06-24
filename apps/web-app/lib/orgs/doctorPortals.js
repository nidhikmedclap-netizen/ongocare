// lib/orgs/doctorPortals.js
//
// Helpers for doctors assigned to one or more portals. Safe for client + server.

import { DEFAULT_ORG_SLUG } from "@/lib/orgs";

function normalizeDoctorPortalSlug(slug) {
  if (!slug || slug === DEFAULT_ORG_SLUG) return DEFAULT_ORG_SLUG;
  return String(slug).trim().toLowerCase();
}

/** All portals a doctor is assigned to (falls back to legacy orgSlug). */
export function resolveDoctorOrgSlugs(profileOrData) {
  if (
    Array.isArray(profileOrData?.orgSlugs) &&
    profileOrData.orgSlugs.length > 0
  ) {
    return [...new Set(profileOrData.orgSlugs.map(normalizeDoctorPortalSlug))];
  }
  return [normalizeDoctorPortalSlug(profileOrData?.orgSlug || DEFAULT_ORG_SLUG)];
}

/** Whether a doctor serves patients / may access this portal. */
export function doctorBelongsToPortal(profileOrData, orgSlug) {
  if (!orgSlug) return true;
  return resolveDoctorOrgSlugs(profileOrData).includes(
    normalizeDoctorPortalSlug(orgSlug),
  );
}

/** Validate super-admin portal assignment input. */
export function sanitizeDoctorOrgSlugsInput(input) {
  if (!Array.isArray(input) || input.length === 0) {
    throw new Error("At least one portal is required.");
  }
  const slugs = [...new Set(input.map(normalizeDoctorPortalSlug))];
  if (slugs.length === 0) {
    throw new Error("At least one portal is required.");
  }
  return slugs;
}
