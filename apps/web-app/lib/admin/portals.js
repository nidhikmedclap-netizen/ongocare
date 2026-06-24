// lib/admin/portals.js
//
// Portal list for the super-admin sidebar filter. Client-safe — no
// firebase-admin imports.

import {
  formatPortalList,
  ONGO_PORTAL_LABEL,
  PORTAL_SELECT_OPTIONS,
  portalDisplayName,
} from "@/lib/orgs/portalLabels";

/** Sentinel value — show data from every portal (no org filter). */
export const PORTAL_FILTER_ALL = "all";

export const ADMIN_PORTAL_OPTIONS = [
  { value: PORTAL_FILTER_ALL, label: "All portals" },
  ...PORTAL_SELECT_OPTIONS,
];

export function portalFilterLabel(value) {
  if (!value || value === PORTAL_FILTER_ALL) return "All portals";
  return portalDisplayName(value);
}

export function adminApiUrl(path, portalFilter) {
  if (!portalFilter || portalFilter === PORTAL_FILTER_ALL) return path;
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}org=${encodeURIComponent(portalFilter)}`;
}

// Re-export for admin pages that need select options or table labels.
export { ONGO_PORTAL_LABEL, PORTAL_SELECT_OPTIONS, portalDisplayName, formatPortalList };
