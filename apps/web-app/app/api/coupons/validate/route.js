// app/api/coupons/validate/route.js
//
// Public endpoint for previewing a coupon's effect on the checkout total
// BEFORE the patient submits payment. Called by the SPay screen when the
// user clicks "Apply" on the promo-code input.
//
// We deliberately don't require auth: the patient hits checkout before
// their Firebase Auth user exists (that's created later, in save-progress).
// The reveal here is small — at worst, a bot learns which codes are live.
// All authoritative pricing still happens in /api/stripe/payment-intent,
// which re-runs the exact same validation server-side.
//
// Request:
//   { code: "WELCOME20", plan: "3m", orgSlug?: "ongo" }
// Response (valid):
//   { success: true, code, discountPercent, baseCents, discountCents,
//     finalCents, currency: "usd" }
// Response (invalid):
//   { success: false, message }       (400)

import { validateForCheckout } from "@/services/firebase/coupons";
import { CURRENCY, getPlan, planBaseCents } from "@/lib/billing/plans";
import { fail, ok, withErrorHandling } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = withErrorHandling(async (req) => {
  const body = await req.json().catch(() => ({}));
  const plan = getPlan(body.plan);
  if (!plan) return fail("Invalid or missing plan", 400);

  const baseCents = planBaseCents(plan);
  const result = await validateForCheckout({
    code: body.code,
    orgSlug: typeof body.orgSlug === "string" ? body.orgSlug : null,
    baseCents,
    planId: body.plan,
  });

  if (!result.ok) {
    // 200 with success:false would be ambiguous on the client side; 400
    // lines up with the rest of our API and means the existing error
    // surfaces (toast / inline message) Just Work.
    return fail(result.message || "Coupon is not valid", 400);
  }

  return ok({
    code: result.coupon.code,
    discountPercent: result.coupon.discountPercent,
    baseCents,
    discountCents: result.discountCents,
    finalCents: result.finalCents,
    currency: CURRENCY,
  });
}, { rateLimitProfile: "publicProbe" });
