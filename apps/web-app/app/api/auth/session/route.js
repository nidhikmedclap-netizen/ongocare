// app/api/auth/session/route.js
//
// POST: verify Firebase ID token and set an HTTP-only session cookie.
// Used after same-origin login and to mirror session on the marketing host.

import {
  attachSessionCookie,
  createSessionFromIdToken,
  applyNoStoreHeaders,
} from "@/lib/auth/sessionCookie";
import { fail, ok, withErrorHandling } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = withErrorHandling(async (request) => {
  const header = request.headers.get("authorization") || "";
  const idToken = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!idToken) return fail("Missing authorization token", 401);

  try {
    const { sessionCookie } = await createSessionFromIdToken(idToken);
    const response = ok({ authenticated: true });
    attachSessionCookie(response, sessionCookie);
    applyNoStoreHeaders(response);
    return response;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("[auth/session]", e?.message || e);
    return fail("Invalid or expired token", 401);
  }
}, { rateLimitProfile: "auth" });
