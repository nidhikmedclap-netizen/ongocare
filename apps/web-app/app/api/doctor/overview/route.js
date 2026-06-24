// app/api/doctor/overview/route.js
//
// Stats for the doctor's landing dashboard. Returns assigned patients,
// upcoming appointments, pending notes, and visit earnings from completed
// appointments (fixed amount per completed visit).

import { adminDb } from "@/lib/firebase/admin";
import { getDoctorVisitPaymentCents } from "@/services/firebase/doctorPayoutAccounts";
import { isVisibleToDoctor } from "@/lib/billing/patientPayment";
import {
  appointmentInstantMs,
  isoDateInTimezone,
} from "@/lib/time/timezone";
import { ok, withAuth } from "@/lib/api";
import { enrichAppointmentRows, loadDisplayNamesByUid } from "@/services/firebase/nameSync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withAuth({ role: "doctor", activeDoctor: true }, async (_request, _ctx, { user }) => {
  const doctorUid = user.uid;
  const nowMs = Date.now();

  const [assignedSnap, apptSnap] = await Promise.all([
    adminDb
      .collection("users")
      .where("role", "==", "patient")
      .where("onboarding.doctorUid", "==", doctorUid)
      .get(),
    adminDb
      .collection("appointments")
      .where("doctorUid", "==", doctorUid)
      .get(),
  ]);

  const appointmentPaymentCents = await getDoctorVisitPaymentCents(doctorUid);

  const assignedPatientsCount = assignedSnap.docs.filter((doc) =>
    isVisibleToDoctor(doc.data()),
  ).length;

  // --- Visit earnings from completed appointments ---
  let totalEarningsCents = 0;
  const earnedVisits = [];
  for (const doc of apptSnap.docs) {
    const a = doc.data();
    const cents =
      typeof a.doctorPaymentCents === "number" ? a.doctorPaymentCents : 0;
    if (cents <= 0) continue;
    totalEarningsCents += cents;
    const paidAtMs =
      typeof a.doctorPaymentAt?.toMillis === "function"
        ? a.doctorPaymentAt.toMillis()
        : typeof a.updatedAt?.toMillis === "function"
          ? a.updatedAt.toMillis()
          : null;
    earnedVisits.push({
      appointmentId: doc.id,
      patientUid: a.patientUid || "",
      patientName: a.patientName || "Patient",
      amountCents: cents,
      currency: "usd",
      paidAtMs,
      type: a.type || "",
    });
  }
  earnedVisits.sort((a, b) => (b.paidAtMs || 0) - (a.paidAtMs || 0));
  const recentPayments = earnedVisits.slice(0, 5);

  // --- Appointment buckets ---
  let upcomingCount = 0;
  let todayCount = 0;
  let pendingNotesCount = 0;
  const upcomingList = [];

  for (const doc of apptSnap.docs) {
    const a = doc.data();
    const id = doc.id;
    const doctorTimezone = a.doctorTimezone || "America/New_York";
    const dateTimeMs = appointmentInstantMs(a.date, a.time, doctorTimezone);
    if (a.status === "scheduled") {
      if (dateTimeMs && dateTimeMs > nowMs) {
        upcomingCount++;
        upcomingList.push({
          id,
          date: a.date,
          time: a.time,
          doctorTimezone,
          patientUid: a.patientUid || "",
          patientName: a.patientName || "",
          type: a.type || "",
          dateTimeMs,
        });
      }
      if (a.date === isoDateInTimezone(nowMs, doctorTimezone)) todayCount++;
    } else if (a.status === "completed" && !(a.notes || "").trim()) {
      pendingNotesCount++;
    }
  }

  upcomingList.sort((a, b) => (a.dateTimeMs || 0) - (b.dateTimeMs || 0));
  const upcomingSlice = upcomingList.slice(0, 5);
  const patientNames = await loadDisplayNamesByUid(
    upcomingSlice.map((a) => a.patientUid),
  );
  const upcoming = enrichAppointmentRows(upcomingSlice, { patientNames }).map(
    ({ patientUid: _uid, ...rest }) => rest,
  );

  return ok({
    assignedPatientsCount,
    upcomingCount,
    todayCount,
    pendingNotesCount,
    upcoming,
    recentPayments,
    appointmentPaymentCents,
    earningsCents: totalEarningsCents,
  });
});
