"use client";

import { useState } from "react";
import { useOnboard, useScreenContent } from "./OnboardContext";
import { ALLOWED_IMAGE_ACCEPT, validateImageUpload } from "./constants";

const s7eDefaults = {
  question: "Upload your photo ID",
  subtitle:
    "A government-issued ID (driver's license, passport, or state ID) helps verify your identity.",
  tip1: "Clearly shows your entire ID",
  tip2: "Not cropped, blurry, or dark",
  tip3: "Only your healthcare team will see this",
  selectLabel: "📁 Select photo",
  takeLabel: "📷 Take photo",
  ctaLabel: "Continue",
  uploadingLabel: "Uploading…",
};

export default function S7eIdentity() {
  const {
    form,
    goTo,
    uploadError,
    setUploadError,
    uploadPatientDocument,
  } = useOnboard();
  const c = useScreenContent("s7e", s7eDefaults);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file) => {
    if (!file) return;
    const err = validateImageUpload(file);
    if (err) {
      setUploadError(err);
      return;
    }
    setUploadError("");
    setUploading(true);
    const ok = await uploadPatientDocument("photoId", file);
    setUploading(false);
    if (!ok) {
      setUploadError((prev) => prev || "Could not upload your ID photo.");
    }
  };

  return (
    <div className="sc">
      <div className="q">{c.question}</div>
      <div className="qs">{c.subtitle}</div>

      <div className="id-card">
        <div className="id-card-illus" aria-hidden>
          <svg viewBox="0 0 64 48" width="56" height="42" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="2" width="60" height="44" rx="6" stroke="currentColor" strokeWidth="2.5" />
            <circle cx="18" cy="22" r="6" stroke="currentColor" strokeWidth="2.5" />
            <path d="M10 38c1.5-4 4.5-6 8-6s6.5 2 8 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="34" y1="16" x2="56" y2="16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="34" y1="24" x2="56" y2="24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="34" y1="32" x2="48" y2="32" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>
        <div className="id-card-tips">
          <div className="id-tip">
            <span className="id-tip-icon">✓</span>
            <span>{c.tip1}</span>
          </div>
          <div className="id-tip">
            <span className="id-tip-icon">✓</span>
            <span>{c.tip2}</span>
          </div>
          <div className="id-tip">
            <span className="id-tip-icon">🔒</span>
            <span>{c.tip3}</span>
          </div>
        </div>
      </div>

      {form.photoIdName && (
        <div className="upload-name">✓ {form.photoIdName}</div>
      )}
      {uploadError && <div className="field-err">{uploadError}</div>}

      <div className="id-actions">
        <label className="cta2 id-btn">
          {uploading ? c.uploadingLabel : c.selectLabel}
          <input
            type="file"
            accept={ALLOWED_IMAGE_ACCEPT}
            disabled={uploading}
            style={{ display: "none" }}
            onChange={(event) => {
              void handleFile(event.target.files?.[0]);
            }}
          />
        </label>
        <label className="cta2 id-btn id-btn-primary">
          {uploading ? c.uploadingLabel : c.takeLabel}
          <input
            type="file"
            accept={ALLOWED_IMAGE_ACCEPT}
            capture="environment"
            disabled={uploading}
            style={{ display: "none" }}
            onChange={(event) => {
              void handleFile(event.target.files?.[0]);
            }}
          />
        </label>
      </div>
      <button
        type="button"
        className="cta"
        disabled={!form.photoIdPath || uploading}
        onClick={() => goTo("s9")}
      >
        {c.ctaLabel}
      </button>
    </div>
  );
}
