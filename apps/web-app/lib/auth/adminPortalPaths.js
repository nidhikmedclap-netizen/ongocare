// lib/auth/adminPortalPaths.js
//
// URL helpers for portal-scoped admin login + dashboard routes.

import { DEFAULT_ORG_SLUG } from "@/lib/orgs";
import { ONGO_PORTAL_LABEL, portalDisplayName } from "@/lib/orgs/portalLabels";
import { loginPathForRole as dashboardLoginPathForRole } from "@/lib/urls/dashboardPaths";

export function normalizePortalSlug(slug) {
  if (!slug || slug === DEFAULT_ORG_SLUG) return DEFAULT_ORG_SLUG;
  return slug;
}

/** Admin sign-in URL for a portal. Default Ongo uses the un-slugged path. */
export function adminLoginPath(orgSlug) {
  const slug = normalizePortalSlug(orgSlug);
  if (slug === DEFAULT_ORG_SLUG) return "/admin/admin-login";
  return `/${slug}/admin/admin-login`;
}

/** Admin dashboard URL for a portal. */
export function adminDashboardPath(orgSlug) {
  const slug = normalizePortalSlug(orgSlug);
  if (slug === DEFAULT_ORG_SLUG) return "/dashboard/admin";
  return `/${slug}/dashboard/admin`;
}

export function portalsMatch(userOrgSlug, loginOrgSlug) {
  return (
    normalizePortalSlug(userOrgSlug) === normalizePortalSlug(loginOrgSlug)
  );
}

/** Shown when a user signs in on the wrong portal's login page. */
export function portalMismatchMessage(userOrgSlug, role = "patient") {
  const slug = normalizePortalSlug(userOrgSlug);
  const pathRole = role === "superadmin" ? "admin" : role;
  const loginPath = dashboardLoginPathForRole(pathRole, slug);
  const portalLabel =
    slug === DEFAULT_ORG_SLUG
      ? `${ONGO_PORTAL_LABEL} (default portal)`
      : `${portalDisplayName(slug)} portal`;
  return (
    `Your account belongs to the ${portalLabel}. ` +
    `You cannot sign in here. Use ${loginPath} instead.`
  );
}

export function adminPortalMismatchMessage(userOrgSlug) {
  return portalMismatchMessage(userOrgSlug, "admin");
}
