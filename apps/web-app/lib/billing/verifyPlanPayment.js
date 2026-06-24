// lib/billing/verifyPlanPayment.js
//
// Server-side Stripe verification before persisting payment state.

import Stripe from "stripe";
import { isCheckoutCompleteIntentStatus } from "@/lib/billing/stripePayment";

function stripeClient() {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret || secret === "sk_test_REPLACE_ME") return null;
  return new Stripe(secret);
}

function callerOwnsPaymentIntent(intent, { uid, email }) {
  const meta = intent.metadata || {};
  const metaUid =
    typeof meta.firebaseUid === "string" ? meta.firebaseUid.trim() : "";
  const metaEmail =
    typeof meta.email === "string" ? meta.email.trim().toLowerCase() : "";
  const normalizedEmail = (email || "").trim().toLowerCase();

  if (metaUid && metaUid === uid) return true;
  if (metaEmail && normalizedEmail && metaEmail === normalizedEmail) return true;
  return false;
}

/**
 * Verify a PaymentIntent with Stripe and confirm the caller owns it.
 * Returns the expanded intent or throws with a safe message.
 */
export async function verifyPaymentIntentForUser(paymentIntentId, { uid, email }) {
  const id =
    typeof paymentIntentId === "string" ? paymentIntentId.trim() : "";
  if (!id) {
    const err = new Error("payment_intent_required");
    err.code = "PAYMENT_INTENT_REQUIRED";
    throw err;
  }

  const stripe = stripeClient();
  if (!stripe) {
    const err = new Error("stripe_not_configured");
    err.code = "STRIPE_NOT_CONFIGURED";
    throw err;
  }

  const intent = await stripe.paymentIntents.retrieve(id, {
    expand: ["payment_method"],
  });

  if (!callerOwnsPaymentIntent(intent, { uid, email })) {
    const err = new Error("payment_ownership");
    err.code = "PAYMENT_FORBIDDEN";
    throw err;
  }

  if (!isCheckoutCompleteIntentStatus(intent.status)) {
    const err = new Error(`payment_status_${intent.status}`);
    err.code = "PAYMENT_NOT_COMPLETE";
    throw err;
  }

  return intent;
}
