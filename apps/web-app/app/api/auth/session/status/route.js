// app/api/auth/session/status/route.js
//
// GET: lightweight session probe for server-side checks.

import { getSessionFromRequest } from "@/lib/auth/sessionCookie";
import { fail, ok, withErrorHandling } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withErrorHandling(async (request) => {
  const session = await getSessionFromRequest(request);
  if (!session) return fail("Unauthorized", 401);

  return ok({
    uid: session.decoded.sub,
    email: session.decoded.email || session.user?.email || "",
    role: session.role,
    orgSlug: session.orgSlug,
  });
}, { rateLimitProfile: "default" });
