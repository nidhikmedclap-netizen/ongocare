// Shared patient profile validation (onboarding S21 + super-admin patient edit).
// Change rules or messages here — all consumers update automatically.

import { PHONE_INVALID_MESSAGE } from "@/lib/phone/usPhone";
import {
  isAtLeastAge,
  isValidAddress,
  isValidName,
  isValidPhone,
  isValidState,
  isValidZip,
} from "@/app/weightloss-onboard/utils";
import { MIN_AGE_YEARS } from "@/app/weightloss-onboard/_screens/constants";

export const PATIENT_PROFILE_FIELD_MESSAGES = {
  firstName: "First name must be at least 2 characters.",
  firstNameRequired: "First name is required.",
  lastName: "Last name must be at least 2 characters.",
  lastNameRequired: "Last name is required.",
  phone: PHONE_INVALID_MESSAGE,
  dobRequired: "Date of birth is required.",
  dobAge: `You must be at least ${MIN_AGE_YEARS} years old.`,
  zipRequired: "ZIP code is required.",
  zipInvalid:
    "Enter a valid US ZIP code (5 digits or 5+4, e.g. 90210 or 90210-1234).",
  stateRequired: "Please select your state.",
  addressRequired: "Street address is required.",
  addressInvalid: "Please enter your street address.",
};

/** Latest DOB that still satisfies MIN_AGE_YEARS (YYYY-MM-DD). */
export function profileMaxDobDate() {
  const cap = new Date();
  cap.setFullYear(cap.getFullYear() - MIN_AGE_YEARS);
  return `${cap.getFullYear()}-${String(cap.getMonth() + 1).padStart(2, "0")}-${String(cap.getDate()).padStart(2, "0")}`;
}

function resolveMessages(overrides = {}) {
  return { ...PATIENT_PROFILE_FIELD_MESSAGES, ...overrides };
}

function shouldRequireState(form, options) {
  if (typeof options.requireState === "boolean") return options.requireState;
  return Object.prototype.hasOwnProperty.call(form, "state");
}

/**
 * Full validation map for profile fields. Values are error strings; omitted
 * keys mean the field is valid.
 */
export function patientProfileFieldErrors(form, options = {}) {
  const m = resolveMessages(options.messages);
  const requireState = shouldRequireState(form, options);
  const errors = {};

  if (!isValidName(form.firstName)) {
    errors.firstName = form.firstName?.trim()
      ? m.firstName
      : m.firstNameRequired;
  }
  if (!isValidName(form.lastName)) {
    errors.lastName = form.lastName?.trim()
      ? m.lastName
      : m.lastNameRequired;
  }
  if (!isValidPhone(form.phone)) {
    errors.phone = m.phone;
  }
  if (!form.dob) {
    errors.dob = m.dobRequired;
  } else if (!isAtLeastAge(form.dob, MIN_AGE_YEARS)) {
    errors.dob = m.dobAge;
  }
  if (!isValidZip(form.zip)) {
    errors.zip = form.zip?.trim() ? m.zipInvalid : m.zipRequired;
  }
  if (requireState && !isValidState(form.state)) {
    errors.state = m.stateRequired;
  }
  if (!isValidAddress(form.address)) {
    errors.address = form.address?.trim()
      ? m.addressInvalid
      : m.addressRequired;
  }

  return errors;
}

export function patientProfileFormIsValid(form, options = {}) {
  return Object.keys(patientProfileFieldErrors(form, options)).length === 0;
}

/**
 * Onboarding S21 display rules: some fields show errors while typing,
 * others only after a submit attempt.
 */
export function patientProfileDisplayErrors(form, options = {}) {
  const { showErrors = false, ...fieldErrorOptions } = options;
  const base = patientProfileFieldErrors(form, fieldErrorOptions);
  const errors = {};

  const showIfTouched = (key) =>
    showErrors || String(form[key] ?? "").length > 0;

  if (base.firstName && showIfTouched("firstName")) errors.firstName = base.firstName;
  if (base.lastName && showIfTouched("lastName")) errors.lastName = base.lastName;
  if (base.phone && showIfTouched("phone")) errors.phone = base.phone;
  if (base.zip && showIfTouched("zip")) errors.zip = base.zip;
  if (base.address && showIfTouched("address")) errors.address = base.address;
  if (base.dob && showErrors) errors.dob = base.dob;
  if (base.state && showErrors) errors.state = base.state;

  return errors;
}
