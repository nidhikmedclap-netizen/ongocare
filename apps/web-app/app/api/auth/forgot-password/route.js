// app/api/auth/forgot-password/route.js
//
// POST: send a branded password-reset email for patient or doctor accounts.
// Admin and superadmin accounts are not eligible.

import { fail, ok, withErrorHandling } from "@/lib/api";
import { processForgotPassword } from "@/services/auth/forgotPassword";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function resolveRequestOrigin(request) {
  const raw = request.headers.get("origin") || request.headers.get("referer");
  if (!raw) return null;
  try {
    return new URL(raw).origin;
  } catch {
    return null;
  }
}

export const POST = withErrorHandling(async (request) => {
  let body;
  try {
    body = await request.json();
  } catch {
    return fail("Invalid request body", 400);
  }

  const email = body?.email;
  const role = body?.role;
  const orgSlug = body?.orgSlug ?? null;
  const resetReturnUrl = body?.resetReturnUrl ?? null;

  const result = await processForgotPassword({
    email,
    role,
    orgSlug,
    resetReturnUrl,
    requestOrigin: resolveRequestOrigin(request),
  });

  if (!result.ok) {
    return Response.json(
      { success: false, message: result.message, code: result.code || null },
      { status: 400 },
    );
  }

  return ok({ message: result.message });
}, { rateLimitProfile: "auth" });
