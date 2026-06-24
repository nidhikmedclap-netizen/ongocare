// lib/prescriptions/catalog.js
//
// GLP-1 medication catalog for the doctor treatment prescription builder.
// Brand names and FDA-labeled doses for injection and tablet prescriptions.

export const PRESCRIPTION_TYPES = [
  { id: "injection", label: "Injection" },
  { id: "tablet", label: "Tablet" },
];

export const RX_MEDICATIONS = [
  { id: "ozempic", label: "Ozempic", type: "injection" },
  { id: "wegovy", label: "Wegovy", type: "injection" },
  { id: "mounjaro", label: "Mounjaro", type: "injection" },
  { id: "zepbound", label: "Zepbound", type: "injection" },
  { id: "liraglutide", label: "Liraglutide (Saxenda / Victoza)", type: "injection" },
  { id: "rybelsus", label: "Rybelsus", type: "tablet" },
];

/** Maps old catalog ids saved before the brand-name update. */
const LEGACY_MEDICATION_MAP = {
  "semaglutide-injection": "ozempic",
  "tirzepatide-injection": "mounjaro",
  "liraglutide-injection": "liraglutide",
  "semaglutide-tablets": "rybelsus",
};

function dose(id, label, sigDose) {
  return { id, label, sigDose };
}

export const STRENGTH_OPTIONS = {
  ozempic: [
    dose("0.25", "0.25 mg (starting dose)", "0.25 mg"),
    dose("0.5", "0.5 mg", "0.5 mg"),
    dose("1", "1 mg", "1 mg"),
    dose("2", "2 mg (higher dose)", "2 mg"),
  ],
  wegovy: [
    dose("0.25", "0.25 mg (starting dose)", "0.25 mg"),
    dose("0.5", "0.5 mg", "0.5 mg"),
    dose("1", "1 mg", "1 mg"),
    dose("1.7", "1.7 mg", "1.7 mg"),
    dose("2.4", "2.4 mg (maximum dose)", "2.4 mg"),
  ],
  mounjaro: [
    dose("2.5", "2.5 mg (starting dose)", "2.5 mg"),
    dose("5", "5 mg", "5 mg"),
    dose("7.5", "7.5 mg", "7.5 mg"),
    dose("10", "10 mg", "10 mg"),
    dose("12.5", "12.5 mg", "12.5 mg"),
    dose("15", "15 mg (maximum dose)", "15 mg"),
  ],
  zepbound: [
    dose("2.5", "2.5 mg (starting dose)", "2.5 mg"),
    dose("5", "5 mg", "5 mg"),
    dose("7.5", "7.5 mg", "7.5 mg"),
    dose("10", "10 mg", "10 mg"),
    dose("12.5", "12.5 mg", "12.5 mg"),
    dose("15", "15 mg (maximum dose)", "15 mg"),
  ],
  liraglutide: [
    dose("0.6", "0.6 mg (starting dose)", "0.6 mg"),
    dose("1.2", "1.2 mg", "1.2 mg"),
    dose("1.8", "1.8 mg", "1.8 mg"),
    dose("2.4", "2.4 mg", "2.4 mg"),
    dose("3", "3 mg (higher dose)", "3 mg"),
  ],
  rybelsus: [
    dose("1.5", "1.5 mg (starting dose)", "1.5 mg"),
    dose("4", "4 mg", "4 mg"),
    dose("9", "9 mg (higher dose)", "9 mg"),
  ],
};

export const PRESCRIPTION_TEMPLATES = {
  injection: {
    title: "Prescription Format (Injection for Weight Management)",
    dispense: "1 box (4 pens)",
    refills: "0",
    substitution: "Permitted unless DAW indicated",
    titrationTitle: "Titration Schedule (Common)",
    titration: [
      "Weeks 1–4: starting dose weekly",
      "Weeks 5–8: increase per product labeling as tolerated",
      "Weeks 9–12: further titration as tolerated",
      "Further increases based on product labeling and tolerance",
    ],
  },
  tablet: {
    title: "Prescription Format (Tablet for Weight Management)",
    dispense: "1 bottle (30 tablets)",
    refills: "0",
    substitution: "Permitted unless DAW indicated",
    titrationTitle: "Titration Schedule (Common)",
    titration: [
      "Weeks 1–4: 1.5 mg daily",
      "Weeks 5–8: 4 mg daily",
      "Weeks 9–12: 9 mg daily",
      "Further increases based on product labeling and tolerance",
    ],
  },
};

/** @deprecated use PRESCRIPTION_TEMPLATES */
export const TITRATION_SCHEDULE = PRESCRIPTION_TEMPLATES.injection.titration;

/** @deprecated use PRESCRIPTION_TEMPLATES */
export const STATIC_RX_FIELDS = {
  dispense: PRESCRIPTION_TEMPLATES.injection.dispense,
  refills: PRESCRIPTION_TEMPLATES.injection.refills,
  substitution: PRESCRIPTION_TEMPLATES.injection.substitution,
};

export function normalizeMedicationId(id) {
  if (!id) return "";
  return LEGACY_MEDICATION_MAP[id] || id;
}

export function getMedicationById(id) {
  const normalized = normalizeMedicationId(id);
  return RX_MEDICATIONS.find((m) => m.id === normalized) || null;
}

export function getMedicationsByType(type) {
  return RX_MEDICATIONS.filter((m) => m.type === type);
}

export function inferPrescriptionType({ prescriptionType, medicationId } = {}) {
  if (prescriptionType === "injection" || prescriptionType === "tablet") {
    return prescriptionType;
  }
  const med = getMedicationById(medicationId);
  if (med?.type === "tablet" || med?.type === "injection") return med.type;
  return "injection";
}

export function defaultSelectionForType(type) {
  const meds = getMedicationsByType(type);
  const medicationId = meds[0]?.id || "";
  const strengths = getStrengthOptions(medicationId);
  return {
    prescriptionType: type,
    medicationId,
    strengthId: strengths[0]?.id || "",
  };
}

export function getStrengthOptions(medicationId) {
  const normalized = normalizeMedicationId(medicationId);
  return STRENGTH_OPTIONS[normalized] || [];
}

export function getStrengthById(medicationId, strengthId) {
  return getStrengthOptions(medicationId).find((s) => s.id === strengthId) || null;
}

export function getTemplateForType(type) {
  return PRESCRIPTION_TEMPLATES[type] || PRESCRIPTION_TEMPLATES.injection;
}

export function normalizeStrengthId(medicationId, strengthId) {
  if (!strengthId) return "";
  const options = getStrengthOptions(medicationId);
  if (options.some((s) => s.id === strengthId)) return strengthId;
  // Legacy pen/tab suffix ids (e.g. "0.25-pen" → "0.25")
  const legacy = strengthId.replace(/-(pen|tab)$/, "");
  if (options.some((s) => s.id === legacy)) return legacy;
  return options[0]?.id || strengthId;
}
