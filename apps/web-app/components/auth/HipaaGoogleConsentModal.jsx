// components/auth/HipaaGoogleConsentModal.jsx
//
// HIPAA consent gate shown after Google sign-in (patient login + onboarding).

"use client";

import Link from "next/link";
import styles from "./HipaaGoogleConsentModal.module.css";

export default function HipaaGoogleConsentModal({
  open,
  submitting = false,
  error = "",
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div
      className={styles.backdrop}
      role="presentation"
      onClick={submitting ? undefined : onCancel}
    >
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="hipaa-google-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="hipaa-google-title" className={styles.title}>
          HIPAA authorization required
        </h2>
        <p className={styles.body}>
          Before we can set up your patient account, you must agree to our HIPAA
          authorization. This lets us securely store and use your health
          information for your care.
        </p>
        <p className={styles.consent}>
          I agree to the{" "}
          <Link href="/hipaa" className={styles.link} target="_blank">
            HIPAA Authorization
          </Link>
          .
        </p>

        {error && (
          <div className={styles.error} role="alert">
            {error}
          </div>
        )}

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.cancel}
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className={styles.confirm}
            onClick={onConfirm}
            disabled={submitting}
          >
            {submitting ? "Saving…" : "I agree — continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
