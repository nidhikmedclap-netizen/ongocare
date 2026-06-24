"use client";

import { useMemo, useState } from "react";
import { ETHNICITIES } from "../data";
import { US_STATES } from "@/data/usStates";
import {
  PHONE_DISPLAY_PLACEHOLDER,
  PHONE_INVALID_MESSAGE,
  sanitizePhoneInput,
} from "@/lib/phone/usPhone";
import {
  isValidEmail,
  passwordValidationMessage,
  sanitizeAddress,
  sanitizeEmail,
  sanitizeFreeText,
  sanitizeName,
  sanitizeZip,
  ADDRESS_LIMIT,
  EMAIL_LIMIT,
  NAME_LIMIT,
  NOTES_LIMIT,
  PHARMACY_LIMIT,
} from "../utils";
import { Radio } from "../components";
import PasswordField from "@/components/PasswordField";
import { useOnboard, useScreenContent } from "./OnboardContext";
import { patientProfileDisplayErrors } from "../_lib/patientProfileValidation";
import { toastFormInvalid } from "@/lib/ui/notify";

const s19Defaults = {
  question: "What is your ethnicity?",
  subtitle: "Select one option. We ask this to better tailor treatment options to you.",
  options: ETHNICITIES,
  ctaLabel: "Continue",
};

export function S19() {
  const { form, updateField, goTo } = useOnboard();
  const c = useScreenContent("s19", s19Defaults);

  return (
    <div className="sc">
      <div className="q">{c.question}</div>
      <div className="qs">
        {c.subtitle}
      </div>
      <Radio
        options={c.options}
        value={form.s19[0] || ""}
        onSelect={(value) => updateField("s19", value ? [value] : [])}
      />
      <button
        type="button"
        className="cta"
        disabled={form.s19.length === 0}
        // Profile (s21) is captured earlier in the flow now (right after the
        // email/password screen), so after ethnicity we jump straight to s22
        // (address).
        onClick={() => goTo("s22")}
      >
        {c.ctaLabel}
      </button>
    </div>
  );
}

const s20Defaults = {
  question: "Find the right treatment for you",
  subtitle:
    "Enter your email and create a password. You'll use these to sign in to your dashboard later.",
  emailPlaceholder: "Email",
  passwordPlaceholder: "Password",
  emailInvalid: "Please enter a valid email address.",
  consentHipaaText: "I agree to the",
  consentHipaaLink: "HIPAA Authorization",
  consentTelehealthPrefix: "I agree to the",
  consentTelehealthLink: "Telehealth Consent",
  consentTermsLink: "Terms of Use",
  consentPrivacyLink: "Privacy Policy",
  consentJoiner: ", ",
  consentLastJoiner: " and ",
  consentHipaaRequired: "Please accept the HIPAA authorization.",
  ctaLabel: "Continue",
  ctaSaving: "Saving...",
  orLabel: "OR",
  googleLabel: "Continue with Google",
  goToSignIn: "Go to sign in →",
  wrongRoleBanner:
    "You're signed in with an admin or doctor account. Sign out before creating a patient account.",
};

