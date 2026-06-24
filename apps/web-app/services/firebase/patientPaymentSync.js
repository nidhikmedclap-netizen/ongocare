// services/firebase/patientPaymentSync.js
//
// Sync planPayments + user summary from a Stripe PaymentIntent
// (webhook after Dashboard capture/cancel, or server-side refresh).

import { adminDb } from "@/lib/firebase/admin";
import {
  findPatientUidByPaymentIntentId,
  upsertPlanPayment,
} from "@/services/firebase/planPayments";

const USERS = "users";

async function findUserByEmail(email) {
  const normalized = typeof email === "string" ? email.trim().toLowerCase() : "";
  if (!normalized) return null;
  const snap = await adminDb
    .collection(USERS)
    .where("email", "==", normalized)
    .limit(1)
    .get();
  if (snap.empty) return null;
  return snap.docs[0];
}

async function resolveUserDocForIntent(intent, explicitUid) {
  if (explicitUid) {
    const snap = await adminDb.collection(USERS).doc(explicitUid).get();
    if (snap.exists) return snap;
  }
  const byPi = await findPatientUidByPaymentIntentId(intent.id);
  if (byPi) {
    const snap = await adminDb.collection(USERS).doc(byPi).get();
    if (snap.exists) return snap;
  }
  const metaUid =
    typeof intent.metadata?.firebaseUid === "string"
      ? intent.metadata.firebaseUid.trim()
      : "";
  if (metaUid) {
    const snap = await adminDb.collection(USERS).doc(metaUid).get();
    if (snap.exists) return snap;
  }
  const metaEmail =
    typeof intent.metadata?.email === "string" ? intent.metadata.email : "";
  if (metaEmail) {
    const byEmail = await findUserByEmail(metaEmail);
    if (byEmail) {
      const userEmail = (byEmail.data()?.email || "").trim().toLowerCase();
      const normalizedMeta = metaEmail.trim().toLowerCase();
      if (userEmail === normalizedMeta) return byEmail;
    }
  }
  return null;
}

/**
 * Apply PI state to planPayments + users/{uid} summary.
 */
export async function syncPatientPaymentFromIntent(intent, { uid: explicitUid } = {}) {
  if (!intent?.id) return null;
  const doc = await resolveUserDocForIntent(intent, explicitUid);
  if (!doc) return null;

  const userData = doc.data();
  const row = await upsertPlanPayment({
    patientUid: doc.id,
    orgSlug: userData.orgSlug,
    form: userData.onboarding || {},
    userData,
    intent,
  });
  if (!row) return null;

  return { updated: true, uid: doc.id, paymentStatus: row.paymentStatus };
}

/** Pull latest PI state from Stripe for one patient doc. */
export async function syncPatientPaymentByUid(uid) {
  const snap = await adminDb.collection(USERS).doc(uid).get();
  if (!snap.exists) {
    return { ok: false, reason: "patient_not_found" };
  }
  const data = snap.data();
  const paymentIntentId =
    data.planPaymentId ||
    (typeof data.onboarding?.paymentIntentId === "string"
      ? data.onboarding.paymentIntentId.trim()
      : "");
  if (!paymentIntentId) {
    return { ok: false, reason: "missing_payment_intent_id" };
  }

  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret || secret === "sk_test_REPLACE_ME") {
    return { ok: false, reason: "stripe_not_configured" };
  }

  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(secret);
  const intent = await stripe.paymentIntents.retrieve(paymentIntentId, {
    expand: ["payment_method"],
  });
  const result = await syncPatientPaymentFromIntent(intent, { uid });
  if (!result) {
    return {
      ok: false,
      reason: "sync_failed",
      stripeStatus: intent.status,
      paymentIntentId,
    };
  }
  return {
    ok: true,
    uid: result.uid,
    paymentStatus: result.paymentStatus,
    stripeStatus: intent.status,
    paymentIntentId,
  };
}
