// app/api/auth/logout/route.js
//
// POST/GET: revoke server session and clear the HTTP-only session cookie.

import {
  clearSessionCookie,
  revokeSession,
} from "@/lib/auth/sessionCookie";
import { applyNoStoreHeaders } from "@/lib/auth/sessionCookie";
import {
  ESTABLISH_COOKIE_NAME,
  getEstablishCookieOptions,
  SESSION_COOKIE_NAME,
} from "@/lib/auth/sessionConstants";
import { ok, withErrorHandling } from "@/lib/api";
import { marketingUrl } from "@/lib/urls/siteOrigins";
import {
  attachSignedOutCookie,
  clearSignedOutCookie,
} from "@/lib/auth/signedOutCookie";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function buildLogoutResponse(request) {
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (sessionCookie) {
    await revokeSession(sessionCookie);
  }

  const response = ok({ signedOut: true });
  clearSessionCookie(response);
  response.cookies.set(
    ESTABLISH_COOKIE_NAME,
    "",
    getEstablishCookieOptions(0),
  );
  attachSignedOutCookie(response);
  applyNoStoreHeaders(response);
  return response;
}

export const POST = withErrorHandling(buildLogoutResponse, {
  rateLimitProfile: "auth",
});

/** GET supports cross-domain logout redirect chains (marketing after dashboard sign-out). */
export const GET = withErrorHandling(async (request) => {
  const { searchParams } = new URL(request.url);
  const redirectTo = searchParams.get("redirect") || "/login";
  const target = redirectTo.startsWith("http")
    ? redirectTo
    : marketingUrl(redirectTo.startsWith("/") ? redirectTo : `/${redirectTo}`);

  await buildLogoutResponse(request);

  const response = NextResponse.redirect(target);
  clearSessionCookie(response);
  response.cookies.set(
    ESTABLISH_COOKIE_NAME,
    "",
    getEstablishCookieOptions(0),
  );
  attachSignedOutCookie(response);
  applyNoStoreHeaders(response);
  return response;
}, { rateLimitProfile: "auth" });
