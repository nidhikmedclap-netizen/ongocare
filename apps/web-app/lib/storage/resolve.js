// lib/storage/resolve.js
//
// Resolve display URLs from stored metadata or legacy fields.

/** @param {{ path?: string, downloadURL?: string }|string|null|undefined} source */
export function resolveStoredFilePath(source) {
  if (!source) return "";
  if (typeof source === "string") return source.startsWith("doctors/") || source.startsWith("patients/") ? source : "";
  return typeof source.path === "string" ? source.path : "";
}

export function resolveDoctorHeadshotUrl(profile) {
  if (!profile) return "";
  if (typeof profile.photoURL === "string" && profile.photoURL.startsWith("http")) {
    return profile.photoURL;
  }
  const nested = profile.doctorProfile?.headshot;
  if (nested?.downloadURL?.startsWith("http")) return nested.downloadURL;
  return "";
}

export function resolveDoctorHeadshotPath(profile) {
  if (!profile) return "";
  const nested = profile.doctorProfile?.headshot || profile.headshot;
  const path = resolveStoredFilePath(nested);
  if (path) return path;
  return "";
}

export function resolveDoctorSignaturePath(profile) {
  if (!profile) return "";
  const nested = profile.doctorProfile?.signature || profile.signature;
  return resolveStoredFilePath(nested);
}
