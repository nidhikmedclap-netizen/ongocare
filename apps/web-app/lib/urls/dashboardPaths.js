// lib/urls/dashboardPaths.js
//
// Dashboard path builders shared by auth hooks, middleware, and URL helpers.

import { DEFAULT_ORG_SLUG } from "@/lib/orgs";

export function orgPathPrefix(orgSlug) {
  if (!orgSlug || orgSlug === DEFAULT_ORG_SLUG) return "";
  return `/${orgSlug}`;
}

export function dashboardPathForRole(role, orgSlug) {
  const base = orgPathPrefix(orgSlug);
  if (role === "admin" || role === "superadmin") return `${base}/dashboard/admin`;
  if (role === "doctor") return `${base}/dashboard/doctor`;
  return `${base}/dashboard/patient`;
}

export function loginPathForRole(role, orgSlug) {
  const base = orgPathPrefix(orgSlug);
  if (role === "doctor") return `${base}/doctor/doctor-login`;
  if (role === "admin") return `${base}/admin/admin-login`;
  return `${base}/login`;
}

export const RESERVED_FIRST_SEGMENTS = new Set([
  "dashboard",
  "login",
  "doctor",
  "admin",
  "api",
  "auth",
  "about",
  "contact",
  "weightloss-onboard",
  "_next",
  "images",
  "favicon.ico",
]);

/** @returns {string | null} org slug from /{slug}/... or null */
export function orgSlugFromPathname(pathname) {
  if (!pathname || pathname === "/") return null;
  const first = pathname.split("/").filter(Boolean)[0];
  if (!first || RESERVED_FIRST_SEGMENTS.has(first)) return null;
  return first;
}

/**
 * True when pathname is /dashboard/* or /{org}/dashboard/*.
 * @returns {{ orgSlug: string | null, subpath: string } | null}
 */
export function parseDashboardPathname(pathname) {
  if (!pathname) return null;
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) return null;

  if (parts[0] === "dashboard") {
    return {
      orgSlug: null,
      subpath: parts.slice(1).join("/"),
    };
  }

  if (parts.length >= 2 && parts[1] === "dashboard") {
    const slug = parts[0];
    if (RESERVED_FIRST_SEGMENTS.has(slug)) return null;
    return {
      orgSlug: slug,
      subpath: parts.slice(2).join("/"),
    };
  }

  return null;
}

/** Map a dashboard subpath to the correct marketing-site login path. */
export function marketingLoginPathForDashboard(pathname) {
  const parsed = parseDashboardPathname(pathname);
  if (!parsed) return "/login";

  const base = orgPathPrefix(parsed.orgSlug);
  const sub = parsed.subpath || "";

  if (sub.startsWith("doctor")) return `${base}/doctor/doctor-login`;
  if (sub.startsWith("admin")) return `${base}/admin/admin-login`;
  return `${base}/login`.replace("//", "/") || "/login";
}

export function isSafeDashboardPath(path) {
  if (!path || typeof path !== "string") return false;
  let pathname = path;
  if (/^https?:\/\//i.test(path)) {
    try {
      pathname = new URL(path).pathname;
    } catch {
      return false;
    }
  }
  if (!pathname.startsWith("/")) return false;
  return parseDashboardPathname(pathname) != null || pathname === "/dashboard";
}

/** Cross-domain login bridge — dashboard host only. */
export function isAuthHandoffRoute(pathname) {
  return pathname === "/auth/handoff";
}

/** Auth callback + legacy handoff routes (session bridge entry points). */
export function isAuthCallbackRoute(pathname) {
  return (
    pathname === "/auth/callback" ||
    pathname === "/auth/callback/complete" ||
    pathname === "/auth/handoff"
  );
}

export function isAuthBridgeRoute(pathname) {
  return isAuthCallbackRoute(pathname) || isAuthHandoffRoute(pathname);
}

/** Login / registration entry URLs — allowed on both marketing and dashboard hosts. */
export function isAuthPortalRoute(pathname) {
  if (!pathname || pathname === "/") return false;
  if (isAuthHandoffRoute(pathname)) return true;
  const parts = pathname.split("/").filter(Boolean);

  if (parts.length === 1 && parts[0] === "login") return true;
  if (
    parts.length === 2 &&
    parts[0] === "doctor" &&
    (parts[1] === "doctor-login" || parts[1] === "doctor-onboard")
  ) {
    return true;
  }
  if (parts.length === 2 && parts[0] === "admin" && parts[1] === "admin-login") {
    return true;
  }

  if (parts.length >= 2 && !RESERVED_FIRST_SEGMENTS.has(parts[0])) {
    if (parts.length === 2 && parts[1] === "login") return true;
    if (
      parts.length === 3 &&
      parts[1] === "doctor" &&
      (parts[2] === "doctor-login" || parts[2] === "doctor-onboard")
    ) {
      return true;
    }
    if (parts.length === 3 && parts[1] === "admin" && parts[2] === "admin-login") {
      return true;
    }
  }

  return false;
}
