// lib/appointments/consultationTypes.js
//
// Doctor-facing visit types (not prescription medications).

export const CONSULTATION_TYPES = ["Initial consultation", "Follow-up"];

const LEGACY_DRUG_VISIT_TYPES = new Set(["Ozempic", "Wegovy", "Zepbound"]);

/** Map stored type to a valid consultation type for UI and API writes. */
export function normalizeConsultationType(type) {
  const trimmed = typeof type === "string" ? type.trim() : "";
  if (CONSULTATION_TYPES.includes(trimmed)) return trimmed;
  if (LEGACY_DRUG_VISIT_TYPES.has(trimmed)) return "Initial consultation";
  return "Initial consultation";
}

export function isValidConsultationType(type) {
  return CONSULTATION_TYPES.includes(type);
}
