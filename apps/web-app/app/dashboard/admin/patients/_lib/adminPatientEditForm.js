import { formatPhoneDisplay } from "@/lib/phone/usPhone";

/** Normalize DOB for `<input type="date">` (YYYY-MM-DD). */
export function dobForDateInput(dob) {
  if (!dob) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(dob)) return dob;
  const slash = dob.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (slash) return `${slash[3]}-${slash[1]}-${slash[2]}`;
  const parsed = new Date(dob);
  if (!Number.isNaN(parsed.getTime())) {
    return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(parsed.getDate()).padStart(2, "0")}`;
  }
  return "";
}

/**
 * Map a patient doc (list row or GET /api/admin/patients/[uid]) into edit form values.
 * Falls back to nested onboarding fields for legacy records.
 */
export function adminPatientEditInitialValues(patient) {
  const onb = patient?.onboarding || {};
  const phone = patient?.phone || onb.phone || "";
  return {
    firstName: patient?.firstName || onb.firstName || "",
    lastName: patient?.lastName || onb.lastName || "",
    phone: phone ? formatPhoneDisplay(phone) : "",
    dob: dobForDateInput(patient?.dob || onb.dob || ""),
    address: onb.address || "",
    zip: onb.zip || "",
  };
}