export function S20Email() {
  const {
    form,
    updateField,
    goTo,
    emailScreenIsValid,
    submitMauticOnEmailCapture,
    submitGoogleOnEmailCapture,
    captureError,
    captureErrorKind,
    isCapturing,
    signedInWrongRole,
  } = useOnboard();
  const c = useScreenContent("s20", s20Defaults);
  const [showErrors, setShowErrors] = useState(false);

  const passwordHint = passwordValidationMessage(form.password);
  const emailError =
    (showErrors || form.email.length > 0) && !isValidEmail(form.email)
      ? form.email.trim()
        ? c.emailInvalid
        : showErrors
          ? "Email is required."
          : ""
      : "";
  const passwordError =
    showErrors && !form.password
      ? "Password is required."
      : passwordHint || "";
  const consentError =
    showErrors && !form.consentH ? c.consentHipaaRequired : "";

  return (
    <div className="sc">
      <div className="q">{c.question}</div>
      <div className="qs">
        {c.subtitle}
      </div>
      <input
        className="inp"
        type="email"
        placeholder={c.emailPlaceholder}
        autoComplete="email"
        maxLength={EMAIL_LIMIT}
        value={form.email}
        onChange={(event) => updateField("email", sanitizeEmail(event.target.value))}
      />
      {emailError && (
        <div className="field-err">
          {emailError}
        </div>
      )}
      <PasswordField
        className="inp"
        placeholder={c.passwordPlaceholder}
        autoComplete="new-password"
        maxLength={64}
        value={form.password}
        onChange={(event) => updateField("password", event.target.value.slice(0, 64))}
      />
      {passwordError && (
        <div className="field-err">{passwordError}</div>
      )}
      <div className="opts" style={{ gap: 7 }}>
        <label
          className={`opt consent ${form.consentH ? "sel" : ""}`}
          onClick={() => updateField("consentH", !form.consentH)}
        >
          <span className="chk">✓</span>
          <span className="consent-text">
            {c.consentHipaaText}{" "}
            <a href="/hipaa" target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
              {c.consentHipaaLink}
            </a>
          </span>
        </label>
        <label
          className={`opt consent ${form.consentT ? "sel" : ""}`}
          onClick={() => updateField("consentT", !form.consentT)}
        >
          <span className="chk">✓</span>
          <span className="consent-text">
            {c.consentTelehealthPrefix}{" "}
            <a href="/terms" target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
              {c.consentTelehealthLink}
            </a>
            {c.consentJoiner}
            <a href="/terms" target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
              {c.consentTermsLink}
            </a>
            {c.consentLastJoiner}
            <a href="/privacy" target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
              {c.consentPrivacyLink}
            </a>
          </span>
        </label>
      </div>
      {consentError && <div className="field-err">{consentError}</div>}
      {signedInWrongRole && (
        <div className="field-err" role="alert" style={{ marginTop: 10 }}>
          {c.wrongRoleBanner}
        </div>
      )}
      {captureError && !signedInWrongRole && (
        <div className="field-err" role="alert">
          {captureError}
          {captureErrorKind === "EMAIL_ALREADY_REGISTERED" && (
            <>
              {" "}
              <a
                href="/login"
                style={{
                  color: "inherit",
                  textDecoration: "underline",
                  fontWeight: 600,
                }}
              >
                {c.goToSignIn}
              </a>
            </>
          )}
        </div>
      )}
      <div className="sc-footer">
        <button
          type="button"
          className="cta"
          disabled={isCapturing || signedInWrongRole}
          onClick={async () => {
            setShowErrors(true);
            if (signedInWrongRole || !emailScreenIsValid) {
              if (!signedInWrongRole && !emailScreenIsValid) toastFormInvalid();
              return;
            }
            const ok = await submitMauticOnEmailCapture();
            if (ok) {
              // Stay in the onboarding flow — profile (s21) is next, not the dashboard.
              goTo("s21");
            }
          }}
        >
          {isCapturing ? c.ctaSaving : c.ctaLabel}
        </button>
        <div className="or-row">
          <div className="line" />
          <span className="or">{c.orLabel}</span>
          <div className="line" />
        </div>
        <button
          type="button"
          className="cta2 google-btn"
          disabled={isCapturing || signedInWrongRole}
          onClick={async () => {
            if (signedInWrongRole) return;
            await submitGoogleOnEmailCapture();
          }}
        >
          <svg width="15" height="15" viewBox="0 0 48 48" aria-hidden>
            <path
              fill="#EA4335"
              d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
            />
            <path
              fill="#4285F4"
              d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
            />
            <path
              fill="#FBBC05"
              d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
            />
            <path
              fill="#34A853"
              d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
            />
          </svg>
          {isCapturing ? c.ctaSaving : c.googleLabel}
        </button>
      </div>
    </div>
  );
}

