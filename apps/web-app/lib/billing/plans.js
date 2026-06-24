// lib/billing/plans.js
//
// Server-side plan pricing — the single source of truth for what the
// patient is charged. The onboarding UI carries its own labelled copy in
// `app/weightloss-onboard/data.js` (for hero copy / marketing), but the
// dollar amounts here are what actually create the Stripe PaymentIntent.
//
// Keep these numbers in lock-step with data.js. We'd ideally drive both
// from a CMS / Firestore document, but at three plans the duplication is
// cheap and a missed update would surface immediately in QA.
//
// Amounts in `PLAN_PRICES` are the **total one-time charge** for each program
// length (see docs/weightloss-onboard-questionnaire-flow.md). The field name
// `monthly` is legacy — it is NOT multiplied by `months` at checkout.

export const PLAN_PRICES = {
  "1m": { months: 1, monthly: 69 },
  "3m": { months: 3, monthly: 219 },
  "6m": { months: 6, monthly: 499 },
};

/** Valid plan ids for checkout and coupon eligibility. */
export const PLAN_IDS = Object.keys(PLAN_PRICES);

export const PLAN_SHORT_LABELS = {
  "1m": "1-month",
  "3m": "3-month",
  "6m": "6-month",
};

export const CURRENCY = "usd";

/**
 * Look up a plan by id. Returns null when the id is missing or unknown so
 * callers can fail with a 400 rather than crashing on undefined access.
 */
export function getPlan(planId) {
  if (typeof planId !== "string") return null;
  return PLAN_PRICES[planId] || null;
}

/**
 * Total cents charged today for the plan (one-time, no coupon).
 * `plan.monthly` holds the full program price for the selected duration.
 */
export function planBaseCents(plan) {
  if (!plan) return 0;
  return plan.monthly * 100;
}
