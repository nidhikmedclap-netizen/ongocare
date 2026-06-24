// lib/billing/stripePayment.js
//
// Stripe PaymentIntent status helpers for manual capture (authorize now,
// capture later from the Stripe Dashboard).

/** Firestore onboarding.paymentStatus values */
export const PAYMENT_STATUS = {
  NONE: "",
  AUTHORIZED: "authorized",
  CAPTURED: "captured",
  CANCELED: "canceled",
};

/** PI statuses that mean checkout completed on the client */
export function isCheckoutCompleteIntentStatus(stripeStatus) {
  return stripeStatus === "succeeded" || stripeStatus === "requires_capture";
}

export function paymentStatusFromIntentStatus(stripeStatus) {
  if (stripeStatus === "succeeded") return PAYMENT_STATUS.CAPTURED;
  if (stripeStatus === "requires_capture") return PAYMENT_STATUS.AUTHORIZED;
  if (stripeStatus === "canceled") return PAYMENT_STATUS.CANCELED;
  return PAYMENT_STATUS.NONE;
}
