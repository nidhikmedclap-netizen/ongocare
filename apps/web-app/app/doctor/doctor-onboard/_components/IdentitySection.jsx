// Section 1 — clinician identity (name, phone). Phone is hidden from
// patients; we collect it for support contact only.

import styles from "../doctor-onboard.module.css";
import Section from "./Section";
import Field from "./Field";
import {
  sanitizePhoneInput,
  PHONE_DISPLAY_PLACEHOLDER,
  PHONE_INVALID_MESSAGE,
  isValidPhone,
} from "@/lib/phone/usPhone";
import { sanitizeName, NAME_LIMIT } from "@/app/weightloss-onboard/utils";

export default function IdentitySection({
  values,
  update,
  showErrors = false,
  fieldErrors = {},
}) {
  return (
    <Section number="1" title="Your details">
      <div className={styles.row2}>
        <Field
          label="First name"
          required
          hint={showErrors && fieldErrors.firstName ? fieldErrors.firstName : undefined}
          hintTone={showErrors && fieldErrors.firstName ? "warn" : undefined}
        >
          <input
            className={styles.input}
            type="text"
            autoComplete="given-name"
            maxLength={NAME_LIMIT}
            value={values.firstName}
            onChange={(e) => update("firstName", sanitizeName(e.target.value))}
            placeholder="Vanessa"
          />
        </Field>
        <Field
          label="Last name"
          required
          hint={showErrors && fieldErrors.lastName ? fieldErrors.lastName : undefined}
          hintTone={showErrors && fieldErrors.lastName ? "warn" : undefined}
        >
          <input
            className={styles.input}
            type="text"
            autoComplete="family-name"
            maxLength={NAME_LIMIT}
            value={values.lastName}
            onChange={(e) => update("lastName", sanitizeName(e.target.value))}
            placeholder="Niles"
          />
        </Field>
      </div>

      <Field
        label="Phone"
        required
        hint={phoneHint(values.phone, showErrors, fieldErrors.phone)}
        hintTone={phoneTone(values.phone, showErrors, fieldErrors.phone)}
      >
        <input
          className={styles.input}
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          maxLength={17}
          value={values.phone}
          onChange={(e) => update("phone", sanitizePhoneInput(e.target.value))}
          placeholder={PHONE_DISPLAY_PLACEHOLDER}
        />
      </Field>
    </Section>
  );
}

function phoneHint(value, showErrors, submitError) {
  if (showErrors && submitError) return submitError;
  if (value.length === 0) return "US number with country code — we never share this with patients.";
  return isValidPhone(value)
    ? "Looks good."
    : PHONE_INVALID_MESSAGE;
}

function phoneTone(value, showErrors, submitError) {
  if (showErrors && submitError) return "warn";
  if (value.length === 0 || isValidPhone(value)) return undefined;
  return "warn";
}
