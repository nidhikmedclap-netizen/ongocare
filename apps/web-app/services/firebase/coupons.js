// services/firebase/coupons.js
//
// Server-side helpers for the `coupons` collection.
//
// Coupon shape (Firestore: coupons/{id}):
//   {
//     code:            "WELCOME20",        // unique, uppercase, [A-Z0-9_-]{3,32}
//     discountPercent: 20,                 // 1..100
//     maxDiscountCents: 10000 | null,        // optional dollar cap on discount
//     eligiblePlans: ["3m", "6m"] | null,    // null/empty = all plans (legacy)
//     orgSlug:         "ongo" | null,      // null = global (works on every portal)
//     maxUses:         100 | null,         // null = unlimited
//     usesCount:       0,
//     expiresAt:       Timestamp | null,
//     active:          true,
//     createdBy:       uid,
//     createdByEmail:  "ops@example.com",
//     createdAt:       Timestamp,
//     updatedAt:       Timestamp,
//   }
//
// Why a separate collection (not Stripe Coupons): we need per-portal
// scoping, custom enforcement rules, and tight admin UI control. Stripe
// Coupons would force the entire pricing dance through Stripe Customers
// + Subscriptions, which the current one-shot PaymentIntent flow doesn't
// use. We can revisit if/when we move to recurring billing.
//
// All helpers use the Admin SDK and bypass Firestore Security Rules — they
// must only be called from trusted server code (route handlers).

import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { PLAN_IDS, PLAN_SHORT_LABELS } from "@/lib/billing/plans";
import { DEFAULT_ORG_SLUG } from "@/services/firebase/users";

const COUPONS_COLLECTION = "coupons";
// Redemption ledger lives under each coupon as a subcollection. Document
// IDs are the Stripe PaymentIntent IDs, which makes redemption naturally
// idempotent: a second redeem call with the same PI is a no-op.
const REDEMPTIONS_SUBCOLLECTION = "redemptions";

// Pattern enforced both at create time and at lookup time. Hyphens and
// underscores are allowed because many real-world campaigns use them
// (e.g., "SUMMER-25"); spaces and lower-case are explicitly rejected so
// codes are case-insensitive and unambiguous in URLs / emails.
const CODE_REGEX = /^[A-Z0-9_-]{3,32}$/;

export { PLAN_IDS as COUPON_PLAN_IDS };

const STRIPE_MIN_CENTS = 50;

function planLabel(planId) {
  return PLAN_SHORT_LABELS[planId] || "selected";
}

function projectEligiblePlans(raw) {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const cleaned = raw.filter((p) => PLAN_IDS.includes(p));
  return cleaned.length ? cleaned : null;
}

export function parseEligiblePlansInput(raw) {
  if (raw == null) return null;
  if (!Array.isArray(raw)) {
    throw new Error("Eligible plans must be a list");
  }
  const cleaned = [
    ...new Set(
      raw.map((p) => String(p).trim()).filter((p) => PLAN_IDS.includes(p)),
    ),
  ];
  if (cleaned.length === 0) {
    throw new Error("Select at least one plan this coupon applies to");
  }
  return cleaned.sort((a, b) => PLAN_IDS.indexOf(a) - PLAN_IDS.indexOf(b));
}

function parseMaxDiscountCentsInput(raw) {
  if (raw == null || raw === "") return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error("Max discount must be a positive dollar amount, or left blank");
  }
  const cents = Math.round(n * 100);
  if (cents < 1) {
    throw new Error("Max discount must be at least $0.01");
  }
  return cents;
}

function couponAppliesToPlan(data, planId) {
  const plans = projectEligiblePlans(data.eligiblePlans);
  if (!plans) return true;
  return plans.includes(planId);
}

function computeDiscountCents(base, discountPercent, maxDiscountCents) {
  let discountCents = Math.floor((base * discountPercent) / 100);
  if (typeof maxDiscountCents === "number" && maxDiscountCents >= 0) {
    discountCents = Math.min(discountCents, maxDiscountCents);
  }
  const finalCents = Math.max(STRIPE_MIN_CENTS, base - discountCents);
  return {
    discountCents: base - finalCents,
    finalCents,
  };
}

/* ─── Input sanitization ─────────────────────────────────────────────── */

/**
 * Uppercase + trim + reject codes that don't match the allowed shape.
 * Returns the cleaned code on success, throws on failure.
 */
export function sanitizeCouponCode(raw) {
  const v = String(raw || "").trim().toUpperCase();
  if (!CODE_REGEX.test(v)) {
    throw new Error(
      "Coupon code must be 3–32 characters, letters/digits/hyphen/underscore only",
    );
  }
  return v;
}