const s21Defaults = {
  question: "Complete your profile",
  subtitle:
    "Your healthcare team will need this for treatment and prescriptions.",
  firstNamePlaceholder: "First name",
  lastNamePlaceholder: "Last name",
  firstNameInvalid: "First name must be at least 2 characters.",
  lastNameInvalid: "Last name must be at least 2 characters.",
  dobLabel: "Date of birth",
  zipPlaceholder: "ZIP code",
  // Accepts both ZIP (12345) and ZIP+4 (12345-6789) per USPS format.
  zipInvalid: "Enter a valid US ZIP code (5 digits or 5+4, e.g. 90210 or 90210-1234).",
  statePlaceholder: "Select state",
  stateInvalid: "Please select your state.",
  phonePlaceholder: PHONE_DISPLAY_PLACEHOLDER,
  phoneInvalid: PHONE_INVALID_MESSAGE,
  addressPlaceholder: "Street address",
  addressInvalid: "Please enter your street address.",
  ctaLabel: "Continue",
};

export function S21() {
  const { form, updateField, goTo, maxDobDate, profileScreenIsValid } = useOnboard();
  const c = useScreenContent("s21", s21Defaults);
  const [showErrors, setShowErrors] = useState(false);

  const messages = useMemo(
    () => ({
      firstName: c.firstNameInvalid,
      lastName: c.lastNameInvalid,
      zipInvalid: c.zipInvalid,
      stateRequired: c.stateInvalid,
      phone: c.phoneInvalid,
      addressInvalid: c.addressInvalid,
    }),
    [c],
  );

  const fieldErrors = useMemo(
    () =>
      patientProfileDisplayErrors(form, {
        showErrors,
        messages,
        requireState: true,
      }),
    [form, showErrors, messages],
  );

  return (
    <div className="sc">
      <div className="q">{c.question}</div>
      <div className="qs">
        {c.subtitle}
      </div>
      <div className="r2">
        <input
          className="inp"
          style={{ margin: 0 }}
          type="text"
          autoComplete="given-name"
          maxLength={NAME_LIMIT}
          placeholder={c.firstNamePlaceholder}
          value={form.firstName}
          onChange={(event) => updateField("firstName", sanitizeName(event.target.value))}
        />
        <input
          className="inp"
          style={{ margin: 0 }}
          type="text"
          autoComplete="family-name"
          maxLength={NAME_LIMIT}
          placeholder={c.lastNamePlaceholder}
          value={form.lastName}
          onChange={(event) => updateField("lastName", sanitizeName(event.target.value))}
        />
      </div>
      {fieldErrors.firstName && (
        <div className="field-err">
          {fieldErrors.firstName}
        </div>
      )}
      {fieldErrors.lastName && (
        <div className="field-err">
          {fieldErrors.lastName}
        </div>
      )}
      <div className="r2" style={{ marginTop: 8 }}>
        <input
          className="inp"
          style={{ margin: 0 }}
          type="date"
          max={maxDobDate}
          aria-label={c.dobLabel}
          title={c.dobLabel}
          value={form.dob}
          onChange={(event) => updateField("dob", event.target.value)}
        />
        <input
          className="inp"
          style={{ margin: 0 }}
          type="text"
          inputMode="numeric"
          autoComplete="postal-code"
          placeholder={c.zipPlaceholder}
          // 5-digit OR ZIP+4 ("12345-6789") → up to 10 chars including hyphen.
          // sanitizeZip strips non-digits and auto-inserts the hyphen.
          maxLength={10}
          value={form.zip}
          onChange={(event) => updateField("zip", sanitizeZip(event.target.value))}
        />
      </div>
      {fieldErrors.dob && (
        <div className="field-err">
          {fieldErrors.dob}
        </div>
      )}
      {fieldErrors.zip && <div className="field-err">{fieldErrors.zip}</div>}
      {/*
        State is an independent field. We used to derive it from the ZIP via
        a lookup library, but ZIP→state is occasionally wrong near borders
        and prevents patients from explicitly picking the state where they
        want to receive care. The doctor list is filtered by THIS field
        only — the ZIP is for shipping / prescriptions, not matching.
      */}
      <select
        className="inp"
        style={{ marginTop: 8 }}
        value={form.state}
        onChange={(event) => updateField("state", event.target.value)}
        aria-label="State"
      >
        <option value="">{c.statePlaceholder}</option>
        {US_STATES.map((s) => (
          <option key={s.code} value={s.code}>
            {s.name}
          </option>
        ))}
      </select>
      {fieldErrors.state && <div className="field-err">{fieldErrors.state}</div>}
      <input
        className="inp"
        type="tel"
        inputMode="numeric"
        autoComplete="tel"
        placeholder={c.phonePlaceholder}
        maxLength={17}
        value={form.phone}
        onChange={(event) => updateField("phone", sanitizePhoneInput(event.target.value))}
      />
      {fieldErrors.phone && (
        <div className="field-err" style={{ marginTop: 6 }}>
          {fieldErrors.phone}
        </div>
      )}
      <input
        className="inp"
        type="text"
        autoComplete="street-address"
        maxLength={ADDRESS_LIMIT}
        placeholder={c.addressPlaceholder}
        value={form.address}
        onChange={(event) => updateField("address", sanitizeAddress(event.target.value))}
      />
      {fieldErrors.address && <div className="field-err">{fieldErrors.address}</div>}
      <button
        type="button"
        className="cta"
        onClick={() => {
          setShowErrors(true);
          if (!profileScreenIsValid) {
            toastFormInvalid();
            return;
          }
          goTo("s3");
        }}
      >
        {c.ctaLabel}
      </button>
    </div>
  );
}

