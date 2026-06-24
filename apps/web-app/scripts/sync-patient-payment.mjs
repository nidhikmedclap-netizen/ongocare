#!/usr/bin/env node
//
// One-off: sync plan payment from Stripe for a patient.
// Usage (from apps/web-app):
//   node scripts/sync-patient-payment.mjs --pi=pi_xxx
//   node scripts/sync-patient-payment.mjs --email=test@example.com

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import Stripe from "stripe";

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

const piArg = process.argv.find((a) => a.startsWith("--pi="))?.slice(5);
const emailArg = process.argv.find((a) => a.startsWith("--email="))?.slice(8);

if (!piArg && !emailArg) {
  console.error("Usage: node scripts/sync-patient-payment.mjs --pi=pi_xxx");
  process.exit(1);
}

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
const stripeSecret = process.env.STRIPE_SECRET_KEY;

if (!projectId || !clientEmail || !privateKey || !stripeSecret) {
  console.error("Missing FIREBASE_ADMIN_* or STRIPE_SECRET_KEY in .env.local");
  process.exit(1);
}

if (!getApps().length) {
  initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

const db = getFirestore();
const stripe = new Stripe(stripeSecret);

const PAYMENT_STATUS = {
  CAPTURED: "captured",
  AUTHORIZED: "authorized",
  CANCELED: "canceled",
};

function paymentStatusFromIntentStatus(status) {
  if (status === "succeeded") return PAYMENT_STATUS.CAPTURED;
  if (status === "requires_capture") return PAYMENT_STATUS.AUTHORIZED;
  if (status === "canceled") return PAYMENT_STATUS.CANCELED;
  return "";
}

function toPaidAtMs(value) {
  if (value == null) return Date.now();
  if (typeof value === "number") return value;
  if (typeof value?.toMillis === "function") return value.toMillis();
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : Date.now();
}

async function findDoc() {
  if (piArg) {
    const byPlan = await db.collection("planPayments").doc(piArg).get();
    if (byPlan.exists && byPlan.data().patientUid) {
      const snap = await db.collection("users").doc(byPlan.data().patientUid).get();
      if (snap.exists) return snap;
    }
    const bySummary = await db
      .collection("users")
      .where("planPaymentId", "==", piArg)
      .limit(1)
      .get();
    if (!bySummary.empty) return bySummary.docs[0];
    const snap = await db
      .collection("users")
      .where("onboarding.paymentIntentId", "==", piArg)
      .limit(1)
      .get();
    if (!snap.empty) return snap.docs[0];
  }
  if (emailArg) {
    const snap = await db
      .collection("users")
      .where("email", "==", emailArg)
      .limit(1)
      .get();
    if (!snap.empty) return snap.docs[0];
  }
  return null;
}

const doc = await findDoc();
if (!doc) {
  console.error("No patient found.");
  process.exit(1);
}

const data = doc.data();
const onb = data.onboarding || {};
const paymentIntentId =
  piArg ||
  data.planPaymentId ||
  (typeof onb.paymentIntentId === "string" ? onb.paymentIntentId.trim() : "");
if (!paymentIntentId) {
  console.error("Patient has no paymentIntentId.");
  process.exit(1);
}

const intent = await stripe.paymentIntents.retrieve(paymentIntentId, {
  expand: ["payment_method"],
});

console.log("Patient uid:", doc.id);
console.log("Stripe PI status:", intent.status);

const paymentStatus = paymentStatusFromIntentStatus(intent.status);
const captured = paymentStatus === PAYMENT_STATUS.CAPTURED;
const now = Date.now();
const authorizedAtMs = captured ? null : intent.created ? intent.created * 1000 : now;
const capturedAtMs = captured ? (intent.created ? intent.created * 1000 : now) : null;

let card = {};
if (intent.payment_method && typeof intent.payment_method === "object") {
  const pm = intent.payment_method;
  card = {
    cardBrand: pm.card?.brand || "",
    cardLast4: pm.card?.last4 || "",
    cardExpMonth: pm.card?.exp_month ?? null,
    cardExpYear: pm.card?.exp_year ?? null,
    cardholderName: pm.billing_details?.name || "",
  };
}

const row = {
  id: paymentIntentId,
  patientUid: doc.id,
  orgSlug: data.orgSlug || "ongo",
  plan: onb.plan || data.plan || "",
  amountCents: intent.amount,
  currency: intent.currency || "usd",
  paymentStatus,
  captured,
  stripePaymentIntentId: paymentIntentId,
  doctorUid: onb.doctorUid || "",
  doctorName: onb.doctor || "",
  ...card,
  authorizedAtMs,
  capturedAtMs,
  paidAtMs: captured ? capturedAtMs : authorizedAtMs,
};

const summary = {
  planPaymentId: paymentIntentId,
  plan: row.plan,
  paymentStatus,
  paymentAmountCents: row.amountCents,
  paymentCurrency: row.currency,
  paymentBrand: row.cardBrand || "",
  paymentLast4: row.cardLast4 || "",
  paymentExpMonth: row.cardExpMonth ?? null,
  paymentExpYear: row.cardExpYear ?? null,
  paymentCardholder: row.cardholderName || "",
  paidAtMs: captured ? capturedAtMs : null,
  paymentAuthorizedAtMs: captured ? null : authorizedAtMs,
  hasPlanCheckout: captured || paymentStatus === PAYMENT_STATUS.AUTHORIZED,
};

const ts = FieldValue.serverTimestamp();
await db
  .collection("planPayments")
  .doc(paymentIntentId)
  .set({ ...row, updatedAt: ts, createdAt: ts }, { merge: true });
await doc.ref.update({ ...summary, updatedAt: ts });

console.log(
  "Updated planPayments + user summary → paymentStatus:",
  paymentStatus,
  "paid:",
  captured,
);
