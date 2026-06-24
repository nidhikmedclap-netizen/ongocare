// lib/prescriptions/format.js
//
// Builds the doctor prescription document from patient, BMI, and selections.

import { formatUsDate } from "@/lib/dates/usDate";
import {
  getMedicationById,
  getStrengthById,
  getTemplateForType,
  inferPrescriptionType,
} from "./catalog";

const SIG_INJECTION =
  "Inject {dose} subcutaneously once weekly for 4 weeks, then increase per titration schedule as tolerated.";

const SIG_ORAL =
  "Take {dose} orally once daily for 4 weeks, then increase per titration schedule as tolerated.";

export function indicationFromBmi(bmi) {
  if (bmi == null || Number.isNaN(bmi)) {
    return "BMI not available — confirm eligibility clinically";
  }
  if (bmi >= 30) return "Obesity";
  if (bmi >= 27) return "Overweight with comorbidity";
  if (bmi >= 25) return "Overweight — confirm comorbidity for GLP-1 eligibility";
  return "Below standard BMI threshold for GLP-1 therapy";
}

export function formatPrescriptionDate(date = new Date()) {
  return formatUsDate(date, "");
}

export function formatPatientDob(dob) {
  if (!dob) return "—";
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dob)) return dob;
  const iso = dob.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[2]}/${iso[3]}/${iso[1]}`;
  const parsed = new Date(dob);
  if (!Number.isNaN(parsed.getTime())) return formatPrescriptionDate(parsed);
  return dob;
}

export function resolvePrescriberName(profile) {
  if (!profile) return "—";
  const name = [profile.firstName, profile.lastName].filter(Boolean).join(" ");
  if (!name) return "—";
  const licenses = Array.isArray(profile.licenses) ? profile.licenses : [];
  const credential =
    licenses.find((l) => l?.licenseType)?.licenseType || "MD";
  return `${name}, ${credential}`;
}

export function resolveDoctorNpi(profile, patientState) {
  if (!profile) return "—";
  const licenses = Array.isArray(profile.licenses) ? profile.licenses : [];
  if (licenses.length === 0) return "—";

  const state =
    typeof patientState === "string" && patientState.length === 2
      ? patientState.toUpperCase()
      : null;

  const match = state
    ? licenses.find((l) => (l?.state || "").toUpperCase() === state)
    : null;

  const license = match || licenses[0];
  return license?.licenseNumber?.trim() || "—";
}

function buildSig(strength, prescriptionType) {
  const dose = strength?.sigDose || "—";
  const template = prescriptionType === "tablet" ? SIG_ORAL : SIG_INJECTION;
  return template.replace("{dose}", dose);
}

export function buildPrescriptionText({
  patient,
  medicationId,
  strengthId,
  prescriptionType,
  doctorProfile,
  bmi,
  date = new Date(),
}) {
  const type = inferPrescriptionType({ prescriptionType, medicationId });
  const template = getTemplateForType(type);
  const medication = getMedicationById(medicationId);
  const strength = getStrengthById(medicationId, strengthId);
  const onb = patient?.onboarding || {};

  const lines = [
    template.title,
    "",
    `Patient Name: ${patient?.fullName || "—"}`,
    `DOB: ${formatPatientDob(patient?.dob)}`,
    `Rx: ${medication?.label || "—"}`,
    `Strength: ${strength?.label || "—"}`,
    `Sig: ${buildSig(strength, type)}`,
    `Dispense: ${template.dispense}`,
    `Refills: ${template.refills}`,
    `Indication: ${indicationFromBmi(bmi)}`,
    `Substitution: ${template.substitution}`,
    `Prescriber: ${resolvePrescriberName(doctorProfile)}`,
    `NPI: ${resolveDoctorNpi(doctorProfile, onb.state)}`,
    `Date: ${formatPrescriptionDate(date)}`,
    "",
    template.titrationTitle,
    ...template.titration.map((item) => `- ${item}`),
  ];

  return lines.join("\n");
}
