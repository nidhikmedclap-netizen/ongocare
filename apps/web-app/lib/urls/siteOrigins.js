// lib/urls/siteOrigins.js
//
// Marketing vs dashboard site origins (two browser URLs, one Next.js app).

import {
  dashboardPathForRole,
  isSafeDashboardPath,
  loginPathForRole,
  marketingLoginPathForDashboard,
  orgPathPrefix,
  parseDashboardPathname,
} from "./dashboardPaths";

export {
  dashboardPathForRole,
  loginPathForRole,
  orgPathPrefix,
  orgSlugFromPathname,
  parseDashboardPathname,
  marketingLoginPathForDashboard,
  isSafeDashboardPath,
} from "./dashboardPaths";

function stripTrailingSlash(origin) {
  return (origin || "").replace(/\/$/, "");
}

export function getMarketingOrigin() {
  return stripTrailingSlash(process.env.NEXT_PUBLIC_MARKETING_ORIGIN);
}

export function getDashboardOrigin() {
  return stripTrailingSlash(process.env.NEXT_PUBLIC_DASHBOARD_ORIGIN);
}

/** True when both origins are set and differ (production split). */
export function isSplitSiteMode() {
  if (process.env.NEXT_PUBLIC_DISABLE_SITE_SPLIT === "true") {
    return false;
  }
  const marketing = getMarketingOrigin();
  const dashboard = getDashboardOrigin();
  return Boolean(marketing && dashboard && marketing !== dashboard);
}

/** Client-only: marketing sign-in must bridge to the dashboard origin. */
export function needsCrossOriginAuthHandoff() {
  if (!isSplitSiteMode()) return false;
  if (typeof window === "undefined") return true;
  const dash = getDashboardOrigin();
  const current = window.location.origin.replace(/\/$/, "");
  return Boolean(dash && dash !== current);
}

export function hostFromOrigin(origin) {
  if (!origin) return "";
  try {
    return new URL(origin).host.toLowerCase();
  } catch {
    return "";
  }
}

export function marketingHost() {
  return hostFromOrigin(getMarketingOrigin());
}

export function dashboardHost() {
  return hostFromOrigin(getDashboardOrigin());
}

function normalizePath(path) {
  if (!path || path === "/") return "/";
  return path.startsWith("/") ? path : `/${path}`;
}

function buildQuery(query) {
  if (!query || typeof query !== "object") return "";
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value != null && value !== "") params.set(key, String(value));
  }
  const s = params.toString();
  return s ? `?${s}` : "";
}

export function marketingUrl(path, { query } = {}) {
  const pathname = normalizePath(path);
  const qs = buildQuery(query);
  const origin = getMarketingOrigin();
  if (origin) return `${origin}${pathname}${qs}`;
  if (typeof window !== "undefined") {
    return `${window.location.origin}${pathname}${qs}`;
  }
  return `${pathname}${qs}`;
}

export function dashboardUrl(path, { query } = {}) {
  const pathname = normalizePath(path);
  const qs = buildQuery(query);
  const origin = getDashboardOrigin();
  if (origin) return `${origin}${pathname}${qs}`;
  if (typeof window !== "undefined") {
    return `${window.location.origin}${pathname}${qs}`;
  }
  return `${pathname}${qs}`;
}

/**
 * Marketing login URL when user hits /dashboard on the marketing host.
 * `next` is always the full dashboard-origin URL for the intended destination.
 */
export function marketingLoginRedirectForDashboardPath(pathname) {
  const loginPath = marketingLoginPathForDashboard(pathname);
  const next = isSplitSiteMode()
    ? dashboardUrl(pathname)
    : pathname;
  return marketingUrl(loginPath, {
    query: { next },
  });
}

/** Resolve ?next= param to a dashboard path (strip origin if present). */
export function normalizeDashboardNext(nextParam) {
  if (!nextParam) return null;
  if (/^https?:\/\//i.test(nextParam)) {
    try {
      const url = new URL(nextParam);
      const dashOrigin = getDashboardOrigin();
      if (dashOrigin && url.origin === new URL(dashOrigin).origin) {
        return url.pathname + url.search;
      }
      if (isSafeDashboardPath(url.pathname)) {
        return url.pathname + url.search;
      }
      return null;
    } catch {
      return null;
    }
  }
  if (isSafeDashboardPath(nextParam)) return nextParam;
  return null;
}

export function resolvePostAuthDashboardPath({ nextParam, role, orgSlug, defaultNext }) {
  const fromNext = normalizeDashboardNext(nextParam);
  if (fromNext) return fromNext;
  if (defaultNext && defaultNext !== "/dashboard" && isSafeDashboardPath(defaultNext)) {
    return normalizePath(defaultNext);
  }
  if (role) return dashboardPathForRole(role, orgSlug);
  return "/dashboard/patient";
}
