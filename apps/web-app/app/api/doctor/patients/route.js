// app/api/doctor/patients/route.js
//
// List of patients assigned to the signed-in doctor. A patient is "assigned"
// when their onboarding.doctorUid points at this doctor (set during the
// onboarding flow's doctor-picker screen).
//
// Returns a summary row per patient — enough to render the list view; the
// detail endpoint expands one patient at a time.

import { adminDb } from "@/lib/firebase/admin";
import {
  isPaymentCaptured,
  isVisibleToDoctor,
  mergePaymentIntoOnboarding,
  paymentStatusLabel,
  resolvePaymentStatus,
} from "@/lib/billing/patientPayment";
import { appointmentInstantMs } from "@/lib/time/timezone";
import { ok, withAuth } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function computeAge(dob) {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age;
}

function computeBmi(onb) {
  if (!onb) return null;
  if (onb.bmiUnit === "metric") {
    const cm = parseFloat(onb.heightCm) || 0;
    const kg = parseFloat(onb.weightKg) || 0;
    if (cm <= 0 || kg <= 0) return null;
    const m = cm / 100;
    return kg / (m * m);
  }
  const feet = parseFloat(onb.heightFt) || 0;
  const inches = parseFloat(onb.heightIn) || 0;
  const pounds = parseFloat(onb.weightLbs) || 0;
  if (feet <= 0 || pounds <= 0) return null;
  const total = feet * 12 + inches;
  if (total <= 0) return null;
  return (pounds * 703) / (total * total);
}

export const GET = withAuth({ role: "doctor", activeDoctor: true }, async (_request, _ctx, { user }) => {
  const snap = await adminDb
    .collection("users")
    .where("role", "==", "patient")
    .where("onboarding.doctorUid", "==", user.uid)
    .get();

  // Fetch this doctor's appointments once so we can match next/last per patient.
  const apptSnap = await adminDb
    .collection("appointments")
    .where("doctorUid", "==", user.uid)
    .get();

  const apptsByPatient = new Map();
  for (const d of apptSnap.docs) {
    const a = d.data();
    const arr = apptsByPatient.get(a.patientUid) || [];
    arr.push({ id: d.id, ...a });
    apptsByPatient.set(a.patientUid, arr);
  }

  const nowMs = Date.now();
  const patients = snap.docs
    .filter((doc) => isVisibleToDoctor(doc.data()))
    .map((doc) => {
    const data = doc.data();
    const onb = mergePaymentIntoOnboarding(data);
    const bmi = computeBmi(onb);
    const age = computeAge(data.dob);

    const myAppts = apptsByPatient.get(doc.id) || [];
    let nextAppt = null;
    let lastAppt = null;
    for (const a of myAppts) {
      const ms = appointmentInstantMs(a.date, a.time, a.doctorTimezone);
      if (!ms) continue;
      if (a.status === "scheduled" && ms >= nowMs) {
        if (!nextAppt || ms < nextAppt._ms) nextAppt = { ...a, _ms: ms };
      }
      if (a.status === "completed" || ms < nowMs) {
        if (!lastAppt || ms > lastAppt._ms) lastAppt = { ...a, _ms: ms };
      }
    }
    if (nextAppt) delete nextAppt._ms;
    if (lastAppt) delete lastAppt._ms;

    return {
      uid: doc.id,
      firstName: data.firstName || "",
      lastName: data.lastName || "",
      fullName:
        [data.firstName, data.lastName].filter(Boolean).join(" ") ||
        data.email ||
        "Patient",
      email: data.email || "",
      phone: data.phone || "",
      age,
      sex: onb.sexAtBirth || "",
      bmi: bmi != null ? Number(bmi.toFixed(1)) : null,
      currentWeightLbs: Number(onb.weightLbs) || null,
      goalWeightLbs: Number(onb.wtGoal) || null,
      plan: onb.plan || "",
      paid: isPaymentCaptured(onb),
      paymentStatus: resolvePaymentStatus(onb),
      paymentStatusLabel: paymentStatusLabel(onb),
      paymentAmount:
        typeof onb.paymentAmount === "number" ? onb.paymentAmount : null,
      paymentCurrency: onb.paymentCurrency || "usd",
      status: data.status || "incomplete",
      createdAtMs:
        typeof data.createdAt?.toMillis === "function"
          ? data.createdAt.toMillis()
          : null,
      nextAppointment: nextAppt
        ? {
            id: nextAppt.id,
            date: nextAppt.date,
            time: nextAppt.time,
            type: nextAppt.type,
          }
        : null,
      lastAppointment: lastAppt
        ? {
            id: lastAppt.id,
            date: lastAppt.date,
            time: lastAppt.time,
            type: lastAppt.type,
          }
        : null,
      totalAppointments: myAppts.length,
    };
  });

  patients.sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));

  return ok({ patients });
});
