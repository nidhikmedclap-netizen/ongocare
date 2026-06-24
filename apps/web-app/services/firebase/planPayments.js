// services/firebase/planPayments.js
//
// Patient plan signup payments — source of truth in planPayments/{paymentIntentId}.
// A denormalized summary is mirrored on users/{uid} for client dashboard reads.

import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { toPaidAtMs } from "@/lib/billing/money";
import {
  hasPlanCheckout,
  isPaymentCaptured,
  resolvePaymentStatus,
} from "@/lib/billing/patientPayment";
import { PAYMENT_STATUS, paymentStatusFromIntentStatus } from "@/lib/billing/stripePayment";
import { DEFAULT_ORG_SLUG } from "@/lib/orgs";

export const PLAN_PAYMENTS_COLLECTION = "planPayments";

/** Form / onboarding keys that belong in planPayments, not users.onboarding. */
export const PLAN_PAYMENT_FORM_FIELDS = new Set([
  "paid",
  "paymentStatus",
  "paymentAuthorizedAt",
  "paidAt",
  "paymentCapturedAt",
  "paymentIntentId",
  "paymentAmount",
  "paymentCurrency",
  "paymentBrand",
  "paymentLast4",
  "paymentExpMonth",
  "paymentExpYear",
  "paymentCardholder",
  "couponId",
  "couponCode",
]);

export function planPaymentDocId(paymentIntentId, patientUid) {
  const id =
    typeof paymentIntentId === "string" ? paymentIntentId.trim() : "";
  return id || `plan-${patientUid}`;
}

export function stripPaymentFieldsFromForm(form = {}) {
  const payment = {};
  const rest = {};
  for (const [key, value] of Object.entries(form)) {
    if (value === undefined) continue;
    if (PLAN_PAYMENT_FORM_FIELDS.has(key)) {
      payment[key] = value;
    } else {
      rest[key] = value;
    }
  }
  return { payment, rest };
}

function patientFullName(data) {
  return (
    [data.firstName, data.lastName].filter(Boolean).join(" ") ||
    data.email ||
    "Patient"
  );
}

function normalizePaymentPayload({
  patientUid,
  orgSlug,
  form = {},
  userData = {},
  intent = null,
}) {
  const onb = userData.onboarding || {};
  const paymentIntentId =
    (typeof form.paymentIntentId === "string" && form.paymentIntentId.trim()) ||
    intent?.id ||
    "";
  if (!paymentIntentId && !hasPlanCheckout(form)) return null;

  const paymentStatus = intent
    ? paymentStatusFromIntentStatus(intent.status)
    : form.paymentStatus || resolvePaymentStatus(form);
  const captured = paymentStatus === PAYMENT_STATUS.CAPTURED;

  const authorizedAtMs = toPaidAtMs(
    form.paymentAuthorizedAt ?? userData.paymentAuthorizedAtMs,
  );
  const capturedAtMs = toPaidAtMs(
    form.paidAt ?? form.paymentCapturedAt ?? userData.paidAtMs,
  );

  let card = {};
  if (intent?.payment_method && typeof intent.payment_method === "object") {
    const pm = intent.payment_method;
    card = {
      brand: pm.card?.brand || "",
      last4: pm.card?.last4 || "",
      expMonth: pm.card?.exp_month ?? null,
      expYear: pm.card?.exp_year ?? null,
      cardholderName: pm.billing_details?.name || "",
    };
  } else {
    card = {
      brand: form.paymentBrand || userData.paymentBrand || "",
      last4: form.paymentLast4 || userData.paymentLast4 || "",
      expMonth: form.paymentExpMonth ?? userData.paymentExpMonth ?? null,
      expYear: form.paymentExpYear ?? userData.paymentExpYear ?? null,
      cardholderName: form.paymentCardholder || userData.paymentCardholder || "",
    };
  }

  const amountCents =
    typeof form.paymentAmount === "number"
      ? form.paymentAmount
      : typeof intent?.amount === "number"
        ? intent.amount
        : typeof userData.paymentAmountCents === "number"
          ? userData.paymentAmountCents
          : 0;

  return {
    id: planPaymentDocId(paymentIntentId, patientUid),
    patientUid,
    orgSlug: orgSlug || userData.orgSlug || DEFAULT_ORG_SLUG,
    plan: form.plan || onb.plan || userData.plan || "",
    amountCents,
    currency:
      form.paymentCurrency ||
      intent?.currency ||
      userData.paymentCurrency ||
      "usd",
    paymentStatus,
    captured,
    stripePaymentIntentId: paymentIntentId,
    doctorUid: form.doctorUid || onb.doctorUid || "",
    doctorName: form.doctor || onb.doctor || "",
    couponId: form.couponId || "",
    couponCode: form.couponCode || "",
    cardBrand: card.brand,
    cardLast4: card.last4,
    cardExpMonth: card.expMonth,
    cardExpYear: card.expYear,
    cardholderName: card.cardholderName,
    authorizedAtMs: captured ? null : authorizedAtMs || Date.now(),
    capturedAtMs: captured ? capturedAtMs || Date.now() : null,
    paidAtMs: captured ? capturedAtMs || Date.now() : authorizedAtMs,
  };
}

