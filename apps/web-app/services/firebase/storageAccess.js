// services/firebase/storageAccess.js
//
// Server-side authorization for Firebase Storage paths.

import { adminDb } from "@/lib/firebase/admin";
import { isValidStoragePath } from "@/lib/storage/paths";

function parsePath(path) {
  const parts = path.split("/");
  return { kind: parts[0], uid: parts[1] || "" };
}

async function doctorCanAccessPatient(doctorUid, patientUid) {
  const patientSnap = await adminDb.collection("users").doc(patientUid).get();
  if (patientSnap.exists) {
    const onb = patientSnap.data()?.onboarding || {};
    if (onb.doctorUid === doctorUid) return true;
  }
  const snap = await adminDb
    .collection("appointments")
    .where("doctorUid", "==", doctorUid)
    .where("patientUid", "==", patientUid)
    .limit(1)
    .get();
  return !snap.empty;
}

async function adminCanAccessPatient(adminUid, patientUid, actingOrgSlug) {
  const patientSnap = await adminDb.collection("users").doc(patientUid).get();
  if (!patientSnap.exists) return false;
  const patient = patientSnap.data();
  if (patient.role && patient.role !== "patient") return false;

  const adminSnap = await adminDb.collection("users").doc(adminUid).get();
  const admin = adminSnap.data() || {};
  if (admin.role === "superadmin") return true;
  if (admin.role !== "admin") return false;
  if (!actingOrgSlug) return true;
  return patient.orgSlug === actingOrgSlug;
}

/**
 * @param {{ uid: string, role: string, orgSlug?: string|null }} user
 * @param {string} path
 */
export async function assertStoragePathReadable(user, path) {
  if (!isValidStoragePath(path)) {
    const err = new Error("Invalid storage path.");
    err.code = "STORAGE_PATH_INVALID";
    throw err;
  }

  const { kind, uid: ownerUid } = parsePath(path);
  if (!ownerUid) {
    const err = new Error("Invalid storage path.");
    err.code = "STORAGE_PATH_INVALID";
    throw err;
  }

  if (user.uid === ownerUid) return;

  if (kind === "patients") {
    if (user.role === "patient") {
      const err = new Error("Forbidden");
      err.code = "STORAGE_FORBIDDEN";
      throw err;
    }
    if (user.role === "doctor") {
      const ok = await doctorCanAccessPatient(user.uid, ownerUid);
      if (!ok) {
        const err = new Error("Forbidden");
        err.code = "STORAGE_FORBIDDEN";
        throw err;
      }
      return;
    }
    if (user.role === "admin" || user.role === "superadmin") {
      const ok = await adminCanAccessPatient(
        user.uid,
        ownerUid,
        user.role === "superadmin" ? null : user.orgSlug,
      );
      if (!ok) {
        const err = new Error("Forbidden");
        err.code = "STORAGE_FORBIDDEN";
        throw err;
      }
      return;
    }
  }

  if (kind === "doctors") {
    if (user.role === "admin" || user.role === "superadmin") return;
    const err = new Error("Forbidden");
    err.code = "STORAGE_FORBIDDEN";
    throw err;
  }

  const err = new Error("Forbidden");
  err.code = "STORAGE_FORBIDDEN";
  throw err;
}
