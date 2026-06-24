// services/firebase/appointments.js
//
// Read/write helpers for the `appointments` collection. Schema:
//
//   appointments/{id}
//   ├── patientUid          string
//   ├── patientName         string  — denormalized for the doctor's table
//   ├── patientEmail        string
//   ├── doctorUid           string
//   ├── doctorName          string  — denormalized for the patient's table
//   ├── type                string  — "Initial consultation" | "Follow-up"
//   ├── date                string  — YYYY-MM-DD in the doctor's timezone
//   ├── time                string  — HH:mm 24h
//   ├── durationMinutes     number
//   ├── status              string  — "scheduled" | "completed" | "cancelled"
//   ├── notes               string  — doctor's session notes
//   ├── prescriptionIssued  boolean — doctor chose to prescribe this visit
//   ├── prescriptionType    string  — "injection" | "tablet"
//   ├── prescriptionMedicationId string
//   ├── prescriptionStrengthId   string
//   ├── prescriptionText    string  — rendered prescription document
//   ├── prescriptionSignatureURL string — snapshot of doctor signature at issue time
//   ├── cancelRemark        string  — reason shown to patient when cancelled
//   ├── doctorPaymentCents  number  — fixed fee earned when visit is completed
//   ├── doctorPaymentAt     timestamp
//   ├── createdAt           timestamp
//   └── updatedAt           timestamp

import { sanitizeSignatureUrl, resolveDoctorSignatureUrl } from "@/lib/doctor/signatureUrl";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import {
  CONSULTATION_TYPES,
  isValidConsultationType,
  normalizeConsultationType,
} from "@/lib/appointments/consultationTypes";
import { enrichAppointments } from "@/services/firebase/nameSync";
import { applyDoctorAppointmentPayment } from "@/services/firebase/doctorEarnings";
import {
  isVisibleToDoctor,
  mergePaymentIntoOnboarding,
} from "@/lib/billing/patientPayment";

const COLLECTION = "appointments";

const VALID_STATUS = new Set(["scheduled", "completed", "cancelled"]);

/** @deprecated use CONSULTATION_TYPES from lib/appointments/consultationTypes */
export const APPOINTMENT_TYPES = CONSULTATION_TYPES;

function nowTs() {
  return FieldValue.serverTimestamp();
}

function buildAppointmentData(input) {
  const data = {
    orgSlug: typeof input.orgSlug === "string" ? input.orgSlug : "",
    patientUid: String(input.patientUid || ""),
    patientName: String(input.patientName || ""),
    patientEmail: String(input.patientEmail || ""),
    doctorUid: String(input.doctorUid || ""),
    doctorName: String(input.doctorName || ""),
    type: normalizeConsultationType(input.type),
    date: String(input.date || ""),
    time: String(input.time || ""),
    // Wall time above is in the doctor's timezone — record it here so
    // patient/admin UIs in other timezones can convert without an extra round-trip.
    doctorTimezone:
      typeof input.doctorTimezone === "string" && input.doctorTimezone
        ? input.doctorTimezone
        : "America/New_York",
    durationMinutes: Number(input.durationMinutes) || 30,
    status: VALID_STATUS.has(input.status) ? input.status : "scheduled",
    notes: typeof input.notes === "string" ? input.notes : "",
    createdAt: nowTs(),
    updatedAt: nowTs(),
  };
  if (!data.patientUid || !data.doctorUid || !data.date || !data.time) {
    throw new Error("appointment is missing required fields");
  }
  return data;
}

function slotLockId(doctorUid, date, time) {
  return `${doctorUid}_${date}_${time.replace(":", "")}`;
}

export async function createAppointment(input) {
  const data = buildAppointmentData(input);
  const ref = await adminDb.collection(COLLECTION).add(data);
  return { id: ref.id, ...data };
}

/**
 * Atomically reserve a slot and create the appointment doc. Uses a
 * deterministic lock doc so two concurrent book requests cannot both succeed.
 */
export async function createAppointmentAtomic(input) {
  const data = buildAppointmentData(input);
  const lockId = slotLockId(data.doctorUid, data.date, data.time);
  const lockRef = adminDb.collection("appointmentSlotLocks").doc(lockId);
  const apptRef = adminDb.collection(COLLECTION).doc();

  return adminDb.runTransaction(async (transaction) => {
    const lockSnap = await transaction.get(lockRef);
    if (lockSnap.exists) {
      const err = new Error("That slot was just taken. Please pick another.");
      err.code = "SLOT_TAKEN";
      throw err;
    }

    transaction.set(lockRef, {
      doctorUid: data.doctorUid,
      date: data.date,
      time: data.time,
      patientUid: data.patientUid,
      appointmentId: apptRef.id,
      createdAt: nowTs(),
    });
    transaction.set(apptRef, data);
    return { id: apptRef.id, ...data };
  });
}

