// app/api/stripe/payment-history/route.js
//
// Returns every succeeded Stripe PaymentIntent for the signed-in patient,
// plus a summed total. Merges Stripe search (by email metadata) with the
// PaymentIntent id stored on the user's Firestore onboarding doc so totals
// stay correct even when search indexing lags or metadata is missing.

import Stripe from "stripe";
import { fail, ok, withAuth } from "@/lib/api";
import { isCheckoutCompleteIntentStatus } from "@/lib/billing/stripePayment";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function projectIntent(intent) {
  const pm = intent.payment_method;
  const card = pm && typeof pm === "object" ? pm.card : null;
  return {
    id: intent.id,
    amount: intent.amount,
    currency: intent.currency,
    paidAt: (intent.created || 0) * 1000,
    plan: intent.metadata?.plan || "",
    brand: card?.brand || "",
    last4: card?.last4 || "",
  };
}

export const GET = withAuth({ role: "patient" }, async (_request, _ctx, auth) => {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret || secret === "sk_test_REPLACE_ME") {
    return fail("Stripe secret key is not configured.", 500);
  }

  const email = (auth.decoded.email || "").trim().toLowerCase();
  const stripe = new Stripe(secret);
  const byId = new Map();

  if (email) {
    const safe = email.replace(/[^a-z0-9@._\-+]/g, "");
    const escaped = safe.replace(/'/g, "''");
    try {
      const search = await stripe.paymentIntents.search({
        query: `status:'succeeded' AND metadata['email']:'${escaped}'`,
        limit: 100,
        expand: ["data.payment_method"],
      });
      for (const intent of search.data) {
        byId.set(intent.id, projectIntent(intent));
      }
    } catch {
      // Search can fail on misconfigured indexes — fall back to profile PI.
    }
  }

  const user = auth.user || {};
  const onb = user.onboarding || {};
  const profilePiId =
    (typeof user.planPaymentId === "string" && user.planPaymentId.trim()) ||
    (typeof onb.paymentIntentId === "string" ? onb.paymentIntentId.trim() : "");
  if (profilePiId && !byId.has(profilePiId)) {
    try {
      const intent = await stripe.paymentIntents.retrieve(profilePiId, {
        expand: ["payment_method"],
      });
      if (isCheckoutCompleteIntentStatus(intent.status)) {
        byId.set(intent.id, projectIntent(intent));
      }
    } catch {
      // Profile may reference a PI from another Stripe account / test mode.
    }
  }

  const payments = Array.from(byId.values()).sort((a, b) => b.paidAt - a.paidAt);
  let totalCents = 0;
  let currency = "usd";
  for (const p of payments) {
    totalCents += p.amount || 0;
    if (p.currency) currency = p.currency;
  }

  return ok({ totalCents, currency, count: payments.length, payments });
});

function toPaidAtMs(value) {
  if (value == null) return Date.now();
  if (typeof value === "number") return value;
  if (typeof value?.toMillis === "function") return value.toMillis();
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : Date.now();
}
