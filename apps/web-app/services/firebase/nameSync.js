// services/firebase/nameSync.js
//
// Keep denormalized patient/doctor names in sync when profiles are edited,
// and resolve live display names when listing appointments.

import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import {
  resolveDoctorSignatureUrl,
  sanitizeSignatureUrl,
} from "@/lib/doctor/signatureUrl";

const USERS = "users";
const APPOINTMENTS = "appointments";
const BATCH_SIZE = 400;

export function fullNameFromUserData(data, fallback = "") {
  if (!data || typeof data !== "object") return fallback;
  return (
    [data.firstName, data.lastName].filter(Boolean).join(" ") ||
    data.email ||
    fallback
  );
}

async function commitBatches(writes) {
  if (!writes.length) return;
  for (let i = 0; i < writes.length; i += BATCH_SIZE) {
    const batch = adminDb.batch();
    for (const { ref, data } of writes.slice(i, i + BATCH_SIZE)) {
      batch.update(ref, data);
    }
    await batch.commit();
  }
}

/** Batch-load display names for a set of user ids. */
export async function loadDisplayNamesByUid(uids) {
  const unique = [...new Set((uids || []).filter(Boolean))];
  const map = new Map();
  if (!unique.length) return map;

  const refs = unique.map((id) => adminDb.collection(USERS).doc(id));
  const snaps = await adminDb.getAll(...refs);
  for (const snap of snaps) {
    if (!snap.exists) continue;
    map.set(snap.id, fullNameFromUserData(snap.data(), snap.id));
  }
  return map;
}

/** Prefer live profile names; fall back to denormalized appointment fields. */
export function enrichAppointmentRows(rows, { patientNames, doctorNames }) {
  return rows.map((row) => ({
    ...row,
    patientName:
      (row.patientUid && patientNames?.get(row.patientUid)) ||
      row.patientName ||
      "",
    doctorName:
      (row.doctorUid && doctorNames?.get(row.doctorUid)) ||
      row.doctorName ||
      "",
  }));
}

/** Batch-load doctor signature URLs for prescription display backfill. */
async function loadDoctorSignatureUrlsByUid(uids) {
  const unique = [...new Set((uids || []).filter(Boolean))];
  const map = new Map();
  if (!unique.length) return map;

  const refs = unique.map((id) => adminDb.collection(USERS).doc(id));
  const snaps = await adminDb.getAll(...refs);
  for (const snap of snaps) {
    if (!snap.exists) continue;
    const url = sanitizeSignatureUrl(resolveDoctorSignatureUrl(snap.data()));
    if (url) map.set(snap.id, url);
  }
  return map;
}

export async function enrichAppointments(rows) {
  if (!rows?.length) return rows || [];
  const patientNames = await loadDisplayNamesByUid(rows.map((r) => r.patientUid));
  const doctorNames = await loadDisplayNamesByUid(rows.map((r) => r.doctorUid));
  const enriched = enrichAppointmentRows(rows, { patientNames, doctorNames });

  const sigDoctorUids = enriched
    .filter(
      (r) =>
        r.prescriptionIssued &&
        r.prescriptionText?.trim() &&
        !r.prescriptionSignatureURL,
    )
    .map((r) => r.doctorUid);
  const sigMap = await loadDoctorSignatureUrlsByUid(sigDoctorUids);

  return enriched.map((row) => {
    if (row.prescriptionSignatureURL) return row;
    if (!row.prescriptionIssued || !row.prescriptionText?.trim()) return row;
    const sig = sigMap.get(row.doctorUid);
    return sig ? { ...row, prescriptionSignatureURL: sig } : row;
  });
}

/** After admin edits a patient name, update appointments + onboarding mirror. */
export async function cascadePatientName(uid, { firstName, lastName, email }) {
  const fullName = fullNameFromUserData(
    { firstName, lastName, email },
    "Patient",
  );

  const apptSnap = await adminDb
    .collection(APPOINTMENTS)
    .where("patientUid", "==", uid)
    .get();

  const apptWrites = apptSnap.docs.map((doc) => ({
    ref: doc.ref,
    data: {
      patientName: fullName,
      ...(email ? { patientEmail: email } : {}),
      updatedAt: FieldValue.serverTimestamp(),
    },
  }));
  await commitBatches(apptWrites);

  const onboardingUpdates = { updatedAt: FieldValue.serverTimestamp() };
  if (typeof firstName === "string") {
    onboardingUpdates["onboarding.firstName"] = firstName.trim();
  }
  if (typeof lastName === "string") {
    onboardingUpdates["onboarding.lastName"] = lastName.trim();
  }
  if (Object.keys(onboardingUpdates).length > 1) {
    await adminDb.collection(USERS).doc(uid).update(onboardingUpdates);
  }
}

/** After admin edits a doctor name, update appointments + assigned patients. */
export async function cascadeDoctorName(uid, fullName) {
  const trimmed = String(fullName || "").trim();
  if (!trimmed) return;

  const apptSnap = await adminDb
    .collection(APPOINTMENTS)
    .where("doctorUid", "==", uid)
    .get();
  const apptWrites = apptSnap.docs.map((doc) => ({
    ref: doc.ref,
    data: {
      doctorName: trimmed,
      updatedAt: FieldValue.serverTimestamp(),
    },
  }));
  await commitBatches(apptWrites);

  const patientSnap = await adminDb
    .collection(USERS)
    .where("role", "==", "patient")
    .where("onboarding.doctorUid", "==", uid)
    .get();
  const patientWrites = patientSnap.docs.map((doc) => ({
    ref: doc.ref,
    data: {
      "onboarding.doctor": trimmed,
      updatedAt: FieldValue.serverTimestamp(),
    },
  }));
  await commitBatches(patientWrites);
}

/** Resolve assigned clinician label from live doctor profile when possible. */
export async function resolveOnboardingDoctorLabel(onboarding = {}) {
  const doctorUid =
    typeof onboarding.doctorUid === "string" ? onboarding.doctorUid.trim() : "";
  if (!doctorUid) return onboarding;
  const snap = await adminDb.collection(USERS).doc(doctorUid).get();
  if (!snap.exists) return onboarding;
  const liveName = fullNameFromUserData(snap.data(), onboarding.doctor || "");
  if (!liveName || liveName === onboarding.doctor) return onboarding;
  return { ...onboarding, doctor: liveName };
}