export async function updateAppointment(id, fields = {}) {
  const ref = adminDb.collection(COLLECTION).doc(id);

  return adminDb.runTransaction(async (transaction) => {
    const snap = await transaction.get(ref);
    if (!snap.exists) {
      const err = new Error("Appointment not found");
      err.code = "NOT_FOUND";
      throw err;
    }

    const existing = projectAppointment(snap.id, snap.data());

    if (existing.status === "completed" || existing.status === "cancelled") {
      const err = new Error("This appointment can no longer be edited.");
      err.code = "APPOINTMENT_LOCKED";
      throw err;
    }

    const updates = { updatedAt: nowTs() };
    if (typeof fields.notes === "string") updates.notes = fields.notes;
    if (VALID_STATUS.has(fields.status)) {
      if (fields.status === "cancelled" && existing.status === "completed") {
        const err = new Error("Completed appointments cannot be cancelled");
        err.code = "APPOINTMENT_STATUS_LOCKED";
        throw err;
      }
      if (fields.status === "completed" && existing.status === "cancelled") {
        const err = new Error("Cancelled appointments cannot be marked completed");
        err.code = "APPOINTMENT_STATUS_LOCKED";
        throw err;
      }
      updates.status = fields.status;
      if (fields.status === "cancelled") {
        const remark =
          typeof fields.cancelRemark === "string" ? fields.cancelRemark.trim() : "";
        if (!remark) {
          const err = new Error("Cancellation reason is required");
          err.code = "CANCEL_REMARK_REQUIRED";
          throw err;
        }
        updates.cancelRemark = remark.slice(0, 500);
      }
    }
    if (typeof fields.type === "string") {
      const nextType = normalizeConsultationType(fields.type);
      if (isValidConsultationType(nextType)) {
        updates.type = nextType;
      }
    }
    if (fields.prescription && typeof fields.prescription === "object") {
      const issued = !!fields.prescription.issued;
      updates.prescriptionIssued = issued;
      if (issued) {
        const rxType = fields.prescription.type;
        updates.prescriptionType =
          rxType === "tablet" || rxType === "injection" ? rxType : "injection";
        updates.prescriptionMedicationId = String(
          fields.prescription.medicationId || "",
        );
        updates.prescriptionStrengthId = String(
          fields.prescription.strengthId || "",
        );
        const text =
          typeof fields.prescription.text === "string"
            ? fields.prescription.text.trim().slice(0, 8000)
            : "";
        if (!text) {
          const err = new Error("Prescription text is required");
          err.code = "PRESCRIPTION_TEXT_REQUIRED";
          throw err;
        }
        updates.prescriptionText = text;
        let signatureURL = sanitizeSignatureUrl(
          fields.prescription.signatureURL,
        );
        if (!signatureURL && existing.doctorUid) {
          const doctorSnap = await transaction.get(
            adminDb.collection("users").doc(existing.doctorUid),
          );
          if (doctorSnap.exists) {
            signatureURL = sanitizeSignatureUrl(
              resolveDoctorSignatureUrl(doctorSnap.data()),
            );
          }
        }
        updates.prescriptionSignatureURL = signatureURL;
      } else {
        updates.prescriptionType = "";
        updates.prescriptionMedicationId = "";
        updates.prescriptionStrengthId = "";
        updates.prescriptionText = "";
        updates.prescriptionSignatureURL = "";
      }
    }

    if (fields.status === "completed" && existing.status !== "completed") {
      const payment = await applyDoctorAppointmentPayment(transaction, existing);
      if (payment.paymentCents > 0) {
        updates.doctorPaymentCents = payment.paymentCents;
        updates.doctorPaymentAt = FieldValue.serverTimestamp();
      }
    }

    transaction.update(ref, updates);
  });
}

export async function getAppointment(id) {
  const snap = await adminDb.collection(COLLECTION).doc(id).get();
  if (!snap.exists) return null;
  return projectAppointment(snap.id, snap.data());
}

/**
 * Admin-only. Single appointment with enriched names and signature backfill.
 */
export async function adminGetAppointmentDetail(id, actingOrgSlug) {
  const appt = await getAppointment(id);
  if (!appt) return null;
  if (actingOrgSlug && appt.orgSlug && appt.orgSlug !== actingOrgSlug) {
    throw new Error("Appointment belongs to a different portal");
  }
  const [enriched] = await enrichAppointments([appt]);
  return enriched || appt;
}