function userSummaryFromPlanPayment(row) {
  const captured = row.paymentStatus === PAYMENT_STATUS.CAPTURED;
  return {
    planPaymentId: row.stripePaymentIntentId || row.id,
    plan: row.plan || "",
    paymentStatus: row.paymentStatus,
    paymentAmountCents: row.amountCents,
    paymentCurrency: row.currency || "usd",
    paymentBrand: row.cardBrand || "",
    paymentLast4: row.cardLast4 || "",
    paymentExpMonth: row.cardExpMonth ?? null,
    paymentExpYear: row.cardExpYear ?? null,
    paymentCardholder: row.cardholderName || "",
    paidAtMs: captured ? row.capturedAtMs || row.paidAtMs : null,
    paymentAuthorizedAtMs: captured ? null : row.authorizedAtMs || row.paidAtMs,
    hasPlanCheckout: hasPlanCheckout({
      paymentStatus: row.paymentStatus,
      paid: captured,
    }),
  };
}

/**
 * Upsert planPayments doc + mirror summary on users/{patientUid}.
 */
export async function upsertPlanPayment(input) {
  const row = normalizePaymentPayload(input);
  if (!row || !row.patientUid) return null;

  const now = FieldValue.serverTimestamp();
  const ref = adminDb.collection(PLAN_PAYMENTS_COLLECTION).doc(row.id);
  const snap = await ref.get();

  await ref.set(
    {
      ...row,
      updatedAt: now,
      ...(snap.exists ? {} : { createdAt: now }),
    },
    { merge: true },
  );

  const summary = userSummaryFromPlanPayment(row);
  await adminDb.collection("users").doc(row.patientUid).update({
    ...summary,
    updatedAt: now,
  });

  return row;
}

export async function getPlanPaymentById(id) {
  if (!id) return null;
  const snap = await adminDb.collection(PLAN_PAYMENTS_COLLECTION).doc(id).get();
  return snap.exists ? { id: snap.id, ...snap.data() } : null;
}

export async function getPlanPaymentForPatient(patientUid) {
  if (!patientUid) return null;
  const userSnap = await adminDb.collection("users").doc(patientUid).get();
  if (!userSnap.exists) return null;
  const user = userSnap.data();
  if (user.planPaymentId) {
    const doc = await getPlanPaymentById(user.planPaymentId);
    if (doc) return doc;
  }
  const q = await adminDb
    .collection(PLAN_PAYMENTS_COLLECTION)
    .where("patientUid", "==", patientUid)
    .limit(1)
    .get();
  if (!q.empty) {
    const d = q.docs[0];
    return { id: d.id, ...d.data() };
  }
  return legacyPlanPaymentFromUser(patientUid, user);
}

