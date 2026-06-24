// middleware.js
//
// Site split routing + HTTP-only session enforcement.
//   Marketing host: auth UI; redirect authenticated users away from login.
//   Dashboard host: session required for /dashboard/*; callback routes exempt.

import { NextResponse } from "next/server";
import {
  getDashboardOrigin,
  getMarketingOrigin,
  hostFromOrigin,
  isSplitSiteMode,
  marketingLoginRedirectForDashboardPath,
  marketingUrl,
  dashboardUrl,
} from "@/lib/urls/siteOrigins";
import {
  isAuthBridgeRoute,
  isAuthPortalRoute,
  parseDashboardPathname,
} from "@/lib/urls/dashboardPaths";
import {
  readSessionCookieFromRequest,
  verifySessionCookieEdge,
} from "@/lib/auth/sessionEdge";

function requestHost(request) {
  return (request.headers.get("host") || "").toLowerCase();
}

function isMarketingRequest(request) {
  const host = requestHost(request);
  const expected = hostFromOrigin(getMarketingOrigin());
  return expected && host === expected;
}

function isDashboardRequest(request) {
  const host = requestHost(request);
  const expected = hostFromOrigin(getDashboardOrigin());
  return expected && host === expected;
}

function isStaticAsset(pathname) {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/images/") ||
    pathname === "/favicon.ico" ||
    /\.(svg|png|jpg|jpeg|gif|webp|ico|woff2?|css|js)$/i.test(pathname)
  );
}

function redirectAbsolute(url, request) {
  return NextResponse.redirect(new URL(url, request.url));
}

function applyNoStore(response) {
  response.headers.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, max-age=0",
  );
  response.headers.set("Pragma", "no-cache");
  return response;
}

function redirectToMarketingLogin(request, pathname) {
  const target = marketingLoginRedirectForDashboardPath(pathname);
  return applyNoStore(redirectAbsolute(target, request));
}

async function resolveSessionClaims(request) {
  const value = readSessionCookieFromRequest(request);
  if (!value) return null;
  const claims = await verifySessionCookieEdge(value);
  if (claims?.sub) return claims;
  return null;
}

function looksLikeSessionJwt(value) {
  return typeof value === "string" && value.split(".").length === 3;
}

function hasSessionCookie(request) {
  return Boolean(readSessionCookieFromRequest(request));
}

function isSplitSiteActive() {
  if (process.env.NEXT_PUBLIC_DISABLE_SITE_SPLIT === "true") return false;
  const marketing = hostFromOrigin(getMarketingOrigin());
  const dashboard = hostFromOrigin(getDashboardOrigin());
  return Boolean(marketing && dashboard && marketing !== dashboard);
}

/**
 * Local dev (NODE_ENV=development) trusts __session cookie presence on the
 * dashboard host because Edge JWT verification is flaky across ports.
 * Split-site staging/production uses the same rule: the cookie is HttpOnly,
 * only set by /auth/callback on the dashboard origin, and API routes +
 * useRequireRole validate it with the Admin SDK.
 */
function trustDashboardSessionCookie(request, sessionCookiePresent) {
  if (!sessionCookiePresent || !isDashboardRequest(request)) return false;
  const value = readSessionCookieFromRequest(request);
  if (!looksLikeSessionJwt(value)) return false;
  return process.env.NODE_ENV === "development" || isSplitSiteActive();
}

export async function middleware(request) {
  const { pathname, search } = request.nextUrl;

  if (isStaticAsset(pathname)) {
    return NextResponse.next();
  }

  // API routes validate sessions in route handlers (lib/api.js).
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  const dashboardPath = parseDashboardPathname(pathname);
  const isBridge = isAuthBridgeRoute(pathname);
  const isCallbackComplete = pathname === "/auth/callback/complete";
  const sessionClaims = await resolveSessionClaims(request);
  const sessionCookiePresent = hasSessionCookie(request);
  const hasSession =
    Boolean(sessionClaims?.sub) ||
    trustDashboardSessionCookie(request, sessionCookiePresent);

  // Legacy handoff URL → canonical callback.
  if (pathname === "/auth/handoff") {
    const callback = new URL("/auth/callback", request.url);
    callback.search = request.nextUrl.search;
    return applyNoStore(NextResponse.redirect(callback));
  }

  if (!isSplitSiteActive()) {
    // Single-host: enforce session on dashboard routes.
    if (dashboardPath && !hasSession) {
      const loginPath = marketingLoginRedirectForDashboardPath(pathname);
      return applyNoStore(
        NextResponse.redirect(new URL(loginPath, request.url)),
      );
    }

    if (isAuthPortalRoute(pathname) && hasSession) {
      return applyNoStore(
        NextResponse.redirect(new URL("/dashboard", request.url)),
      );
    }

    if (dashboardPath || isBridge || isCallbackComplete) {
      const response = NextResponse.next();
      return applyNoStore(response);
    }

    return NextResponse.next();
  }

  if (isMarketingRequest(request)) {
    if (dashboardPath) {
      return redirectToMarketingLogin(request, pathname);
    }

    if (isBridge || isCallbackComplete) {
      return redirectAbsolute(marketingUrl("/login"), request);
    }

    if (isAuthPortalRoute(pathname) && hasSession && !isSplitSiteMode()) {
      return applyNoStore(
        redirectAbsolute(dashboardUrl("/dashboard"), request),
      );
    }

    return NextResponse.next();
  }

  if (isDashboardRequest(request)) {
    // Callback + complete: server/client bridge — no session required yet.
    if (isBridge || isCallbackComplete) {
      return applyNoStore(NextResponse.next());
    }

    if (dashboardPath) {
      if (!hasSession) {
        return redirectToMarketingLogin(request, pathname);
      }
      return applyNoStore(NextResponse.next());
    }

    if (isAuthPortalRoute(pathname)) {
      return redirectAbsolute(marketingUrl(pathname + search), request);
    }

    return redirectAbsolute(marketingUrl(pathname + search), request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
