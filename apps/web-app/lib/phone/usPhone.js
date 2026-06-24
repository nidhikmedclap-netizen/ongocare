// lib/phone/usPhone.js
//
// US phone numbers: exactly 11 digits (country code 1 + 10-digit NANP number),
// displayed as +1 (888) 655-5267.

export const PHONE_DIGIT_COUNT = 11;
export const PHONE_DISPLAY_PLACEHOLDER = "+1 (888) 655-5267";
export const PHONE_INVALID_MESSAGE =
  "Enter a valid US phone number (+1 (888) 655-5267).";

export function extractPhoneDigits(phone) {
  return String(phone || "").replace(/\D/g, "");
}

/** Returns 11-digit string starting with 1, or null when invalid. */
export function normalizePhoneDigits(phone) {
  let digits = extractPhoneDigits(phone);
  if (!digits) return null;
  if (digits.length === 10) digits = `1${digits}`;
  if (digits.length !== PHONE_DIGIT_COUNT) return null;
  if (digits[0] !== "1") return null;
  // NANP: area code and exchange cannot start with 0 or 1.
  if (digits[1] === "0" || digits[1] === "1") return null;
  if (digits[4] === "0" || digits[4] === "1") return null;
  return digits;
}

export function isValidPhone(phone) {
  return normalizePhoneDigits(phone) !== null;
}

export function formatPhoneDisplay(phone) {
  const digits = normalizePhoneDigits(phone);
  if (!digits) return String(phone || "").trim();
  const area = digits.slice(1, 4);
  const prefix = digits.slice(4, 7);
  const line = digits.slice(7, 11);
  return `+1 (${area}) ${prefix}-${line}`;
}

export function formatPhoneTelHref(phone) {
  const digits = normalizePhoneDigits(phone);
  return digits ? `tel:+${digits}` : "";
}

/** Format as the user types; caps at 11 digits. */
export function sanitizePhoneInput(value) {
  let digits = extractPhoneDigits(value);
  if (!digits) return "";

  if (digits[0] !== "1") {
    digits = `1${digits}`;
  }
  digits = digits.slice(0, PHONE_DIGIT_COUNT);

  const national = digits.slice(1);
  if (national.length === 0) return "+1 (";
  if (national.length <= 3) return `+1 (${national}`;
  if (national.length <= 6) {
    return `+1 (${national.slice(0, 3)}) ${national.slice(3)}`;
  }
  return `+1 (${national.slice(0, 3)}) ${national.slice(3, 6)}-${national.slice(6)}`;
}

/** Normalize for Firestore; empty string stays empty. */
export function normalizePhoneForStorage(phone) {
  const trimmed = String(phone || "").trim();
  if (!trimmed) return "";
  const digits = normalizePhoneDigits(trimmed);
  if (!digits) {
    throw new Error(PHONE_INVALID_MESSAGE);
  }
  return formatPhoneDisplay(digits);
}
