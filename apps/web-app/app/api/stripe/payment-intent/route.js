// app/api/stripe/payment-intent/route.js
//
// Creates a Stripe PaymentIntent for the patient-onboarding plan picker.
// No auth required — checkout happens before the Firebase Auth user
// exists.
//
// Optional `couponCode`: when present, the server re-validates the code
// (we never trust a client-supplied discount), reduces the amount, and
// stamps the coupon details into PI metadata so:
//   - the receipt UI can show the discount line
//   - the redemption step (in save-progress) can look the coupon up by
//     its id without needing the client to send it back

import Stripe from "stripe";
import { validateForCheckout } from "@/services/firebase/coupons";
import { CURRENCY, getPlan, planBaseCents } from "@/lib/billing/plans";
import { authenticate, fail, ok, withErrorHandling } from "@/lib/api";

export const POST = withErrorHandling(async (req) => {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret || secret === "sk_test_REPLACE_ME") {
    return fail("Stripe secret key is not configured.", 500);
  }

  const body = await req.json().catch(() => ({}));
  const plan = getPlan(body.plan);
  if (!plan) return fail("Invalid or missing plan.", 400);

  const baseCents = planBaseCents(plan);

  // Optional coupon. If the code is invalid we DON'T silently fall back to
  // the full price — that would let a user buy at full price thinking they
  // got a discount. We fail loud so the client can show "code invalid".
  let couponInfo = null;
  let amountCents = baseCents;
  let discountCents = 0;
  const rawCode = typeof body.couponCode === "string" ? body.couponCode.trim() : "";
  if (rawCode) {
    const v = await validateForCheckout({
      code: rawCode,
      orgSlug: typeof body.orgSlug === "string" ? body.orgSlug : null,
      baseCents,
      planId: body.plan,
    });
    if (!v.ok) return fail(v.message || "Coupon is not valid", 400);
    couponInfo = v.coupon;
    amountCents = v.finalCents;
    discountCents = v.discountCents;
  }

  const stripe = new Stripe(secret);

  const auth = await authenticate(req);
  const trustedUid = auth?.decoded?.uid || "";
  const trustedEmail = (auth?.decoded?.email || "").trim();
  const bodyEmail =
    typeof body.email === "string" ? body.email.trim() : "";
  const bodyUid =
    typeof body.firebaseUid === "string" ? body.firebaseUid.trim() : "";

  // Stripe metadata values must be strings ≤ 500 chars. Empty strings are
  // fine and let the downstream client check `metadata.couponCode` safely.
  const metadata = {
    flow: "weightloss-onboard",
    plan: body.plan,
    months: String(plan.months),
    monthly: String(plan.monthly),
    email: trustedEmail || bodyEmail || "",
    name: typeof body.name === "string" ? body.name : "",
    baseAmount: String(baseCents),
    couponCode: couponInfo?.code || "",
    couponId: couponInfo?.id || "",
    couponDiscountPercent: couponInfo
      ? String(couponInfo.discountPercent)
      : "",
    couponDiscountAmount: couponInfo ? String(discountCents) : "",
    firebaseUid: trustedUid || bodyUid || "",
  };

  const intent = await stripe.paymentIntents.create({
    amount: amountCents,
    currency: CURRENCY,
    capture_method: "manual",
    automatic_payment_methods: { enabled: true, allow_redirects: "never" },
    metadata,
  });

  return ok({
    clientSecret: intent.client_secret,
    amount: amountCents,
    baseAmount: baseCents,
    discountAmount: discountCents,
    currency: CURRENCY,
    plan: body.plan,
    months: plan.months,
    monthly: plan.monthly,
    coupon: couponInfo
      ? {
          code: couponInfo.code,
          discountPercent: couponInfo.discountPercent,
          id: couponInfo.id,
        }
      : null,
  });
}, { rateLimitProfile: "payment" });