export function legacyPlanPaymentFromUser(uid, data) {
  const onb = data?.onboarding || {};
  if (!hasPlanCheckout(onb) && !hasPlanCheckout(data)) return null;
  const paymentIntentId =
    typeof onb.paymentIntentId === "string" ? onb.paymentIntentId.trim() : "";
  const amountCents =
    typeof onb.paymentAmount === "number"
      ? onb.paymentAmount
      : typeof data.paymentAmountCents === "number"
        ? data.paymentAmountCents
        : 0;
  if (amountCents <= 0 && !paymentIntentId) return null;

  const paymentStatus = resolvePaymentStatus(onb.paymentStatus ? onb : data);
  const captured = isPaymentCaptured(onb.paymentStatus ? onb : data);

  return {
    id: planPaymentDocId(paymentIntentId, uid),
    patientUid: uid,
    orgSlug: data.orgSlug || DEFAULT_ORG_SLUG,
    plan: onb.plan || data.plan || "",
    amountCents,
    currency: onb.paymentCurrency || data.paymentCurrency || "usd",
    paymentStatus,
    captured,
    stripePaymentIntentId: paymentIntentId,
    doctorUid: onb.doctorUid || "",
    doctorName: onb.doctor || "",
    cardBrand: onb.paymentBrand || data.paymentBrand || "",
    cardLast4: onb.paymentLast4 || data.paymentLast4 || "",
    authorizedAtMs: toPaidAtMs(onb.paymentAuthorizedAt ?? data.paymentAuthorizedAtMs),
    capturedAtMs: toPaidAtMs(onb.paidAt ?? data.paidAtMs),
    paidAtMs: captured
      ? toPaidAtMs(onb.paidAt ?? data.paidAtMs)
      : toPaidAtMs(onb.paymentAuthorizedAt ?? data.paymentAuthorizedAtMs),
    _legacy: true,
  };
}

export function projectPlanPaymentRow(doc) {
  const data = doc.data ? doc.data() : doc;
  const id = doc.id || data.id;
  const uid = data.patientUid;
  return {
    id: data.stripePaymentIntentId || id,
    patientUid: uid,
    patientName: data.patientName || "",
    patientEmail: data.patientEmail || "",
    doctorUid: data.doctorUid || "",
    doctorName: data.doctorName || "",
    orgSlug: data.orgSlug || DEFAULT_ORG_SLUG,
    plan: data.plan || "",
    amountCents: data.amountCents || 0,
    currency: data.currency || "usd",
    paymentStatus: data.paymentStatus,
    captured: !!data.captured || data.paymentStatus === PAYMENT_STATUS.CAPTURED,
    paidAtMs: data.paidAtMs || data.capturedAtMs || data.authorizedAtMs || null,
    paymentIntentId: data.stripePaymentIntentId || id,
    cardLast4: data.cardLast4 || "",
    cardBrand: data.cardBrand || "",
  };
}

