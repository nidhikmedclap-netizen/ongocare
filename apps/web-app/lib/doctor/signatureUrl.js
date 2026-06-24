// lib/doctor/signatureUrl.js
//
// Pure helpers shared by client and server — no Firebase SDK imports.

export function resolveDoctorSignatureUrl(profile) {
  if (!profile) return "";

  const nested = profile.doctorProfile || {};
  if (
    typeof nested.signatureURL === "string" &&
    nested.signatureURL.startsWith("http")
  ) {
    return nested.signatureURL;
  }
  if (
    typeof profile.signatureURL === "string" &&
    profile.signatureURL.startsWith("http")
  ) {
    return profile.signatureURL;
  }

  const dataUrl = nested.signatureDataUrl || profile.signatureDataUrl || "";
  return dataUrl.startsWith("data:image/") ? dataUrl : "";
}

export function sanitizeSignatureUrl(value) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed.slice(0, 2048);
  }
  if (trimmed.startsWith("data:image/")) {
    return trimmed.slice(0, 500000);
  }
  return "";
}
