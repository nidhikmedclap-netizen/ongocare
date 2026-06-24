// Section 7 — optional signature image upload for prescriptions.

"use client";

import styles from "../doctor-onboard.module.css";
import { DOCTOR_IMAGE_ACCEPT } from "../_lib/imageUpload";
import Section from "./Section";
import Field from "./Field";

export default function SignatureSection({
  signatureUploadDataUrl,
  existingSignatureUrl = "",
  signatureFileInputRef,
  onPickSignature,
  clearSignatureUpload,
  uploadInputId = "doctor-signature-upload",
  previewAlign = "inline",
}) {
  const hasUpload = Boolean(signatureUploadDataUrl);
  const previewUrl = signatureUploadDataUrl || existingSignatureUrl;
  const showPreview = Boolean(previewUrl);
  const previewLabel = hasUpload ? "New signature preview" : "Current signature";
  const cornerPreview = previewAlign === "bottom-right";

  return (
    <Section
      number="7"
      title="Signature"
      description="Upload a photo of your signature. It appears on every prescription you issue and is stored securely in your profile."
    >
      <div
        className={`${styles.signaturePanel} ${
          cornerPreview ? styles.signaturePanelCorner : ""
        }`}
      >
        <Field
          label="Upload signature image"
          hint={
            hasUpload
              ? "Signature image ready — it will appear on prescriptions."
              : "Optional — JPG, PNG, or iPhone HEIC on white paper, up to 2 MB. You can add this later."
          }
        >
          <div
            className={
              cornerPreview ? styles.signatureUploadStack : styles.signatureUploadRow
            }
          >
            {!cornerPreview && hasUpload ? (
              <div className={styles.signaturePreview}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={signatureUploadDataUrl} alt="Uploaded signature preview" />
              </div>
            ) : null}
            <div className={styles.signatureUploadActions}>
              <input
                ref={signatureFileInputRef}
                type="file"
                accept={DOCTOR_IMAGE_ACCEPT}
                onChange={onPickSignature}
                style={{ display: "none" }}
                id={uploadInputId}
              />
              <label htmlFor={uploadInputId} className={styles.photoBtn}>
                {hasUpload ? "Choose a different image" : "Upload signature photo"}
              </label>
              {hasUpload ? (
                <button
                  type="button"
                  className={styles.photoRemove}
                  onClick={clearSignatureUpload}
                >
                  Remove upload
                </button>
              ) : null}
            </div>
          </div>
        </Field>
        {cornerPreview && showPreview ? (
          <div className={styles.signaturePreviewCorner}>
            <span className={styles.signaturePreviewLabel}>{previewLabel}</span>
            <div className={styles.signaturePreview}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt={previewLabel} />
            </div>
          </div>
        ) : null}
      </div>
    </Section>
  );
}
