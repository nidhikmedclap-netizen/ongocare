// components/prescriptions/PrescriptionDocument.jsx
//
// Shared prescription body — text, titration footer, optional signature (bottom right).

"use client";

import { splitPrescriptionText } from "@/lib/prescriptions/splitPrescriptionText";
import styles from "./PrescriptionDocument.module.css";

export default function PrescriptionDocument({ text, signatureUrl, compact = false }) {
  if (!text?.trim()) return null;

  const { body, footer } = splitPrescriptionText(text);
  const wrapClass = compact ? styles.wrapCompact : styles.wrap;

  return (
    <div className={wrapClass}>
      <pre className={styles.body}>{body}</pre>
      {footer ? <pre className={styles.footer}>{footer}</pre> : null}
      {signatureUrl ? (
        <div className={styles.signatureBlock}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={signatureUrl}
            alt="Doctor signature"
            className={styles.signatureImg}
          />
        </div>
      ) : null}
    </div>
  );
}
