// app/api/stripe/payment-details/route.js
//
// Called by the onboarding payment screen after Stripe confirms a card
// charge or authorization. Returns a sanitized card snapshot for Firestore.
// Requires auth and proof the caller owns the PaymentIntent.

import Stripe from "stripe";
import { fail, ok, withAuth } from "@/lib/api";
import {
  isCheckoutCompleteIntentStatus,
  paymentStatusFromIntentStatus,
} from "@/lib/billing/stripePayment";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function callerOwnsPaymentIntent(intent, auth) {
  const uid = auth.decoded.uid;
  const email = (auth.decoded.email || "").trim().toLowerCase();
  const meta = intent.metadata || {};
  const metaUid =
    typeof meta.firebaseUid === "string" ? meta.firebaseUid.trim() : "";
  const metaEmail =
    typeof meta.email === "string" ? meta.email.trim().toLowerCase() : "";

  if (metaUid && metaUid === uid) return true;
  if (metaEmail && email && metaEmail === email) return true;

  const user = auth.user || {};
  const onb = user.onboarding || {};
  const profilePiId =
    (typeof user.planPaymentId === "string" && user.planPaymentId.trim()) ||
    (typeof onb.paymentIntentId === "string" ? onb.paymentIntentId.trim() : "");
  return profilePiId === intent.id;
}

export const POST = withAuth(async (req, _ctx, auth) => {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret || secret === "sk_test_REPLACE_ME") {
    return fail("Stripe secret key is not configured.", 500);
  }

  const body = await req.json().catch(() => ({}));
  const paymentIntentId =
    typeof body.paymentIntentId === "string" ? body.paymentIntentId.trim() : "";
  if (!paymentIntentId) return fail("Missing paymentIntentId.", 400);

  const stripe = new Stripe(secret);
  const intent = await stripe.paymentIntents.retrieve(paymentIntentId, {
    expand: ["payment_method"],
  });

  if (!callerOwnsPaymentIntent(intent, auth)) {
    return fail("Forbidden", 403);
  }

  if (!isCheckoutCompleteIntentStatus(intent.status)) {
    return fail(`Payment status is ${intent.status}.`, 400);
  }

  const pm = intent.payment_method;
  const card = pm && typeof pm === "object" ? pm.card : null;
  const billing = pm && typeof pm === "object" ? pm.billing_details || {} : {};
  const paymentStatus = paymentStatusFromIntentStatus(intent.status);

  return ok({
    paymentIntentId: intent.id,
    stripeStatus: intent.status,
    paymentStatus,
    amount: intent.amount,
    currency: intent.currency,
    paidAt: intent.created * 1000,
    plan: intent.metadata?.plan || "",
    brand: card?.brand || "",
    last4: card?.last4 || "",
    expMonth: card?.exp_month || null,
    expYear: card?.exp_year || null,
    cardholderName: billing.name || "",
  });
});