const s22Defaults = {
  medsQuestion: "Are you currently taking any medications or supplements?",
  medsSubtitle: "Include all prescriptions, OTC medications, and supplements.",
  medsPlaceholder:
    "e.g. Metformin 500mg, Fish Oil, Aspirin 81mg — or type None",
  allergiesQuestion: "Do you have any allergies?",
  allergiesPlaceholder: "e.g. Penicillin — or type None",
  pharmacyQuestion: "Which pharmacy would you like to use?",
  pharmacyPlaceholder: "e.g. CVS, 123 Main St (optional)",
  ctaLabel: "Continue",
};

export function S22() {
  const { form, updateField, goTo, medsScreenIsValid } = useOnboard();
  const c = useScreenContent("s22", s22Defaults);

  return (
    <div className="sc">
      <div className="q">
        {c.medsQuestion}
      </div>
      <div className="qs">
        {c.medsSubtitle}
      </div>
      <textarea
        className="inp"
        maxLength={NOTES_LIMIT}
        placeholder={c.medsPlaceholder}
        value={form.meds}
        onChange={(event) => updateField("meds", sanitizeFreeText(event.target.value, NOTES_LIMIT))}
      />
      <div className="q" style={{ fontSize: 16, marginBottom: 6 }}>
        {c.allergiesQuestion}
      </div>
      <input
        className="inp"
        type="text"
        maxLength={NOTES_LIMIT}
        placeholder={c.allergiesPlaceholder}
        value={form.allergies}
        onChange={(event) =>
          updateField("allergies", sanitizeFreeText(event.target.value, NOTES_LIMIT))
        }
      />
      <div className="q" style={{ fontSize: 16, marginBottom: 6 }}>
        {c.pharmacyQuestion}
      </div>
      <input
        className="inp"
        type="text"
        maxLength={PHARMACY_LIMIT}
        placeholder={c.pharmacyPlaceholder}
        value={form.pharmacy}
        onChange={(event) =>
          updateField("pharmacy", sanitizeFreeText(event.target.value, PHARMACY_LIMIT))
        }
      />
      <button
        type="button"
        className="cta"
        disabled={!medsScreenIsValid}
        onClick={() => goTo("s22b")}
      >
        {c.ctaLabel}
      </button>
    </div>
  );
}
