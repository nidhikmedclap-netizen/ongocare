// app/api/auth/establish/route.js
//
// POST: exchange the short-lived establish cookie for a Firebase custom token
// so the client SDK can sign in for Firestore access (UI layer only).

import { fail, ok, withErrorHandling } from "@/lib/api";
import {
  ESTABLISH_COOKIE_NAME,
  getEstablishCookieOptions,
} from "@/lib/auth/sessionConstants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = withErrorHandling(async (request) => {
  const customToken = request.cookies.get(ESTABLISH_COOKIE_NAME)?.value;
  if (!customToken) {
    return fail("Establish token missing or expired. Please log in again.", 401);
  }

  const response = ok({ customToken });
  response.cookies.set(
    ESTABLISH_COOKIE_NAME,
    "",
    getEstablishCookieOptions(0),
  );
  return response;
}, { rateLimitProfile: "auth" });
