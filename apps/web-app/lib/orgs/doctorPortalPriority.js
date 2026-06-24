// lib/orgs/doctorPortalPriority.js
//
// Per-portal doctor priority for the patient picker. Each portal maintains
// its own 1-based rank (1 = shown first). Safe for client + server.

import { normalizeOrgSlug } from "@/services/firebase/users";
import { resolveDoctorOrgSlugs } from "@/lib/orgs/doctorPortals";

/** Parse and validate a priority rank (whole number >= 1). */
export function parsePortalPriority(value) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1) return null;
  return n;
}

/** Normalize portalPriorities keys so reads/writes use one canonical slug. */
export function normalizedPortalPriorities(profileOrData) {
  const map = profileOrData?.portalPriorities;
  if (!map || typeof map !== "object") return {};
  const out = {};
  for (const [key, value] of Object.entries(map)) {
    const slug = normalizeOrgSlug(key);
    const parsed = parsePortalPriority(value);
    if (parsed != null) out[slug] = parsed;
  }
  return out;
}

/**
 * Priority for one portal. Uses portalPriorities[slug] only for multi-portal
 * doctors. Legacy single `priority` applies only when the doctor serves one
 * portal (migration path).
 */
export function resolveDoctorPriorityForPortal(profileOrData, orgSlug) {
  if (!orgSlug) return 0;
  const slug = normalizeOrgSlug(orgSlug);
  const map = normalizedPortalPriorities(profileOrData);
  if (map[slug] != null) return map[slug];

  const slugs = resolveDoctorOrgSlugs(profileOrData);
  if (slugs.length > 1) return 0;

  const legacy = parsePortalPriority(profileOrData?.priority);
  if (legacy == null) return 0;
  if (slugs.length === 1 && slugs[0] === slug) return legacy;

  const primary = normalizeOrgSlug(profileOrData?.orgSlug || slugs[0]);
  if (primary === slug) return legacy;

  return 0;
}

/** Build updated portalPriorities map with one portal set. */
export function withPortalPriority(profileOrData, orgSlug, priority) {
  const slug = normalizeOrgSlug(orgSlug);
  const parsed = parsePortalPriority(priority);
  if (parsed == null) {
    throw new Error("Priority must be a whole number of 1 or higher");
  }
  const base = normalizedPortalPriorities(profileOrData);
  base[slug] = parsed;
  return base;
}