export async function listAppointmentsForDoctor(doctorUid) {
  await backfillAppointmentsFromPatientOnboarding(doctorUid);
  const snap = await adminDb
    .collection(COLLECTION)
    .where("doctorUid", "==", doctorUid)
    .get();
  const rows = snap.docs
    .map((d) => projectAppointment(d.id, d.data()))
    .sort(compareByDateTimeDesc);
  return enrichAppointments(rows);
}

/**
 * Patients who completed checkout sometimes only have slot data on their
 * user doc (booking ran before payment was persisted). Materialize missing
 * appointment rows so doctor dashboards stay in sync.
 */
async function backfillAppointmentsFromPatientOnboarding(doctorUid) {
  const [patientsSnap, apptSnap, doctorSnap] = await Promise.all([
    adminDb
      .collection("users")
      .where("role", "==", "patient")
      .where("onboarding.doctorUid", "==", doctorUid)
      .get(),
    adminDb.collection(COLLECTION).where("doctorUid", "==", doctorUid).get(),
    adminDb.collection("users").doc(doctorUid).get(),
  ]);

  const patientsWithAppt = new Set(
    apptSnap.docs.map((d) => d.data().patientUid).filter(Boolean),
  );
  const doctorName = doctorSnap.exists
    ? [doctorSnap.data().firstName, doctorSnap.data().lastName]
        .filter(Boolean)
        .join(" ") || doctorSnap.data().email || "Doctor"
    : "Doctor";

  for (const doc of patientsSnap.docs) {
    if (patientsWithAppt.has(doc.id)) continue;
    const data = doc.data();
    if (!isVisibleToDoctor(data)) continue;

    const onb = mergePaymentIntoOnboarding(data);
    const { date, time } = parseOnboardingSlot(onb);
    if (!date || !time) continue;

    const patientName =
      [data.firstName, data.lastName].filter(Boolean).join(" ") ||
      data.email ||
      "Patient";

    try {
      await createAppointmentAtomic({
        orgSlug: data.orgSlug || onb.orgSlug || "",
        patientUid: doc.id,
        patientName,
        patientEmail: data.email || "",
        doctorUid,
        doctorName: onb.doctor || doctorName,
        doctorTimezone: onb.doctorTimezone || "America/New_York",
        type: "Initial consultation",
        date,
        time,
        durationMinutes: 30,
        status: "scheduled",
      });
      patientsWithAppt.add(doc.id);
    } catch (err) {
      if (err?.code !== "SLOT_TAKEN") {
        // eslint-disable-next-line no-console
        console.warn("[appointments] backfill skipped:", doc.id, err?.message);
      }
    }
  }
}

function parseOnboardingSlot(onb) {
  let date = String(onb?.slotDate || "").trim();
  let time = String(onb?.slotTime || "").trim();
  if (!date && !time && typeof onb?.slot === "string" && onb.slot.includes("|")) {
    [date, time] = onb.slot.split("|").map((s) => s.trim());
  }
  return { date, time };
}

export async function listAppointmentsForPatient(patientUid) {
  const snap = await adminDb
    .collection(COLLECTION)
    .where("patientUid", "==", patientUid)
    .get();
  const rows = snap.docs
    .map((d) => projectAppointment(d.id, d.data()))
    .sort(compareByDateTimeDesc);
  return enrichAppointments(rows);
}

/**
 * Returns Set of "<date>|<time>" keys for slots that are already booked
 * with the given doctor, so the slot generator can exclude them.
 *
 * Optional `fromDate` / `toDate` (YYYY-MM-DD) narrow the query to the
 * booking window — defaults to today through +21 days when omitted.
 */
export async function bookedSlotKeysForDoctor(
  doctorUid,
  { fromDate, toDate } = {},
) {
  const today = new Date();
  const defaultFrom = dateKeyFromDate(today);
  const end = new Date(today);
  end.setDate(end.getDate() + 21);
  const defaultTo = dateKeyFromDate(end);

  const rangeFrom = fromDate || defaultFrom;
  const rangeTo = toDate || defaultTo;

  try {
    const snap = await adminDb
      .collection(COLLECTION)
      .where("doctorUid", "==", doctorUid)
      .where("status", "==", "scheduled")
      .where("date", ">=", rangeFrom)
      .where("date", "<=", rangeTo)
      .get();
    const out = new Set();
    for (const d of snap.docs) {
      const data = d.data();
      if (data.date && data.time) out.add(`${data.date}|${data.time}`);
    }
    return out;
  } catch {
    // Composite index may not be deployed yet — fall back to the prior query.
    const snap = await adminDb
      .collection(COLLECTION)
      .where("doctorUid", "==", doctorUid)
      .where("status", "in", ["scheduled", "completed"])
      .get();
    const out = new Set();
    for (const d of snap.docs) {
      const data = d.data();
      if (data.date && data.time) out.add(`${data.date}|${data.time}`);
    }
    return out;
  }
}

function dateKeyFromDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Admin-only. Lists every appointment across the platform. Sorted with
 * the most recent first.
 *
 * `orgSlug` scopes to one portal. Null/undefined ⇒ all portals (super-
 * admin view only).
 */
export async function listAllAppointmentsForAdmin(orgSlug) {
  let q = adminDb.collection(COLLECTION);
  if (orgSlug) q = q.where("orgSlug", "==", orgSlug);
  const snap = await q.get();
  const rows = snap.docs
    .map((d) => projectAppointment(d.id, d.data()))
    .sort(compareByDateTimeDesc);
  return enrichAppointments(rows);
}

/**
 * Admin-only. Hard-deletes an appointment doc.
 *
 * `actingOrgSlug` enforces tenant isolation — per-portal admins can only
 * delete appointments in their own portal.
 */
export async function adminDeleteAppointment(id, actingOrgSlug) {
  if (actingOrgSlug) {
    const snap = await adminDb.collection(COLLECTION).doc(id).get();
    if (!snap.exists) return;
    if (snap.data().orgSlug !== actingOrgSlug) {
      throw new Error("Appointment belongs to a different portal");
    }
  }
  await adminDb.collection(COLLECTION).doc(id).delete();
}

async function aggregateCount(q) {
  const snap = await q.count().get();
  return snap.data().count;
}

/**
 * Admin overview helper. Returns rolling counts for the last 30 days
 * (booked appointments per day) and a revenue tally derived from how
 * many appointments we have in each state.
 *
 * `orgSlug` scopes to one portal. Null/undefined ⇒ all portals (super-
 * admin view only).
 */
export async function appointmentStatsForAdmin(orgSlug) {
  const base = adminDb.collection(COLLECTION);
  const withOrg = (q) => (orgSlug ? q.where("orgSlug", "==", orgSlug) : q);

  const [total, scheduled, completed, cancelled] = await Promise.all([
    aggregateCount(withOrg(base)),
    aggregateCount(withOrg(base.where("status", "==", "scheduled"))),
    aggregateCount(withOrg(base.where("status", "==", "completed"))),
    aggregateCount(withOrg(base.where("status", "==", "cancelled"))),
  ]);

  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const bookedByDay = {};
  const recentSnap = await base
    .where("createdAt", ">=", Timestamp.fromMillis(thirtyDaysAgo))
    .get();
  for (const d of recentSnap.docs) {
    const data = d.data();
    if (orgSlug && data.orgSlug !== orgSlug) continue;
    const createdMs =
      typeof data.createdAt?.toMillis === "function"
        ? data.createdAt.toMillis()
        : null;
    if (createdMs) {
      const day = new Date(createdMs).toISOString().slice(0, 10);
      bookedByDay[day] = (bookedByDay[day] || 0) + 1;
    }
  }

  return {
    total,
    scheduled,
    completed,
    cancelled,
    bookedByDay,
  };
}

function projectAppointment(id, data) {
  return {
    id,
    orgSlug: data.orgSlug || null,
    patientUid: data.patientUid || "",
    patientName: data.patientName || "",
    patientEmail: data.patientEmail || "",
    doctorUid: data.doctorUid || "",
    doctorName: data.doctorName || "",
    type: normalizeConsultationType(data.type),
    date: data.date || "",
    time: data.time || "",
    doctorTimezone: data.doctorTimezone || "America/New_York",
    durationMinutes: data.durationMinutes || 30,
    status: data.status || "scheduled",
    notes: data.notes || "",
    prescriptionIssued: !!data.prescriptionIssued,
    prescriptionType: data.prescriptionType || "",
    prescriptionMedicationId: data.prescriptionMedicationId || "",
    prescriptionStrengthId: data.prescriptionStrengthId || "",
    prescriptionText: data.prescriptionText || "",
    prescriptionSignatureURL: data.prescriptionSignatureURL || "",
    cancelRemark: data.cancelRemark || "",
    doctorPaymentCents:
      typeof data.doctorPaymentCents === "number" ? data.doctorPaymentCents : 0,
    doctorPaymentAtMs:
      typeof data.doctorPaymentAt?.toMillis === "function"
        ? data.doctorPaymentAt.toMillis()
        : null,
    createdAtMs:
      typeof data.createdAt?.toMillis === "function"
        ? data.createdAt.toMillis()
        : null,
    updatedAtMs:
      typeof data.updatedAt?.toMillis === "function"
        ? data.updatedAt.toMillis()
        : null,
  };
}

function compareByDateTimeDesc(a, b) {
  const aKey = `${a.date}T${a.time}`;
  const bKey = `${b.date}T${b.time}`;
  return bKey.localeCompare(aKey);
}
