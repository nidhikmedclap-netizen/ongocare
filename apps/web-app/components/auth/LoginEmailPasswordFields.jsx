// components/auth/LoginEmailPasswordFields.jsx
//
// Email + password inputs with per-field validation errors for login pages.

"use client";

import PasswordField from "@/components/PasswordField";
import { authStyles } from "@/components/auth/AuthShell";
import { EMAIL_LIMIT, PASSWORD_MAX } from "@/app/weightloss-onboard/utils";

export default function LoginEmailPasswordFields({
  email,
  setEmail,
  password,
  setPassword,
  fieldErrors = {},
  emailLabel = "Email",
  emailPlaceholder = "you@example.com",
  onForgotPassword,
  forgotLabel = "Forgot?",
}) {
  return (
    <>
      <label className={authStyles.field}>
        <span className={authStyles.fieldLabel}>{emailLabel}</span>
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`${authStyles.input} ${fieldErrors.email ? authStyles.inputInvalid : ""}`}
          placeholder={emailPlaceholder}
          maxLength={EMAIL_LIMIT}
          aria-invalid={fieldErrors.email ? "true" : undefined}
        />
        {fieldErrors.email && (
          <span className={authStyles.fieldError} role="alert">
            {fieldErrors.email}
          </span>
        )}
      </label>

      <label className={authStyles.field}>
        <span className={authStyles.fieldLabelRow}>
          <span className={authStyles.fieldLabel}>Password</span>
          {onForgotPassword && (
            <button
              type="button"
              onClick={onForgotPassword}
              className={authStyles.forgotBtn}
            >
              {forgotLabel}
            </button>
          )}
        </span>
        <PasswordField
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={`${authStyles.input} ${fieldErrors.password ? authStyles.inputInvalid : ""}`}
          maxLength={PASSWORD_MAX}
          aria-invalid={fieldErrors.password ? "true" : undefined}
        />
        {fieldErrors.password && (
          <span className={authStyles.fieldError} role="alert">
            {fieldErrors.password}
          </span>
        )}
      </label>
    </>
  );
}
