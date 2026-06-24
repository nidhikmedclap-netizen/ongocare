// app/doctor/doctor-onboard/_lib/validation.js
//
// Pure predicates over the doctor-registration form values. The form hook
// memoizes these; sections read derived flags (e.g. routingValid) to show
// inline hints.

import { PHONE_INVALID_MESSAGE } from "@/lib/phone/usPhone";
import {
  isValidEmail,
  isValidLicenseNumber,
  isValidName,
  isValidPhone,
  licenseStateKey,
  licenseStateTypeDuplicateMessage,
  licenseStateTypeKey,
  passwordValidationMessage,
} from "@/app/weightloss-onboard/utils";

const ROUTING_RE = /^\d{9}$/;
const ACCOUNT_RE = /^\d{6,17}$/;
const BIO_MIN_LENGTH = 30;
const BANK_NAME_MIN_LENGTH = 2;

export const DOCTOR_FIELD_MESSAGES = {
  firstName: "First name must be at least 2 characters.",
  lastName: "Last name must be at least 2 characters.",
  emailRequired: "Email is required.",
  emailInvalid: "Please enter a valid email address.",
  passwordRequired: "Password is required.",
  phone: PHONE_INVALID_MESSAGE,
  bio: `Professional bio must be at least ${BIO_MIN_LENGTH} characters.`,
  licenseState: "Select a state.",
  licenseNumber: "Enter a valid license number (letters, digits, and hyphens only).",
  licenseNumberDuplicate: "This license number is already used for this state on this form.",
  availability: "Add at least one available day with valid hours.",
  accountHolder: "Account holder name is required.",
  bankName: "Bank name is required.",
  routingNumber: "Routing must be exactly 9 digits.",
  accountNumber: "Account number should be 6–17 digits.",
  consent: "You must agree to continue.",
};

export function licensesValid(licenses) {
  if (!licenses.every(
    (l) => l.state && isValidLicenseNumber(l.licenseNumber),
  )) {
    return false;
  }
  const seenNumbers = new Set();
  const seenStateTypes = new Set();
  for (const l of licenses) {
    const numberKey = licenseStateKey(l.state, l.licenseNumber);
    if (seenNumbers.has(numberKey)) return false;
    seenNumbers.add(numberKey);

    const stateTypeKey = licenseStateTypeKey(l.state, l.licenseType);
    if (!stateTypeKey) return false;
    if (seenStateTypes.has(stateTypeKey)) return false;
    seenStateTypes.add(stateTypeKey);
  }
  return true;
}

export function availabilityValid(availability) {
  return Object.values(availability).some((d) =>
    Array.isArray(d.ranges) &&
    d.ranges.some((r) => r.start && r.end && r.start < r.end),
  );
}

export function routingValid(routingNumber) {
  return ROUTING_RE.test(routingNumber);
}

export function accountValid(accountNumber) {
  return ACCOUNT_RE.test(accountNumber.replace(/\s/g, ""));
}

export function bankingValid(banking) {
  return (
    isValidName(banking.accountHolder) &&
    banking.bankName.trim().length >= BANK_NAME_MIN_LENGTH &&
    routingValid(banking.routingNumber) &&
    accountValid(banking.accountNumber)
  );
}

export function formIsSubmittable(form) {
  return Object.keys(doctorFieldErrors(form)).length === 0;
}

/** Per-field messages for inline errors after a submit attempt. */
export function doctorFieldErrors(form) {
  const errors = {};

  if (!isValidName(form.firstName)) errors.firstName = DOCTOR_FIELD_MESSAGES.firstName;
  if (!isValidName(form.lastName)) errors.lastName = DOCTOR_FIELD_MESSAGES.lastName;

  const email = String(form.email || "").trim();
  if (!email) errors.email = DOCTOR_FIELD_MESSAGES.emailRequired;
  else if (!isValidEmail(email)) errors.email = DOCTOR_FIELD_MESSAGES.emailInvalid;

  if (!form.password) {
    errors.password = DOCTOR_FIELD_MESSAGES.passwordRequired;
  } else {
    const pwMsg = passwordValidationMessage(form.password);
    if (pwMsg) errors.password = pwMsg;
  }

  if (!isValidPhone(form.phone)) errors.phone = DOCTOR_FIELD_MESSAGES.phone;
  if (form.bio.trim().length < BIO_MIN_LENGTH) errors.bio = DOCTOR_FIELD_MESSAGES.bio;

  form.licenses.forEach((lic, i) => {
    if (!lic.state) errors[`licenseState_${i}`] = DOCTOR_FIELD_MESSAGES.licenseState;
    if (!isValidLicenseNumber(lic.licenseNumber)) {
      errors[`licenseNumber_${i}`] = DOCTOR_FIELD_MESSAGES.licenseNumber;
    }
  });

  const licenseIndexByKey = new Map();
  form.licenses.forEach((lic, i) => {
    if (!lic.state || !isValidLicenseNumber(lic.licenseNumber)) return;
    const key = licenseStateKey(lic.state, lic.licenseNumber);
    if (licenseIndexByKey.has(key)) {
      const first = licenseIndexByKey.get(key);
      errors[`licenseNumber_${first}`] = DOCTOR_FIELD_MESSAGES.licenseNumberDuplicate;
      errors[`licenseNumber_${i}`] = DOCTOR_FIELD_MESSAGES.licenseNumberDuplicate;
    } else {
      licenseIndexByKey.set(key, i);
    }
  });

  const licenseIndexByStateType = new Map();
  form.licenses.forEach((lic, i) => {
    if (!lic.state) return;
    const key = licenseStateTypeKey(lic.state, lic.licenseType);
    if (!key) return;
    const message = licenseStateTypeDuplicateMessage(lic.state, lic.licenseType);
    if (licenseIndexByStateType.has(key)) {
      const first = licenseIndexByStateType.get(key);
      errors[`licenseState_${first}`] = message;
      errors[`licenseState_${i}`] = message;
    } else {
      licenseIndexByStateType.set(key, i);
    }
  });

  if (!availabilityValid(form.availability)) {
    errors.availability = DOCTOR_FIELD_MESSAGES.availability;
  }
  if (!isValidName(form.banking.accountHolder)) {
    errors.accountHolder = DOCTOR_FIELD_MESSAGES.accountHolder;
  }
  if (form.banking.bankName.trim().length < BANK_NAME_MIN_LENGTH) {
    errors.bankName = DOCTOR_FIELD_MESSAGES.bankName;
  }
  if (!routingValid(form.banking.routingNumber)) {
    errors.routingNumber = DOCTOR_FIELD_MESSAGES.routingNumber;
  }
  if (!accountValid(form.banking.accountNumber)) {
    errors.accountNumber = DOCTOR_FIELD_MESSAGES.accountNumber;
  }
  if (!form.consent) errors.consent = DOCTOR_FIELD_MESSAGES.consent;

  return errors;
}

/** Profile fields only — used by super-admin doctor edit (no auth/consent). */
export function doctorProfileFieldErrors(form) {
  const errors = doctorFieldErrors(form);
  delete errors.email;
  delete errors.password;
  delete errors.consent;
  return errors;
}

export function doctorProfileFormIsValid(form) {
  return Object.keys(doctorProfileFieldErrors(form)).length === 0;
}
