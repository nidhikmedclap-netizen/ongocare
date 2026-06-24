// services/firebase/doctorEarnings.js
//
// Fixed per-appointment doctor payments. Superadmin sets the rate; each
// appointment marked completed earns that amount once.

import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { DOCTOR_PAYOUT_ACCOUNTS_COLLECTION } from "@/services/firebase/doctorPayoutAccounts";

const EARNINGS_COLLECTION = "doctorPatientEarnings";

async function readVisitPaymentCentsInTransaction(transaction, doctorUid) {
  const payoutRef = adminDb
    .collection(DOCTOR_PAYOUT_ACCOUNTS_COLLECTION)
    .doc(doctorUid);
  const payoutSnap = await transaction.get(payoutRef);
  if (payoutSnap.exists) {
    const cents = payoutSnap.data().appointmentPaymentCents;
    if (typeof cents === "number") return cents;
  }
  const doctorRef = adminDb.collection("users").doc(doctorUid);
  const doctorSnap = await transaction.get(doctorRef);
  if (!doctorSnap.exists) return null;
  const legacy = doctorSnap.data().appointmentPaymentCents;
  return typeof legacy === "number" ? legacy : null;
}

/**
 * Within a transaction: if a visit rate is set, stamp payment on this
 * completed appointment (one payment per appointment, not per patient).
 */
export async function applyDoctorAppointmentPayment(transaction, appointment) {
  if (
    typeof appointment.doctorPaymentCents === "number" &&
    appointment.doctorPaymentCents > 0
  ) {
    return { paymentCents: 0, skipped: true, reason: "already_paid" };
  }

  const paymentCents = await readVisitPaymentCentsInTransaction(
    transaction,
    appointment.doctorUid,
  );
  if (typeof paymentCents !== "number" || paymentCents <= 0) {
    return { paymentCents: 0, skipped: true };
  }

  const earningsRef = adminDb
    .collection(EARNINGS_COLLECTION)
    .doc(appointment.id);
  const earningsSnap = await transaction.get(earningsRef);
  if (earningsSnap.exists) {
    const amount = earningsSnap.data().amountCents;
    return {
      paymentCents: typeof amount === "number" ? amount : paymentCents,
      skipped: true,
      reason: "already_paid",
    };
  }

  transaction.set(earningsRef, {
    doctorUid: appointment.doctorUid,
    patientUid: appointment.patientUid,
    appointmentId: appointment.id,
    amountCents: paymentCents,
    paidAt: FieldValue.serverTimestamp(),
  });

  return { paymentCents, skipped: false };
}
