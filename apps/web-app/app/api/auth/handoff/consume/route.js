// app/api/auth/handoff/consume/route.js
//
// Legacy consume endpoint — prefer server-side /auth/callback. Kept for
// backwards compatibility with /auth/handoff client page.

import { consumeHandoffCode } from "@/lib/auth/handoffStore";
import { fail, ok, withErrorHandling } from "@/lib/api";
import { rateLimitOrNull } from "@/lib/api/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = withErrorHandling(async (request) => {
  const limited = rateLimitOrNull(request, "auth");
  if (limited) return fail(limited.message, limited.status);

  const body = await request.json().catch(() => ({}));
  const handoffId =
    typeof body.handoffId === "string" ? body.handoffId.trim() : "";
  if (!handoffId) return fail("Missing handoff id", 400);

  const handoff = await consumeHandoffCode(handoffId);
  if (!handoff?.customToken) {
    return fail("Handoff expired or invalid. Please log in again.", 401);
  }

  return ok({ customToken: handoff.customToken });
});
