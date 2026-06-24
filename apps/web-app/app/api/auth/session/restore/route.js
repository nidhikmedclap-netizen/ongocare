// app/api/auth/session/restore/route.js
//
// POST: mint a Firebase custom token from a valid session cookie so the
// client SDK can re-authenticate after refresh (UI/Firestore layer only).

import { adminAuth } from "@/lib/firebase/admin";
import { getSessionFromRequest } from "@/lib/auth/sessionCookie";
import { fail, ok, withErrorHandling } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = withErrorHandling(async (request) => {
  const session = await getSessionFromRequest(request);
  if (!session?.decoded?.sub) {
    return fail("Unauthorized", 401);
  }

  try {
    const customToken = await adminAuth.createCustomToken(session.decoded.sub);
    return ok({ customToken });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("[auth/session/restore]", e?.message || e);
    return fail("Could not restore client session", 500);
  }
}, { rateLimitProfile: "auth" });