function toMillisMaybe(v) {
  if (!v) return null;
  if (typeof v?.toMillis === "function") return v.toMillis();
  if (typeof v === "number" && Number.isFinite(v)) return v;
  return null;
}

/**
 * Internal: turn a stored doc into the shape we return to clients. Keeps
 * Timestamps out of the wire format (we send milliseconds instead, which
 * JSON-serializes cleanly).
 */
function projectCoupon(id, data) {
  return {
    id,
    code: data.code || "",
    discountPercent:
      typeof data.discountPercent === "number" ? data.discountPercent : 0,
    maxDiscountCents:
      typeof data.maxDiscountCents === "number" ? data.maxDiscountCents : null,
    eligiblePlans: projectEligiblePlans(data.eligiblePlans),
    orgSlug: data.orgSlug || null,
    maxUses: typeof data.maxUses === "number" ? data.maxUses : null,
    usesCount: typeof data.usesCount === "number" ? data.usesCount : 0,
    expiresAtMs: toMillisMaybe(data.expiresAt),
    active: data.active !== false,
    createdBy: data.createdBy || "",
    createdByEmail: data.createdByEmail || "",
    createdAtMs: toMillisMaybe(data.createdAt),
    updatedAtMs: toMillisMaybe(data.updatedAt),
  };
}

/* ─── Mutations ──────────────────────────────────────────────────────── */

/**
 * Create a new coupon. Authorization (super-admin only) is enforced
 * upstream in the route handler — this function trusts what reaches it,
 * but still validates each field defensively so a buggy client can't
 * write garbage.
 *
 * `creator` is { uid, email } — stamped onto the doc so we can audit
 * "who created which promo".
 *
 * Returns the projected coupon (so the UI can append it to the list
 * without a second round-trip).
 */
export async function createCoupon(input = {}, creator = {}) {
  const code = sanitizeCouponCode(input.code);

  const discountPercent = Number(input.discountPercent);
  if (!Number.isInteger(discountPercent) || discountPercent < 1 || discountPercent > 100) {
    throw new Error("Discount percent must be a whole number between 1 and 100");
  }

  // orgSlug: empty / null / "global" all map to a global coupon (null).
  // A real slug stays as-is.
  let orgSlug = null;
  if (typeof input.orgSlug === "string") {
    const trimmed = input.orgSlug.trim();
    if (trimmed && trimmed.toLowerCase() !== "global") orgSlug = trimmed;
  }

  let maxUses = null;
  if (input.maxUses != null && input.maxUses !== "") {
    const n = Number(input.maxUses);
    if (!Number.isInteger(n) || n < 1) {
      throw new Error("Max uses must be a whole number of 1 or higher, or left blank");
    }
    maxUses = n;
  }

  let expiresAt = null;
  if (input.expiresAtMs != null && input.expiresAtMs !== "") {
    const ms = Number(input.expiresAtMs);
    if (!Number.isFinite(ms) || ms <= Date.now()) {
      throw new Error("Expiry must be a future date");
    }
    expiresAt = Timestamp.fromMillis(ms);
  }

  const maxDiscountCents = parseMaxDiscountCentsInput(input.maxDiscountDollars);
  const eligiblePlans = parseEligiblePlansInput(input.eligiblePlans);

  // Code uniqueness check. Race conditions are theoretically possible
  // here (two admins creating the same code at the same instant) but the
  // create surface is admin-only with a small operator pool, so a
  // post-hoc duplicate would just need a manual cleanup. Not worth a
  // transaction for the typical volume.
  const dup = await adminDb
    .collection(COUPONS_COLLECTION)
    .where("code", "==", code)
    .limit(1)
    .get();
  if (!dup.empty) throw new Error(`Coupon code "${code}" already exists`);

  const now = FieldValue.serverTimestamp();
  const doc = {
    code,
    discountPercent,
    maxDiscountCents,
    eligiblePlans,
    orgSlug,
    maxUses,
    usesCount: 0,
    expiresAt,
    active: input.active !== false,
    createdBy: creator?.uid || "",
    createdByEmail: creator?.email || "",
    createdAt: now,
    updatedAt: now,
  };
  const ref = await adminDb.collection(COUPONS_COLLECTION).add(doc);
  const written = await ref.get();
  return projectCoupon(ref.id, written.data());
}

/**
 * List coupons visible to the caller.
 *
 *   - superadmin (isSuper=true): every coupon
 *   - portal admin            : their own portal's coupons + global ones
 *
 * Sorted newest-first so freshly minted promos appear at the top.
 */
