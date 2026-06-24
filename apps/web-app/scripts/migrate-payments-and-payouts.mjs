#!/usr/bin/env node
//
// Backfill planPayments + doctorPayoutAccounts from legacy users docs.
//
// Usage (from apps/web-app):
//   node scripts/migrate-payments-and-payouts.mjs
//   node scripts/migrate-payments-and-payouts.mjs --dry-run
//   node scripts/migrate-payments-and-payouts.mjs --role=patient
//   node scripts/migrate-payments-and-payouts.mjs --role=doctor

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

function loadDotenv(filepath) {
  if (!fs.existsSync(filepath)) return;
  for (const line of fs.readFileSync(filepath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    process.env[key] = val.replace(/\\n/g, "\n");
  }
}

loadDotenv(path.join(projectRoot, ".env.local"));

const dryRun = process.argv.includes("--dry-run");
const roleArg = process.argv.find((a) => a.startsWith("--role="))?.slice(7) || "all";

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

if (!projectId || !clientEmail || !privateKey) {
  console.error("Missing FIREBASE_ADMIN_* in .env.local");
  process.exit(1);
}

if (!getApps().length) {
  initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

const db = getFirestore();

const PAYMENT_STATUS = {
  CAPTURED: "captured",
  AUTHORIZED: "authorized",
  CANCELED: "canceled",
  NONE: "",
};

function toPaidAtMs(value) {
  if (value == null) return null;
  if (typeof value === "number") return value;
  if (typeof value?.toMillis === "function") return value.toMillis();
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function resolvePaymentStatus(source) {
  const raw = source.paymentStatus;
  if (raw === PAYMENT_STATUS.CAPTURED || raw === PAYMENT_STATUS.AUTHORIZED) {
    return raw;
  }
  if (raw === PAYMENT_STATUS.CANCELED) return PAYMENT_STATUS.CANCELED;
  if (source.paid) return PAYMENT_STATUS.CAPTURED;
  return PAYMENT_STATUS.NONE;
}

function hasPlanCheckout(source) {
  const status = resolvePaymentStatus(source);
  return status === PAYMENT_STATUS.AUTHORIZED || status === PAYMENT_STATUS.CAPTURED;
}

function planPaymentDocId(paymentIntentId, patientUid) {
  const id = typeof paymentIntentId === "string" ? paymentIntentId.trim() : "";
  return id || `plan-${patientUid}`;
}

function legacyPlanPaymentFromUser(uid, data) {
  const onb = data?.onboarding || {};
  const merged = {
    paymentStatus: data.paymentStatus || onb.paymentStatus,
    paid: data.hasPlanCheckout || onb.paid,
    paymentIntentId: data.planPaymentId || onb.paymentIntentId,
    paymentAmount: data.paymentAmountCents ?? onb.paymentAmount,
  };
  if (!hasPlanCheckout(merged) && !hasPlanCheckout(onb)) return null;

  const paymentIntentId =
    typeof onb.paymentIntentId === "string"
      ? onb.paymentIntentId.trim()
      : typeof data.planPaymentId === "string"
        ? data.planPaymentId.trim()
        : "";
  const amountCents =
    typeof onb.paymentAmount === "number"
      ? onb.paymentAmount
      : typeof data.paymentAmountCents === "number"
        ? data.paymentAmountCents
        : 0;
  if (amountCents <= 0 && !paymentIntentId) return null;

  const paymentStatus = resolvePaymentStatus(onb.paymentStatus ? onb : data);
  const captured = paymentStatus === PAYMENT_STATUS.CAPTURED;

  return {
    id: planPaymentDocId(paymentIntentId, uid),
    patientUid: uid,
    orgSlug: data.orgSlug || "ongo",
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
    paidAtMs: captured ? row.capturedAtMs || row.paidAtMs : null,
    paymentAuthorizedAtMs: captured ? null : row.authorizedAtMs || row.paidAtMs,
    hasPlanCheckout: hasPlanCheckout({ paymentStatus: row.paymentStatus, paid: captured }),
  };
}

async function migratePatient(doc) {
  const uid = doc.id;
  const data = doc.data();
  const existing = await db.collection("planPayments").doc(data.planPaymentId || "").get();
  if (existing.exists && data.planPaymentId) {
    return { uid, skipped: true, reason: "already_migrated" };
  }

  const legacy = legacyPlanPaymentFromUser(uid, data);
  if (!legacy) return { uid, skipped: true, reason: "no_payment" };

  const summary = userSummaryFromPlanPayment(legacy);
  const now = FieldValue.serverTimestamp();

  if (dryRun) {
    return { uid, migrated: true, dryRun: true, planPaymentId: legacy.id };
  }

  await db
    .collection("planPayments")
    .doc(legacy.id)
    .set(
      {
        ...legacy,
        updatedAt: now,
        createdAt: now,
      },
      { merge: true },
    );

  await doc.ref.update({ ...summary, updatedAt: now });
  return { uid, migrated: true, planPaymentId: legacy.id };
}

async function migrateDoctor(doc) {
  const uid = doc.id;
  const data = doc.data();
  const payoutSnap = await db.collection("doctorPayoutAccounts").doc(uid).get();
  if (payoutSnap.exists && !data.banking) {
    return { uid, skipped: true, reason: "already_migrated" };
  }

  const banking = data.banking;
  const rate = data.appointmentPaymentCents;
  if (!banking && rate == null) {
    return { uid, skipped: true, reason: "no_payout_data" };
  }

  const payload = {
    doctorUid: uid,
    orgSlug: data.orgSlug || "ongo",
    updatedAt: FieldValue.serverTimestamp(),
  };
  if (banking) payload.banking = banking;
  if (rate != null) payload.appointmentPaymentCents = rate;

  if (dryRun) {
    return { uid, migrated: true, dryRun: true };
  }

  const ref = db.collection("doctorPayoutAccounts").doc(uid);
  const snap = await ref.get();
  await ref.set(
    {
      ...payload,
      ...(snap.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
    },
    { merge: true },
  );

  const userUpdates = { updatedAt: FieldValue.serverTimestamp() };
  if (rate != null) userUpdates.appointmentPaymentCents = rate;
  await doc.ref.update(userUpdates);
  if (banking) {
    await doc.ref.update({ banking: FieldValue.delete() });
  }

  return { uid, migrated: true };
}

async function main() {
  console.log(`Migrate payments/payouts (dryRun=${dryRun}, role=${roleArg})`);

  const stats = {
    patientsMigrated: 0,
    patientsSkipped: 0,
    doctorsMigrated: 0,
    doctorsSkipped: 0,
  };

  if (roleArg === "all" || roleArg === "patient") {
    const snap = await db.collection("users").where("role", "==", "patient").get();
    for (const doc of snap.docs) {
      const result = await migratePatient(doc);
      if (result.migrated) stats.patientsMigrated += 1;
      else stats.patientsSkipped += 1;
      console.log("patient", result);
    }
  }

  if (roleArg === "all" || roleArg === "doctor") {
    const snap = await db.collection("users").where("role", "==", "doctor").get();
    for (const doc of snap.docs) {
      const result = await migrateDoctor(doc);
      if (result.migrated) stats.doctorsMigrated += 1;
      else stats.doctorsSkipped += 1;
      console.log("doctor", result);
    }
  }

  console.log("Done.", stats);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
