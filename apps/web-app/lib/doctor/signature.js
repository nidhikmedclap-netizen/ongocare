// lib/doctor/signature.js
//
// Back-compat re-exports — prefer @/lib/storage/uploads for new code.

export { resolveDoctorSignatureUrl, sanitizeSignatureUrl } from "./signatureUrl";
export { uploadDoctorSignature } from "@/lib/storage/uploads";

import { uploadDoctorSignature as uploadDoctorSignatureResult } from "@/lib/storage/uploads";

/** Legacy helper — returns download URL string (empty on failure). */
export async function uploadDoctorSignatureUrlOnly(args) {
  const result = await uploadDoctorSignatureResult(args);
  return result?.downloadURL || "";
}