export async function listCoupons(actingOrgSlug, isSuper) {
  let docs = [];

  if (isSuper && !actingOrgSlug) {
    const snap = await adminDb.collection(COUPONS_COLLECTION).get();
    docs = snap.docs;
  } else {
    const slug = actingOrgSlug || DEFAULT_ORG_SLUG;
    const [portalSnap, globalSnap] = await Promise.all([
      adminDb
        .collection(COUPONS_COLLECTION)
        .where("orgSlug", "==", slug)
        .get(),
      adminDb
        .collection(COUPONS_COLLECTION)
        .where("orgSlug", "==", null)
        .get(),
    ]);
    docs = [...portalSnap.docs, ...globalSnap.docs];
  }

  const byId = new Map();
  for (const d of docs) {
    byId.set(d.id, projectCoupon(d.id, d.data()));
  }
  const scoped = Array.from(byId.values());
  scoped.sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
  return scoped;
}

/**
 * Patch the editable fields of an existing coupon. Code is intentionally
 * NOT editable — renaming a code with redemptions in the wild creates a
 * bad audit trail.
 *
 * Returns the projected updated coupon.
 */
export async function updateCoupon(id, fields = {}) {
  const ref = adminDb.collection(COUPONS_COLLECTION).doc(id);
  const snap = await ref.get();
  if (!snap.exists) throw new Error("Coupon not found");

  const updates = { updatedAt: FieldValue.serverTimestamp() };

  if (Object.prototype.hasOwnProperty.call(fields, "active")) {
    updates.active = !!fields.active;
  }
  if (Object.prototype.hasOwnProperty.call(fields, "discountPercent")) {
    const n = Number(fields.discountPercent);
    if (!Number.isInteger(n) || n < 1 || n > 100) {
      throw new Error("Discount percent must be a whole number between 1 and 100");
    }
    updates.discountPercent = n;
  }
  if (Object.prototype.hasOwnProperty.call(fields, "maxUses")) {
    if (fields.maxUses == null || fields.maxUses === "") {
      updates.maxUses = null;
    } else {
      const n = Number(fields.maxUses);
      if (!Number.isInteger(n) || n < 1) {
        throw new Error("Max uses must be a whole number of 1 or higher, or null");
      }
      updates.maxUses = n;
    }
  }
  if (Object.prototype.hasOwnProperty.call(fields, "expiresAtMs")) {
    if (fields.expiresAtMs == null || fields.expiresAtMs === "") {
      updates.expiresAt = null;
    } else {
      const ms = Number(fields.expiresAtMs);
      if (!Number.isFinite(ms)) throw new Error("Invalid expiry");
      updates.expiresAt = Timestamp.fromMillis(ms);
    }
  }
  if (Object.prototype.hasOwnProperty.call(fields, "orgSlug")) {
    if (!fields.orgSlug || String(fields.orgSlug).toLowerCase() === "global") {
      updates.orgSlug = null;
    } else {
      updates.orgSlug = String(fields.orgSlug).trim();
    }
  }
  if (Object.prototype.hasOwnProperty.call(fields, "maxDiscountDollars")) {
    updates.maxDiscountCents = parseMaxDiscountCentsInput(fields.maxDiscountDollars);
  }
  if (Object.prototype.hasOwnProperty.call(fields, "eligiblePlans")) {
    updates.eligiblePlans = parseEligiblePlansInput(fields.eligiblePlans);
  }

  await ref.update(updates);
  const next = await ref.get();
  return projectCoupon(ref.id, next.data());
}

/**
 * Hard-delete a coupon. Doesn't touch the redemptions subcollection —
 * that's intentional, the audit trail outlives the coupon.
 */
export async function deleteCoupon(id) {
  await adminDb.collection(COUPONS_COLLECTION).doc(id).delete();
}

/* ─── Public checkout helpers ────────────────────────────────────────── */

/**
 * Validate a code against a planned charge. Used by:
 *   1. /api/coupons/validate (price preview before payment)
 *   2. /api/stripe/payment-intent (re-checks the same code authoritatively)
 *
 * Returns:
 *   { ok: true, coupon: { id, code, discountPercent }, discountCents,
 *     finalCents }
 *   { ok: false, reason: "not_found" | "inactive" | "expired" | "exhausted"
 *                       | "wrong_portal" | "wrong_plan", message }
 *
 * `planId` is the checkout plan (`1m`, `3m`, `6m`). When omitted, plan
 * eligibility is not checked (legacy callers only).
 *
 * `baseCents` is the un-discounted amount (in cents) the patient would pay
 * without any coupon. We never let `finalCents` drop below Stripe's $0.50
 * USD floor — below that, Stripe refuses the PaymentIntent outright.
 */
