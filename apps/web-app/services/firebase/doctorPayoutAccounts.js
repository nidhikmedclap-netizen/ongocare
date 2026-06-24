// services/firebase/doctorPayoutAccounts.js
//
// Doctor banking + visit payment rate — source of truth in
// doctorPayoutAccounts/{doctorUid}. Sensitive fields stay out of users/{uid}.

import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { sanitizeBanking } from "@/services/firebase/doctorProfileFields";
import { DEFAULT_ORG_SLUG } from "@/lib/orgs";

export const DOCTOR_PAYOUT_ACCOUNTS_COLLECTION = "doctorPayoutAccounts";

function maskBanking(banking, revealFull = false) {
  if (!banking || typeof banking !== "object") return null;
  if (revealFull) {
    return {
      accountHolder: banking.accountHolder || "",
      bankName: banking.bankName || "",
      accountType: banking.accountType || "",
      routingNumber: banking.routingNumber || "",
      accountNumber: banking.accountNumber || "",
      accountNumberLast4: banking.accountNumberLast4 || "",
    };
  }
  return {
    accountHolder: banking.accountHolder || "",
    bankName: banking.bankName || "",
    accountType: banking.accountType || "",
    routingNumber: banking.routingNumber
      ? `•••${String(banking.routingNumber).slice(-4)}`
      : "",
    accountNumber: banking.accountNumberLast4
      ? `•••• ${banking.accountNumberLast4}`
      : "",
  };
}

export async function getDoctorPayoutAccount(doctorUid) {
  if (!doctorUid) return null;
  const snap = await adminDb
    .collection(DOCTOR_PAYOUT_ACCOUNTS_COLLECTION)
    .doc(doctorUid)
    .get();
  if (snap.exists) return { doctorUid, ...snap.data() };

  const userSnap = await adminDb.collection("users").doc(doctorUid).get();
  if (!userSnap.exists) return null;
  const data = userSnap.data();
  if (!data.banking && data.appointmentPaymentCents == null) return null;

  return {
    doctorUid,
    orgSlug: data.orgSlug || DEFAULT_ORG_SLUG,
    appointmentPaymentCents:
      typeof data.appointmentPaymentCents === "number"
        ? data.appointmentPaymentCents
        : null,
    banking: data.banking || null,
    _legacy: true,
  };
}

export async function upsertDoctorPayoutAccount(doctorUid, fields = {}) {
  if (!doctorUid) throw new Error("doctorUid is required");

  const { orgSlug, banking, appointmentPaymentCents } = fields;

  const ref = adminDb.collection(DOCTOR_PAYOUT_ACCOUNTS_COLLECTION).doc(doctorUid);
  const snap = await ref.get();
  const now = FieldValue.serverTimestamp();
  const payload = {
    doctorUid,
    updatedAt: now,
    ...(snap.exists ? {} : { createdAt: now }),
  };

  if (orgSlug) payload.orgSlug = orgSlug;
  if (banking && typeof banking === "object") {
    const clean = sanitizeBanking(banking);
    if (!clean) throw new Error("Valid US banking details are required.");
    payload.banking = clean;
  }
  if (Object.prototype.hasOwnProperty.call(fields, "appointmentPaymentCents")) {
    const n = Number(fields.appointmentPaymentCents);
    if (!Number.isInteger(n) || n < 0 || n > 99999999) {
      throw new Error("Visit payment must be a whole number of cents (0 or higher).");
    }
    payload.appointmentPaymentCents = n;
  }

  await ref.set(payload, { merge: true });

  const userUpdates = { updatedAt: now };
  if (payload.appointmentPaymentCents != null) {
    userUpdates.appointmentPaymentCents = payload.appointmentPaymentCents;
  }
  await adminDb.collection("users").doc(doctorUid).update(userUpdates);

  if (payload.banking) {
    await adminDb.collection("users").doc(doctorUid).update({
      banking: FieldValue.delete(),
    });
  }

  return payload;
}

export async function getDoctorVisitPaymentCents(doctorUid) {
  const acct = await getDoctorPayoutAccount(doctorUid);
  if (acct && typeof acct.appointmentPaymentCents === "number") {
    return acct.appointmentPaymentCents;
  }
  return null;
}

export async function getDoctorBankingForAdmin(doctorUid, revealFull = false) {
  const acct = await getDoctorPayoutAccount(doctorUid);
  return maskBanking(acct?.banking, revealFull);
}

export async function migrateLegacyDoctorPayoutAccount(uid, userData) {
  const banking = userData.banking;
  const rate = userData.appointmentPaymentCents;
  if (!banking && rate == null) {
    return { migrated: false, reason: "no_payout_data" };
  }

  await upsertDoctorPayoutAccount(uid, {
    orgSlug: userData.orgSlug,
    ...(banking ? { banking } : {}),
    ...(rate != null ? { appointmentPaymentCents: rate } : {}),
  });
  return { migrated: true };
}
