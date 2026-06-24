// services/emails/emailAssets.js
//
// Shared URL helpers for transactional emails (server-only).

import {
  getDashboardOrigin,
  getMarketingOrigin,
  marketingUrl,
} from "@/lib/urls/siteOrigins";
import { dashboardPathForRole } from "@/lib/urls/dashboardPaths";

if (typeof window !== "undefined") {
  throw new Error("[email/emailAssets] Server-only.");
}

function stripTrailingSlash(origin) {
  return (origin || "").replace(/\/$/, "");
}

function isLocalOrigin(origin) {
  if (!origin) return true;
  try {
    const host = new URL(origin).hostname.toLowerCase();
    return host === "localhost" || host === "127.0.0.1" || host === "[::1]";
  } catch {
    return true;
  }
}

export function resolveEmailAssetUrl(assetPath) {
  const pathname = assetPath.startsWith("/") ? assetPath : `/${assetPath}`;
  const marketing = getMarketingOrigin();
  if (marketing && !isLocalOrigin(marketing)) {
    return `${marketing}${pathname}`;
  }
  const publicMarketing = stripTrailingSlash(
    process.env.EMAIL_ASSET_ORIGIN || "https://web.ongoweightloss.com",
  );
  if (publicMarketing && !isLocalOrigin(publicMarketing)) {
    return `${publicMarketing}${pathname}`;
  }
  return marketingUrl(assetPath);
}

export function resolvePatientPortalLink(orgSlug) {
  const path = dashboardPathForRole("patient", orgSlug);
  const origin = getDashboardOrigin() || getMarketingOrigin();
  if (!origin) return path;
  return `${stripTrailingSlash(origin)}${path}`;
}
