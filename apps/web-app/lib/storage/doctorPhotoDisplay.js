// lib/storage/doctorPhotoDisplay.js
//
// Server-side helpers to resolve doctor profile assets for display.

import { getSignedStorageUrl } from "@/lib/firebase/admin";
import { resolveDoctorHeadshotPath, resolveDoctorSignaturePath } from "./resolve";
import { resolveDoctorSignatureUrl } from "@/lib/doctor/signatureUrl";

/** @param {Record<string, unknown>|null|undefined} data Firestore user doc fields */
export async function resolveDoctorPhotoURLForDisplay(data) {
  if (typeof data?.photoURL === "string" && data.photoURL.startsWith("http")) {
    return data.photoURL;
  }
  const path = resolveDoctorHeadshotPath(data);
  if (!path) return "";
  try {
    return await getSignedStorageUrl(path);
  } catch {
    return "";
  }
}

/** @param {Record<string, unknown>|null|undefined} data Firestore user doc fields */
export async function resolveDoctorSignatureURLForDisplay(data) {
  const direct = resolveDoctorSignatureUrl(data);
  if (direct.startsWith("http") || direct.startsWith("data:image/")) {
    return direct;
  }
  const path = resolveDoctorSignaturePath(data);
  if (!path) return "";
  try {
    return await getSignedStorageUrl(path);
  } catch {
    return "";
  }
}
