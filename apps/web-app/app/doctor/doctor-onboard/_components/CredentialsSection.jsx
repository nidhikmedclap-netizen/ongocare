// Section 2 — sign-in credentials (email + password with show/hide).
// `showPw` is local state since no other section cares about it.

"use client";

import { useState } from "react";
import styles from "../doctor-onboard.module.css";
import Section from "./Section";
import Field from "./Field";
import {
  sanitizeEmail,
  EMAIL_LIMIT,
  PASSWORD_MAX,
} from "@/app/weightloss-onboard/utils";

export default function CredentialsSection({
  values,
  update,
  pwHint,
  showErrors = false,
  fieldErrors = {},
}) {
  const [showPw, setShowPw] = useState(false);
  const emailError = showErrors ? fieldErrors.email : "";
  const passwordError = showErrors ? fieldErrors.password : "";

  return (
    <Section number="2" title="Sign-in credentials">
      <Field
        label="Work email"
        required
        hint={emailError || undefined}
        hintTone={emailError ? "warn" : undefined}
      >
        <input
          className={styles.input}
          type="email"
          autoComplete="email"
          maxLength={EMAIL_LIMIT}
          value={values.email}
          onChange={(e) => update("email", sanitizeEmail(e.target.value))}
          placeholder="vanessa@your-clinic.com"
        />
      </Field>
      <Field
        label="Password"
        required
        hint={
          passwordError ||
          pwHint ||
          "At least 8 characters with one letter and one number."
        }
        hintTone={passwordError || pwHint ? "warn" : "muted"}
      >
        <div className={styles.pwWrap}>
          <input
            className={styles.input}
            type={showPw ? "text" : "password"}
            autoComplete="new-password"
            maxLength={PASSWORD_MAX}
            value={values.password}
            onChange={(e) =>
              update("password", e.target.value.slice(0, PASSWORD_MAX))
            }
            placeholder="••••••••"
          />
          <button
            type="button"
            className={styles.pwToggle}
            onClick={() => setShowPw((s) => !s)}
            aria-label={showPw ? "Hide password" : "Show password"}
          >
            {showPw ? "Hide" : "Show"}
          </button>
        </div>
      </Field>
    </Section>
  );
}
