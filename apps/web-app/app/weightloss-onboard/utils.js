// Pure helpers used by the onboarding form. No React, no state.
// Anything related to validation, BMI math, or text formatting lives here.

import { stateNameByCode, US_STATE_CODES } from "@/data/usStates";
import { isValidPhone as validateUsPhone } from "@/lib/phone/usPhone";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// Unicode letter ranges so accented names (José, María, Søren) are accepted,
// plus the punctuation real names actually need: space, hyphen, apostrophe, period.
const NAME_REGEX =
  /^[A-Za-zÀ-ÖØ-öø-ÿĀ-ž\u00C0-\u024F][A-Za-zÀ-ÖØ-öø-ÿĀ-ž\u00C0-\u024F'\-.\s]{0,48}[A-Za-zÀ-ÖØ-öø-ÿĀ-ž\u00C0-\u024F.]$/;
const ADDRESS_REGEX = /^[A-Za-z0-9][A-Za-z0-9\s,.\-#/']{3,148}[A-Za-z0-9.]$/;

const NAME_MAX = 50;
const ADDRESS_MAX = 150;
const ADDRESS_MIN = 5;
const EMAIL_MAX = 120;
const NOTES_MAX = 500;
const PHARMACY_MAX = 200;

export const EMAIL_LIMIT = EMAIL_MAX;
export const NAME_LIMIT = NAME_MAX;
export const ADDRESS_LIMIT = ADDRESS_MAX;
export const NOTES_LIMIT = NOTES_MAX;
export const PHARMACY_LIMIT = PHARMACY_MAX;
export const PASSWORD_MAX = 64;
export const BIO_MAX = 600;
export const RX_TEMPLATE_MAX = 4000;
export const BANK_NAME_MAX = 100;
export const LICENSE_NUMBER_MAX = 30;

export const isValidEmail = (email) => {
  const v = String(email || "").trim();
  if (v.length === 0 || v.length > EMAIL_MAX) return false;
  return EMAIL_REGEX.test(v);
};

export const isValidName = (name) => {
  const v = String(name || "").trim();
  if (v.length < 2 || v.length > NAME_MAX) return false;
  if (v.length === 2) {
    // Two-letter names like "Al" are fine — the trailing-char rule still needs a letter.
    return /^[A-Za-zÀ-ÖØ-öø-ÿĀ-ž\u00C0-\u024F]{2}$/.test(v);
  }
  return NAME_REGEX.test(v);
};

export const isValidPhone = validateUsPhone;

// US ZIP code: 5 digits OR ZIP+4 (5 digits, hyphen, 4 digits).
// Mirrors the official USPS format. We don't try to validate that the ZIP
// actually exists — that's a billion-row dataset and overkill for a
// directional check. The form gates Continue on this, but the state field
// is the source of truth for clinician matching.
const ZIP_REGEX = /^\d{5}(?:-\d{4})?$/;
export const isValidZip = (zip) => ZIP_REGEX.test(String(zip || "").trim());

// US state: must be one of the 50 + DC + PR codes we ship in data/usStates.
// Anything else (free text, lowercase, "ZZ") fails — the field is a
// dropdown so this should only ever fail when the form is blank.
export const isValidState = (state) => {
  const v = String(state || "").trim().toUpperCase();
  return US_STATE_CODES.has(v);
};

export const isValidAddress = (address) => {
  const v = String(address || "").trim();
  if (v.length < ADDRESS_MIN || v.length > ADDRESS_MAX) return false;
  return ADDRESS_REGEX.test(v);
};

export const isRequiredText = (value) => String(value || "").trim().length > 0;

export function isPositiveWeight(value) {
  const n = parseFloat(value);
  return Number.isFinite(n) && n > 0;
}

// ─────────────────────────────────────────────
//  Keystroke-level input sanitizers
//  Used in onChange to strip illegal characters as the user types.
// ─────────────────────────────────────────────

/**
 * Keep digits only, capped at maxLen. Strips leading zeros once the user
 * types a 2nd digit so values like "07" become "7".
 */
export function sanitizeDigits(value, maxLen = 6) {
  let digits = String(value || "").replace(/\D/g, "");
  if (digits.length > 1) digits = digits.replace(/^0+/, "") || "0";
  if (maxLen && digits.length > maxLen) digits = digits.slice(0, maxLen);
  return digits;
}

/**
 * Integer string clamped to `max`. Returns "" for empty input so the
 * placeholder stays visible.
 */
export function sanitizeIntegerString(value, max) {
  const digits = sanitizeDigits(value, String(max).length + 1);
  if (digits === "") return "";
  const n = parseInt(digits, 10);
  if (!Number.isFinite(n)) return "";
  if (typeof max === "number" && n > max) return String(max);
  return String(n);
}

/**
 * Names: letters (including accented), spaces, hyphens, apostrophes,
 * periods. Collapses runs of spaces. Capped at 50 chars.
 */
export function sanitizeName(value) {
  return String(value || "")
    .replace(/[^A-Za-zÀ-ÖØ-öø-ÿĀ-ž\u00C0-\u024F'\-.\s]/g, "")
    .replace(/\s{2,}/g, " ")
    .slice(0, NAME_MAX);
}

/**
 * Street addresses: alphanumerics + safe punctuation (`, . - # / '` + space).
 */
export function sanitizeAddress(value) {
  return String(value || "")
    .replace(/[^A-Za-z0-9\s,.\-#/']/g, "")
    .replace(/\s{2,}/g, " ")
    .slice(0, ADDRESS_MAX);
}

export function sanitizeFreeText(value, maxLen = NOTES_MAX) {
  return String(value || "").replace(/\s{3,}/g, "  ").slice(0, maxLen);
}

export function sanitizeEmail(value) {
  return String(value || "").replace(/\s/g, "").slice(0, EMAIL_MAX);
}

/**
 * US ZIP keystroke sanitizer. Strips every non-digit, caps to 9 digits, and
 * auto-inserts the hyphen between the 5th and 6th digit so the user sees
 * "12345-6789" as they type. Returns "12345" for 5 digits or fewer.
 *
 * Examples:
 *   "abc12345" → "12345"
 *   "12345 6789" → "12345-6789"
 *   "12345-6789-extra" → "12345-6789"
 *   "1.2.3.4.5" → "12345"
 */
export function sanitizeZip(value) {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 9);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

/**
 * US medical license numbers — letters, digits, and hyphens only.
 * Formats vary by state (e.g. ME-12345, MD123456).
 */
export function sanitizeLicenseNumber(value) {
  return String(value || "")
    .replace(/[^A-Za-z0-9-]/g, "")
    .slice(0, LICENSE_NUMBER_MAX);
}

export function isValidLicenseNumber(value) {
  const v = String(value || "").trim();
  if (v.length < 2 || v.length > LICENSE_NUMBER_MAX) return false;
  return /^[A-Za-z0-9-]+$/.test(v);
}

/** Normalized key for duplicate license checks (case-insensitive). */
export function licenseNumberKey(value) {
  return sanitizeLicenseNumber(value).toUpperCase();
}

/** Normalized state + license key — uniqueness is per state, not globally. */
export function licenseStateKey(state, licenseNumber) {
  const st = String(state || "").trim().toUpperCase();
  const num = licenseNumberKey(licenseNumber);
  if (!st || !num) return "";
  return `${st}|${num}`;
}

/** Default license type when unset (matches doctor onboarding form default). */
export function normalizeLicenseType(licenseType) {
  const t = String(licenseType || "").trim();
  return t || "MD";
}

/** One license per state per licenseType — comparison key. */
export function licenseStateTypeKey(state, licenseType) {
  const st = String(state || "").trim().toUpperCase();
  if (!st) return "";
  return `${st}|${normalizeLicenseType(licenseType)}`;
}

export function licenseStateTypeDuplicateMessage(state, licenseType) {
  return `You already have a ${normalizeLicenseType(licenseType)} license for ${stateNameByCode(state)}.`;
}

/** Bank names: letters, digits, and common punctuation only. */
export function sanitizeBankName(value) {
  return String(value || "")
    .replace(/[^A-Za-z0-9\s'\-.,&]/g, "")
    .replace(/\s{2,}/g, " ")
    .slice(0, BANK_NAME_MAX);
}

/** Multi-select "Other" / "Something else" options (value may differ by tenant label). */
export function isSomethingElseSelection(value) {
  if (!value || typeof value !== "string") return false;
  if (value === "Other") return true;
  return value.toLowerCase().includes("something else");
}

export function includesSomethingElse(values) {
  return Array.isArray(values) && values.some(isSomethingElseSelection);
}

/** Ethnicity screens — "Prefer not to …" is exclusive of all other choices. */
export function isPreferNotEthnicity(value) {
  return /^prefer not/i.test(String(value || "").trim());
}

export function toggleEthnicitySelection(current, value) {
  const selected = Array.isArray(current) ? current : [];
  if (isPreferNotEthnicity(value)) {
    return selected.includes(value) ? [] : [value];
  }
  const withoutPreferNot = selected.filter((v) => !isPreferNotEthnicity(v));
  return selected.includes(value)
    ? withoutPreferNot.filter((v) => v !== value)
    : [...withoutPreferNot, value];
}

/**
 * Returns digits-only positive integer string, with no leading zeros.
 * Designed for fields like "doctor priority" where 0, negatives, decimals,
 * and any non-digit must be impossible to type or paste. Empty stays empty
 * so the placeholder still shows.
 */
export function sanitizePositiveInteger(value, maxLen = 4) {
  let digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "";
  digits = digits.replace(/^0+/, "");
  if (!digits) return "";
  if (maxLen && digits.length > maxLen) digits = digits.slice(0, maxLen);
  return digits;
}

// ─────────────────────────────────────────────
//  Numeric range validators (returns null when value is in range,
//  or a user-facing error string when it isn't).
//  Empty strings always return null — gate the screen separately.
// ─────────────────────────────────────────────

function rangeMessage(value, { min, max, unit, fieldLabel }) {
  if (value === "" || value == null) return null;
  const n = parseInt(value, 10);
  if (!Number.isFinite(n)) return `${fieldLabel} must be a whole number.`;
  if (n < min) return `${fieldLabel} must be at least ${min} ${unit}.`;
  if (n > max) return `${fieldLabel} must be ${max} ${unit} or less.`;
  return null;
}

export const HEIGHT_FT_MIN = 2;
export const HEIGHT_FT_MAX = 9;
export const HEIGHT_IN_MIN = 0;
export const HEIGHT_IN_MAX = 11;
export const HEIGHT_CM_MIN = 61;
export const HEIGHT_CM_MAX = 274;
export const WEIGHT_LBS_MIN = 50;
export const WEIGHT_LBS_MAX = 1100;
export const WEIGHT_KG_MIN = 20;
export const WEIGHT_KG_MAX = 500;
export const WAIST_IN_MIN = 10;
export const WAIST_IN_MAX = 100;

export const heightFtError = (v) =>
  rangeMessage(v, { min: HEIGHT_FT_MIN, max: HEIGHT_FT_MAX, unit: "ft", fieldLabel: "Height" });
export const heightInError = (v) =>
  rangeMessage(v, { min: HEIGHT_IN_MIN, max: HEIGHT_IN_MAX, unit: "in", fieldLabel: "Inches" });
export const heightCmError = (v) =>
  rangeMessage(v, { min: HEIGHT_CM_MIN, max: HEIGHT_CM_MAX, unit: "cm", fieldLabel: "Height" });
export const weightLbsError = (v) =>
  rangeMessage(v, { min: WEIGHT_LBS_MIN, max: WEIGHT_LBS_MAX, unit: "lbs", fieldLabel: "Weight" });
export const weightKgError = (v) =>
  rangeMessage(v, { min: WEIGHT_KG_MIN, max: WEIGHT_KG_MAX, unit: "kg", fieldLabel: "Weight" });
export const waistError = (v) =>
  rangeMessage(v, { min: WAIST_IN_MIN, max: WAIST_IN_MAX, unit: "in", fieldLabel: "Waist" });

export const isInRange = (value, min, max) => {
  if (value === "" || value == null) return false;
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n >= min && n <= max;
};

export const isValidWeightLbs = (v) => isInRange(v, WEIGHT_LBS_MIN, WEIGHT_LBS_MAX);
export const isValidWeightKg = (v) => isInRange(v, WEIGHT_KG_MIN, WEIGHT_KG_MAX);
export const isValidHeightFt = (v) => isInRange(v, HEIGHT_FT_MIN, HEIGHT_FT_MAX);
export const isValidHeightIn = (v) => isInRange(v, HEIGHT_IN_MIN, HEIGHT_IN_MAX);
export const isValidHeightCm = (v) => isInRange(v, HEIGHT_CM_MIN, HEIGHT_CM_MAX);
export const isValidWaistOptional = (v) =>
  v === "" || v == null ? true : isInRange(v, WAIST_IN_MIN, WAIST_IN_MAX);

// Password policy: 8+ chars, at least one letter and one digit.
// Deliberately permissive on special characters per current NIST guidance —
// complex rules hurt UX more than they help security. Length is what matters.
// Firebase Auth's own server-side minimum is 6, so this is stricter than the
// platform default by design.
export function isValidPassword(password) {
  if (typeof password !== "string") return false;
  if (password.length < 8) return false;
  if (!/[A-Za-z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  return true;
}

// Returns a user-facing reason the password is invalid, or null if it's fine.
// Used to render inline hints under the password input as the user types.
export function passwordValidationMessage(password) {
  if (!password) return null; // don't yell while empty
  if (password.length < 8) return "Use at least 8 characters.";
  if (!/[A-Za-z]/.test(password)) return "Include at least one letter.";
  if (!/[0-9]/.test(password)) return "Include at least one number.";
  return null;
}

export const GLP_LAST_INJECTION_MAX_YEARS_AGO = 30;

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function formatIsoDateLocal(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Earliest allowed last-injection date — 30 years before `fromDate` (local). */
export function glpLastInjectionMinDate(fromDate = new Date()) {
  const anchor =
    typeof fromDate === "string" && ISO_DATE_RE.test(fromDate)
      ? new Date(`${fromDate}T00:00:00`)
      : fromDate instanceof Date
        ? new Date(fromDate.getTime())
        : new Date();
  if (Number.isNaN(anchor.getTime())) {
    const fallback = new Date();
    fallback.setFullYear(fallback.getFullYear() - GLP_LAST_INJECTION_MAX_YEARS_AGO);
    return formatIsoDateLocal(fallback);
  }
  anchor.setFullYear(anchor.getFullYear() - GLP_LAST_INJECTION_MAX_YEARS_AGO);
  return formatIsoDateLocal(anchor);
}

/** User-facing error for last GLP-1 injection date, or null when valid. */
export function glpLastInjectionDateError(
  value,
  { maxDate, minDate } = {},
) {
  if (!value || typeof value !== "string") {
    return "Enter your last injection date.";
  }
  if (!ISO_DATE_RE.test(value)) {
    return "Enter a valid date.";
  }

  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(year, month - 1, day);
  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return "Enter a valid date.";
  }

  const max =
    maxDate && ISO_DATE_RE.test(maxDate)
      ? maxDate
      : formatIsoDateLocal(new Date());
  const min =
    minDate && ISO_DATE_RE.test(minDate)
      ? minDate
      : glpLastInjectionMinDate(max);

  if (value > max) return "Date cannot be in the future.";
  if (value < min) {
    return `Date must be within the past ${GLP_LAST_INJECTION_MAX_YEARS_AGO} years.`;
  }
  return null;
}

// Returns true when the supplied YYYY-MM-DD birthdate puts the user at
// `years`+ today (uses local date components, not UTC).
export function isAtLeastAge(dob, years) {
  if (!dob) return false;
  const parsed = new Date(dob);
  if (Number.isNaN(parsed.getTime())) return false;
  const today = new Date();
  const cutoff = new Date(
    today.getFullYear() - years,
    today.getMonth(),
    today.getDate(),
  );
  return parsed.getTime() <= cutoff.getTime();
}

export function bmiCategory(bmi) {
  if (bmi == null) return null;
  if (bmi < 18.5) return "under";
  if (bmi < 25) return "healthy";
  if (bmi < 30) return "over";
  return "obese";
}

export function eligibilityText(bmi) {
  if (bmi == null) return "Enter your details";
  if (bmi >= 30) return "Likely qualifies";
  if (bmi >= 27) return "May qualify";
  return "Unlikely to qualify";
}

export function calculateBmi(input) {
  if (input.unit === "imperial") {
    const feet = parseFloat(input.heightFt) || 0;
    const inches = parseFloat(input.heightIn) || 0;
    const pounds = parseFloat(input.weightLbs) || 0;
    if (feet <= 0 || pounds <= 0) return null;
    const totalInches = feet * 12 + inches;
    if (totalInches <= 0) return null;
    return (pounds * 703) / (totalInches * totalInches);
  }
  const cm = parseFloat(input.heightCm) || 0;
  const kg = parseFloat(input.weightKg) || 0;
  if (cm <= 0 || kg <= 0) return null;
  const meters = cm / 100;
  return kg / (meters * meters);
}

export function bmiInputError(input) {
  if (input.unit === "imperial") {
    const feet = parseFloat(input.heightFt);
    const inches = parseFloat(input.heightIn) || 0;
    const pounds = parseFloat(input.weightLbs);
    if (input.heightFt && feet < 2) return "Height must be at least 2 feet.";
    if (input.heightFt && (feet > 9 || (feet === 9 && inches > 0)))
      return "Height must be 9 feet or less.";
    if (input.heightIn && (inches < 0 || inches > 11))
      return "Inches must be between 0 and 11.";
    if (input.weightLbs && pounds > 1100)
      return "Weight must be 1100 lbs or less.";
    return null;
  }
  const cm = parseFloat(input.heightCm);
  const kg = parseFloat(input.weightKg);
  if (input.heightCm && cm < 61)
    return "Height must be at least 61 cm (2 ft).";
  if (input.heightCm && cm > 274)
    return "Height must be 274 cm (9 ft) or less.";
  if (input.weightKg && kg > 500) return "Weight must be 500 kg or less.";
  return null;
}

// Builds a grammatical list out of bariatric procedure names.
// e.g. ["Lap band", "Gastric sleeve"] -> { list: "lap band and gastric sleeve", word: "surgeries" }
export function buildSurgeryListText(procedures) {
  const lowered = procedures.map((procedure) => procedure.toLowerCase());
  let list = "";
  if (lowered.length <= 1) {
    list = lowered[0] ?? "";
  } else if (lowered.length === 2) {
    list = `${lowered[0]} and ${lowered[1]}`;
  } else {
    const head = lowered.slice(0, -1).join(", ");
    const tail = lowered[lowered.length - 1];
    list = `${head}, and ${tail}`;
  }
  const word = procedures.length > 1 ? "surgeries" : "surgery";
  return { list, word };
}

export function formatSavings(amount) {
  return amount < 0 ? `Save $-${Math.abs(amount)}` : `Save $${amount}`;
}
