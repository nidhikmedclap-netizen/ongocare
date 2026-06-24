// lib/auth/loginFieldValidation.js
//
// Shared email/password validation for login forms. Returns per-field
// messages so every required field can show an error on submit.

import { isValidEmail } from "@/app/weightloss-onboard/utils";

export const LOGIN_CREDENTIALS_ERROR = "Wrong email or password.";

export function loginFieldErrors(email, password) {
  const errors = {};
  const trimmed = String(email || "").trim();
  if (!trimmed) {
    errors.email = "Email is required.";
  } else if (!isValidEmail(trimmed)) {
    errors.email = "Please enter a valid email address.";
  }
  if (!password) {
    errors.password = "Password is required.";
  }
  return errors;
}

export function loginFieldsValid(errors) {
  return Object.keys(errors).length === 0;
}
