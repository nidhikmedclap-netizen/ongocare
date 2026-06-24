// app/api/auth/session/refresh/route.js
//
// POST: rotate the session cookie using a fresh Firebase ID token.
// Accepts either a valid existing session cookie or Bearer ID token.

import { getSessionFromRequest, verifySessionCookie } from "@/lib/auth/sessionCookie";
import {
  attachSessionCookie,
  createSessionFromIdToken,
  applyNoStoreHeaders,
} from "@/lib/auth/sessionCookie";
import { SESSION_COOKIE_NAME } from "@/lib/auth/sessionConstants";
import { fail, ok, withErrorHandling } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = withErrorHandling(async (request) => {
  const header = request.headers.get("authorization") || "";
  const bearerToken = header.startsWith("Bearer ") ? header.slice(7).trim() : "";

  let idToken = bearerToken;

  if (!idToken) {
    const existing = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!existing) return fail("No session to refresh", 401);

    const decoded = await verifySessionCookie(existing, true);
    if (!decoded) return fail("Invalid session", 401);

    // Session cookies cannot be extended without a fresh ID token from the client.
    return ok({
      refreshed: false,
      message: "Provide a fresh ID token to rotate the session cookie.",
      exp: decoded.exp,
    });
  }

  try {
    const existingSession = await getSessionFromRequest(request);
    const { sessionCookie, decoded } = await createSessionFromIdToken(idToken);

    if (existingSession?.decoded?.sub && existingSession.decoded.sub !== decoded.sub) {
      return fail("Token user does not match session", 403);
    }

    const response = ok({ refreshed: true, exp: decoded.exp });
    attachSessionCookie(response, sessionCookie);
    applyNoStoreHeaders(response);
    return response;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("[auth/session/refresh]", e?.message || e);
    return fail("Could not refresh session", 401);
  }
}, { rateLimitProfile: "auth" });