export async function listPlanPayments({ orgSlug, doctorUid, capturedOnly = false } = {}) {
  let q = adminDb.collection(PLAN_PAYMENTS_COLLECTION);
  if (orgSlug) q = q.where("orgSlug", "==", orgSlug);
  if (doctorUid) q = q.where("doctorUid", "==", doctorUid);
  const snap = await q.get();

  const rows = [];
  for (const doc of snap.docs) {
    const data = doc.data();
    if (!hasPlanCheckout({ paymentStatus: data.paymentStatus, paid: data.captured })) {
      continue;
    }
    const row = projectPlanPaymentRow(doc);
    if (capturedOnly && !row.captured) continue;
    rows.push(row);
  }

  if (rows.length > 0) {
    const uids = [...new Set(rows.map((r) => r.patientUid))];
    const userSnaps = await Promise.all(
      uids.map((uid) => adminDb.collection("users").doc(uid).get()),
    );
    const users = new Map(
      userSnaps.filter((s) => s.exists).map((s) => [s.id, s.data()]),
    );
    for (const row of rows) {
      const u = users.get(row.patientUid);
      if (u) {
        row.patientName = patientFullName(u);
        row.patientEmail = u.email || "";
      }
    }
    rows.sort((a, b) => (b.paidAtMs || 0) - (a.paidAtMs || 0));
    return rows;
  }

  // Legacy fallback: scan users until migration completes
  let uq = adminDb.collection("users").where("role", "==", "patient");
  if (orgSlug) uq = uq.where("orgSlug", "==", orgSlug);
  if (doctorUid) uq = uq.where("onboarding.doctorUid", "==", doctorUid);
  const userSnap = await uq.get();
  const legacy = [];
  for (const doc of userSnap.docs) {
    const legacyRow = legacyPlanPaymentFromUser(doc.id, doc.data());
    if (!legacyRow) continue;
    const row = projectPlanPaymentRow(legacyRow);
    row.patientName = patientFullName(doc.data());
    row.patientEmail = doc.data().email || "";
    if (capturedOnly && !row.captured) continue;
    legacy.push(row);
  }
  legacy.sort((a, b) => (b.paidAtMs || 0) - (a.paidAtMs || 0));
  return legacy;
}

export async function findPatientUidByPaymentIntentId(paymentIntentId) {
  if (!paymentIntentId) return null;
  const snap = await adminDb
    .collection(PLAN_PAYMENTS_COLLECTION)
    .doc(paymentIntentId)
    .get();
  if (snap.exists) return snap.data().patientUid || null;

  const legacy = await adminDb
    .collection("users")
    .where("planPaymentId", "==", paymentIntentId)
    .limit(1)
    .get();
  if (!legacy.empty) return legacy.docs[0].id;

  const onb = await adminDb
    .collection("users")
    .where("onboarding.paymentIntentId", "==", paymentIntentId)
    .limit(1)
    .get();
  if (!onb.empty) return onb.docs[0].id;
  return null;
}

/** Migrate one patient user doc into planPayments (idempotent). */
export async function migrateLegacyPlanPaymentForUser(uid, userData) {
  const legacy = legacyPlanPaymentFromUser(uid, userData);
  if (!legacy) return { migrated: false, reason: "no_payment" };
  if (!legacy._legacy) return { migrated: false, reason: "already_migrated" };

  const row = normalizePaymentPayload({
    patientUid: uid,
    orgSlug: userData.orgSlug,
    form: {
      ...userData.onboarding,
      paymentIntentId: legacy.stripePaymentIntentId,
      paymentAmount: legacy.amountCents,
      paymentStatus: legacy.paymentStatus,
      paymentCurrency: legacy.currency,
      paymentBrand: legacy.cardBrand,
      paymentLast4: legacy.cardLast4,
      plan: legacy.plan,
      doctorUid: legacy.doctorUid,
      doctor: legacy.doctorName,
      paidAt: legacy.capturedAtMs,
      paymentAuthorizedAt: legacy.authorizedAtMs,
      paid: legacy.captured,
    },
    userData,
  });
  if (!row) return { migrated: false, reason: "invalid" };

  await upsertPlanPayment({
    patientUid: uid,
    orgSlug: row.orgSlug,
    form: {
      paymentIntentId: row.stripePaymentIntentId,
      paymentAmount: row.amountCents,
      paymentStatus: row.paymentStatus,
      paymentCurrency: row.currency,
      paymentBrand: row.cardBrand,
      paymentLast4: row.cardLast4,
      plan: row.plan,
      doctorUid: row.doctorUid,
      doctor: row.doctorName,
      paidAt: row.capturedAtMs,
      paymentAuthorizedAt: row.authorizedAtMs,
      paid: row.captured,
    },
    userData,
  });
  return { migrated: true, planPaymentId: row.id };
}
