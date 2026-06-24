// Maps admin doctor detail ↔ onboard-style form state for super-admin edits.

import { formatPhoneDisplay } from "@/lib/phone/usPhone";
import { timezoneForDoctorHomeState } from "@/lib/doctor/homeState";
import {
  emptyLicense,
  availabilityToWeeklySchedule,
  weeklyScheduleToFormAvailability,
} from "@/app/doctor/doctor-onboard/_lib/constants";
import { normalizeSlotDurationMinutes } from "@/lib/appointments/slotDuration";

export { weeklyScheduleToFormAvailability };

function bankingToFormState(banking) {
  const empty = {
    accountHolder: "",
    bankName: "",
    accountType: "checking",
    routingNumber: "",
    accountNumber: "",
  };
  if (!banking || typeof banking !== "object") return empty;

  const routingDigits = String(banking.routingNumber || "").replace(/\D/g, "");
  const accountDigits = String(banking.accountNumber || "").replace(/\D/g, "");

  return {
    accountHolder: banking.accountHolder || "",
    bankName: banking.bankName || "",
    accountType: banking.accountType === "savings" ? "savings" : "checking",
    // Ignore masked placeholders (•••1234) — only accept full digits for edit.
    routingNumber: /^\d{9}$/.test(routingDigits) ? routingDigits : "",
    accountNumber: /^\d{6,17}$/.test(accountDigits) ? accountDigits : "",
  };
}

export function doctorDetailToFormState(doctor) {
  return {
    firstName: doctor.firstName || "",
    lastName: doctor.lastName || "",
    phone: doctor.phone ? formatPhoneDisplay(doctor.phone) : "",
    bio: doctor.bio || "",
    licenses:
      doctor.licenses?.length > 0
        ? doctor.licenses.map((l) => ({
            state: l.state || "",
            licenseNumber: l.licenseNumber || "",
            licenseType: l.licenseType || "MD",
          }))
        : [emptyLicense()],
    homeState: doctor.homeState || "",
    availability: weeklyScheduleToFormAvailability(
      doctor.availability?.weeklySchedule,
    ),
    slotDurationMinutes: normalizeSlotDurationMinutes(
      doctor.availability?.slotDurationMinutes,
    ),
    banking: bankingToFormState(doctor.banking),
  };
}

export function buildAdminDoctorUpdatePayload({
  form,
  photoURL,
  headshot,
  signatureURL,
  signature,
  signatureDataUrl,
  orgSlugs,
  existingAvailability,
}) {
  const payload = {
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    phone: form.phone.trim() ? formatPhoneDisplay(form.phone) : "",
    bio: form.bio.trim(),
    licenses: form.licenses.map((l) => ({
      state: l.state,
      licenseNumber: l.licenseNumber.trim(),
      licenseType: l.licenseType,
    })),
    homeState:
      form.homeState || form.licenses.find((l) => l.state)?.state || "",
    banking: {
      accountHolder: form.banking.accountHolder.trim(),
      bankName: form.banking.bankName.trim(),
      accountType: form.banking.accountType,
      routingNumber: form.banking.routingNumber.trim(),
      accountNumber: form.banking.accountNumber.replace(/\s/g, ""),
    },
    availability: {
      slotDurationMinutes: form.slotDurationMinutes,
      timezone: timezoneForDoctorHomeState(
        form.homeState || form.licenses.find((l) => l.state)?.state,
      ),
      blockedDates: existingAvailability?.blockedDates || [],
      weeklySchedule: availabilityToWeeklySchedule(form.availability),
    },
  };

  if (photoURL) payload.photoURL = photoURL;
  if (headshot !== undefined) payload.headshot = headshot;
  if (signatureURL !== undefined) payload.signatureURL = signatureURL;
  if (signature !== undefined) payload.signature = signature;
  if (signatureDataUrl !== undefined) payload.signatureDataUrl = signatureDataUrl;
  if (Array.isArray(orgSlugs) && orgSlugs.length > 0) payload.orgSlugs = orgSlugs;

  return payload;
}
