// app/api/auth/handoff/route.js
//
// POST: verify Firebase ID token from marketing-site sign-in, store a
// one-time handoff for the dashboard /auth/callback route.

import { adminAuth } from "@/lib/firebase/admin";
import { createHandoffCode } from "@/lib/auth/handoffStore";
import { fail, ok, withErrorHandling } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = withErrorHandling(async (request) => {
  const header = request.headers.get("authorization") || "";
  const idToken = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!idToken) return fail("Missing authorization token", 401);

  try {
    const decoded = await adminAuth.verifyIdToken(idToken, true);
    const customToken = await adminAuth.createCustomToken(decoded.uid);
    const handoffId = await createHandoffCode({ idToken, customToken });
    return ok({ handoffId });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("[auth/handoff]", e?.message || e);
    return fail("Could not create session handoff", 401);
  }
}, { rateLimitProfile: "auth" });
