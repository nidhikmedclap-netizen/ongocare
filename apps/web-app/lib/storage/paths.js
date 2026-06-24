// lib/storage/paths.js
//
// Canonical Firebase Storage paths. Every upload in the app should use these
// builders so files stay organized and APIs can authorize by prefix.

const SAFE_EXT = /^[a-z0-9]+$/;

export function normalizeStorageExt(fileNameOrExt, fallback = "jpg") {
  const raw = String(fileNameOrExt || "")
    .split(".")
    .pop()
    ?.toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  if (raw && SAFE_EXT.test(raw)) {
    if (raw === "jpeg") return "jpg";
    if (raw === "heif") return "heic";
    return raw;
  }
  return fallback;
}

export function contentTypeForExt(ext) {
  switch (normalizeStorageExt(ext)) {
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "heic":
      return "image/heic";
    case "gif":
      return "image/gif";
    default:
      return "image/jpeg";
  }
}

/** Doctor profile headshot */
export function doctorHeadshotPath(uid, ext = "jpg") {
  return `doctors/${uid}/headshot.${normalizeStorageExt(ext)}`;
}

/** Doctor e-signature (always PNG) */
export function doctorSignaturePath(uid) {
  return `doctors/${uid}/signature.png`;
}

/** Patient government ID (onboarding) */
export function patientPhotoIdPath(uid, ext = "jpg") {
  return `patients/${uid}/documents/photo-id.${normalizeStorageExt(ext)}`;
}

/** Patient GLP-1 vial / prescription photo (optional onboarding) */
export function patientVialPhotoPath(uid, ext = "jpg") {
  return `patients/${uid}/documents/vial-photo.${normalizeStorageExt(ext)}`;
}

/** Allowed top-level prefixes for server-side access checks */
export const STORAGE_PREFIXES = ["doctors/", "patients/"];

export function isValidStoragePath(path) {
  if (typeof path !== "string") return false;
  const trimmed = path.trim();
  if (!trimmed || trimmed.includes("..") || trimmed.startsWith("/")) return false;
  return STORAGE_PREFIXES.some((prefix) => trimmed.startsWith(prefix));
}
