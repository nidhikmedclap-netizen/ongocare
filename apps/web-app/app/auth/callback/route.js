// app/auth/callback/route.js
//
// Cross-domain authentication callback (dashboard host).
// Verifies the one-time handoff, creates an HTTP-only session cookie, and
// redirects to /auth/callback/complete so the session cookie is committed on the
// dashboard origin before entering protected /dashboard/* routes.

import { NextResponse } from "next/server";
import { consumeHandoffCode } from "@/lib/auth/handoffStore";
import {
  applyNoStoreHeaders,
  attachSessionCookie,
  createSessionFromIdToken,
} from "@/lib/auth/sessionCookie";
import {
  ESTABLISH_COOKIE_NAME,
  getEstablishCookieOptions,
} from "@/lib/auth/sessionConstants";
import {
  dashboardPathForRole,
  isSafeDashboardPath,
  marketingLoginRedirectForDashboardPath,
} from "@/lib/urls/siteOrigins";
import { clearSignedOutCookie } from "@/lib/auth/signedOutCookie";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function resolveNextPath(nextParam) {
  const fallback = dashboardPathForRole("patient", null);
  if (!nextParam || !isSafeDashboardPath(nextParam)) return fallback;
  return nextParam.startsWith("/") ? nextParam : `/${nextParam}`;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const handoffId = searchParams.get("handoff")?.trim() || "";
  const nextPath = resolveNextPath(searchParams.get("next"));

  if (!handoffId) {
    return NextResponse.redirect(
      marketingLoginRedirectForDashboardPath(nextPath),
    );
  }

  let handoff = await consumeHandoffCode(handoffId);
  if (!handoff?.idToken) {
    return NextResponse.redirect(
      marketingLoginRedirectForDashboardPath(nextPath),
    );
  }

  try {
    const { sessionCookie } = await createSessionFromIdToken(handoff.idToken, {
      checkRevoked: false,
    });

    const destUrl = new URL("/auth/callback/complete", request.url);
    destUrl.searchParams.set("next", nextPath);
    const response = NextResponse.redirect(destUrl);
    attachSessionCookie(response, sessionCookie);
    clearSignedOutCookie(response);

    if (handoff.customToken) {
      response.cookies.set(
        ESTABLISH_COOKIE_NAME,
        handoff.customToken,
        getEstablishCookieOptions(),
      );
    }

    applyNoStoreHeaders(response);
    return response;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("[auth/callback]", e?.message || e);
    return NextResponse.redirect(
      marketingLoginRedirectForDashboardPath(nextPath),
    );
  }
}