export async function validateForCheckout({ code, orgSlug, baseCents, planId }) {
  let cleaned;
  try {
    cleaned = sanitizeCouponCode(code);
  } catch (err) {
    return { ok: false, reason: "not_found", message: err.message };
  }

  const snap = await adminDb
    .collection(COUPONS_COLLECTION)
    .where("code", "==", cleaned)
    .limit(1)
    .get();
  if (snap.empty) {
    return { ok: false, reason: "not_found", message: "That code isn't valid." };
  }

  const doc = snap.docs[0];
  const data = doc.data();

  if (data.active === false) {
    return { ok: false, reason: "inactive", message: "That code is no longer active." };
  }
  const expMs = toMillisMaybe(data.expiresAt);
  if (expMs != null && expMs <= Date.now()) {
    return { ok: false, reason: "expired", message: "That code has expired." };
  }
  if (typeof data.maxUses === "number" && data.usesCount >= data.maxUses) {
    return { ok: false, reason: "exhausted", message: "That code has reached its usage limit." };
  }
  // Portal scope: a portal-bound coupon must match the patient's portal.
  // Global coupons (orgSlug === null) skip the check entirely.
  if (data.orgSlug && data.orgSlug !== orgSlug) {
    return { ok: false, reason: "wrong_portal", message: "That code can't be used on this portal." };
  }
  if (planId && !couponAppliesToPlan(data, planId)) {
    return {
      ok: false,
      reason: "wrong_plan",
      message: `That code can't be used on the ${planLabel(planId)} plan.`,
    };
  }

  const base = Number(baseCents);
  if (!Number.isFinite(base) || base <= 0) {
    return { ok: false, reason: "not_found", message: "Invalid base amount." };
  }

  const maxDiscountCents =
    typeof data.maxDiscountCents === "number" ? data.maxDiscountCents : null;
  const { discountCents: realDiscountCents, finalCents } = computeDiscountCents(
    base,
    data.discountPercent,
    maxDiscountCents,
  );

  return {
    ok: true,
    coupon: {
      id: doc.id,
      code: data.code,
      discountPercent: data.discountPercent,
      maxDiscountCents,
      eligiblePlans: projectEligiblePlans(data.eligiblePlans),
    },
    discountCents: realDiscountCents,
    finalCents,
  };
}

/**
 * Idempotently mark a coupon as used for a given PaymentIntent. Safe to
 * call multiple times — only the first call increments `usesCount`.
 *
 *   - Writes coupons/{couponId}/redemptions/{paymentIntentId} with
 *     `{ paymentIntentId, redeemedAt }`. If the doc already exists,
 *     return early without incrementing.
 *   - Inside the same transaction, re-checks `usesCount < maxUses` so
 *     two concurrent redemptions can't overshoot the cap.
 *
 * Returns { applied: boolean, alreadyRedeemed: boolean }.
 *   - applied=true        → we incremented usesCount on this call
 *   - alreadyRedeemed=true → no-op because this PI was already recorded
 */
export async function redeemCoupon({ couponId, paymentIntentId }) {
  if (!couponId || !paymentIntentId) {
    throw new Error("redeemCoupon requires couponId and paymentIntentId");
  }
  const couponRef = adminDb.collection(COUPONS_COLLECTION).doc(couponId);
  const redemptionRef = couponRef
    .collection(REDEMPTIONS_SUBCOLLECTION)
    .doc(paymentIntentId);

  return adminDb.runTransaction(async (tx) => {
    const [couponSnap, redemptionSnap] = await Promise.all([
      tx.get(couponRef),
      tx.get(redemptionRef),
    ]);
    if (!couponSnap.exists) {
      throw new Error("Coupon not found");
    }
    if (redemptionSnap.exists) {
      return { applied: false, alreadyRedeemed: true };
    }
    const data = couponSnap.data();
    if (
      typeof data.maxUses === "number" &&
      typeof data.usesCount === "number" &&
      data.usesCount >= data.maxUses
    ) {
      // Should not normally hit this — the validate step caught it — but
      // defends against a race where two patients both saw usesCount = N-1
      // and both confirmed payment before either reached the redeem call.
      throw new Error("Coupon is exhausted");
    }
    tx.set(redemptionRef, {
      paymentIntentId,
      redeemedAt: FieldValue.serverTimestamp(),
    });
    tx.update(couponRef, {
      usesCount: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return { applied: true, alreadyRedeemed: false };
  });
}
