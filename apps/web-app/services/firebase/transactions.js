// services/firebase/transactions.js
//
// Admin/doctor transaction reports. Plan payments read from planPayments
// collection; visit earnings from completed appointments.

import { adminDb } from "@/lib/firebase/admin";
import { toPaidAtMs } from "@/lib/billing/money";
import { listPlanPayments as listPlanPaymentsFromCollection } from "@/services/firebase/planPayments";
import { getDoctorVisitPaymentCents } from "@/services/firebase/doctorPayoutAccounts";
import { doctorBelongsToPortal } from "@/lib/orgs/doctorPortals";
import { DEFAULT_ORG_SLUG } from "@/services/firebase/users";

const USERS_COLLECTION = "users";
const APPOINTMENTS_COLLECTION = "appointments";

function doctorFullName(data) {
  return (
    [data.firstName, data.lastName].filter(Boolean).join(" ") ||
    data.email ||
    "Doctor"
  );
}

function projectAppointmentEarning(id, data) {
  const cents =
    typeof data.doctorPaymentCents === "number" ? data.doctorPaymentCents : 0;
  if (cents <= 0) return null;

  return {
    id,
    appointmentId: id,
    patientUid: data.patientUid || "",
    patientName: data.patientName || "Patient",
    patientEmail: data.patientEmail || "",
    doctorUid: data.doctorUid || "",
    doctorName: data.doctorName || "",
    orgSlug: data.orgSlug || DEFAULT_ORG_SLUG,
    type: data.type || "Consultation",
    amountCents: cents,
    currency: "usd",
    paidAtMs:
      typeof data.doctorPaymentAt?.toMillis === "function"
        ? data.doctorPaymentAt.toMillis()
        : typeof data.updatedAt?.toMillis === "function"
          ? data.updatedAt.toMillis()
          : null,
    visitDate: data.date || "",
    visitTime: data.time || "",
  };
}

async function listAppointmentEarnings({ orgSlug, doctorUid } = {}) {
  let q = adminDb.collection(APPOINTMENTS_COLLECTION);
  // Single-field filters only — avoid composite indexes. Doctor reports
  // query by doctorUid and filter paid visits in memory; admin scans paid visits.
  if (doctorUid) {
    q = q.where("doctorUid", "==", doctorUid);
  } else {
    q = q.where("doctorPaymentCents", ">", 0);
  }
  const snap = await q.get();
  const rows = [];
  for (const doc of snap.docs) {
    const data = doc.data();
    if (orgSlug && data.orgSlug !== orgSlug) continue;
    const row = projectAppointmentEarning(doc.id, data);
    if (row) rows.push(row);
  }
  rows.sort((a, b) => (b.paidAtMs || 0) - (a.paidAtMs || 0));
  return rows;
}

async function loadDoctorsByUid(orgSlug) {
  let q = adminDb.collection(USERS_COLLECTION).where("role", "==", "doctor");
  if (orgSlug) q = q.where("orgSlug", "==", orgSlug);
  const snap = await q.get();
  const map = new Map();
  for (const doc of snap.docs) {
    const data = doc.data();
    if (orgSlug && !doctorBelongsToPortal(data, orgSlug)) continue;
    const rate = await getDoctorVisitPaymentCents(doc.id);
    map.set(doc.id, {
      uid: doc.id,
      fullName: doctorFullName(data),
      orgSlug: data.orgSlug || DEFAULT_ORG_SLUG,
      appointmentPaymentCents: rate,
    });
  }
  return map;
}

function sumAmounts(rows, field) {
  return rows.reduce(
    (sum, r) => sum + (typeof r[field] === "number" ? r[field] : 0),
    0,
  );
}

/**
 * Admin / superadmin ledger for a portal scope (null = all portals).
 */
export async function adminTransactionReport(orgSlug) {
  const planPayments = await listPlanPaymentsFromCollection({ orgSlug });
  const appointmentEarnings = await listAppointmentEarnings({ orgSlug });
  const doctors = await loadDoctorsByUid(orgSlug);

  const enrichedPlans = planPayments.map((p) => ({
    ...p,
    doctorName: doctors.get(p.doctorUid)?.fullName || p.doctorName || "—",
  }));

  const enrichedEarnings = appointmentEarnings.map((p) => ({
    ...p,
    doctorName: doctors.get(p.doctorUid)?.fullName || p.doctorName || "—",
  }));

  const byDoctor = new Map();
  for (const p of enrichedEarnings) {
    if (!p.doctorUid) continue;
    let summary = byDoctor.get(p.doctorUid);
    if (!summary) {
      const doc = doctors.get(p.doctorUid);
      summary = {
        doctorUid: p.doctorUid,
        doctorName: doc?.fullName || p.doctorName || "Doctor",
        orgSlug: doc?.orgSlug || p.orgSlug,
        appointmentPaymentCents: doc?.appointmentPaymentCents ?? null,
        visitCount: 0,
        earningsCents: 0,
      };
      byDoctor.set(p.doctorUid, summary);
    }
    summary.visitCount += 1;
    summary.earningsCents += p.amountCents;
  }

  const doctorSummaries = Array.from(byDoctor.values()).sort(
    (a, b) => b.earningsCents - a.earningsCents,
  );

  const currency = enrichedPlans[0]?.currency || "usd";
  const capturedPlans = enrichedPlans.filter((p) => p.captured);

  return {
    payments: enrichedPlans,
    appointmentEarnings: enrichedEarnings,
    doctorSummaries,
    totals: {
      paymentCount: enrichedPlans.length,
      capturedCount: capturedPlans.length,
      authorizedCount: enrichedPlans.length - capturedPlans.length,
      grossCents: sumAmounts(capturedPlans, "amountCents"),
      appointmentEarningsCents: sumAmounts(enrichedEarnings, "amountCents"),
      currency,
    },
  };
}

/**
 * Doctor ledger — fixed payment per completed visit.
 */
export async function doctorTransactionReport(doctorUid) {
  const appointmentPaymentCents = await getDoctorVisitPaymentCents(doctorUid);
  const payments = await listAppointmentEarnings({ doctorUid });

  const enriched = payments.map((p) => ({
    ...p,
    appointmentPaymentCents,
  }));

  const currency = enriched[0]?.currency || "usd";

  return {
    payments: enriched,
    appointmentPaymentCents,
    totals: {
      paymentCount: enriched.length,
      capturedCount: enriched.length,
      authorizedCount: 0,
      earningsCents: sumAmounts(enriched, "amountCents"),
      currency,
    },
  };
}

// Re-export for callers that imported projectPlanPayment from here.
export { listPlanPaymentsFromCollection as listPlanPayments };
