"use client";

import { useMemo, useState } from "react";
import { Radio } from "../components";
import { glpLastInjectionDateError, glpLastInjectionMinDate } from "../utils";
import {
  GLP_EXPERIENCE,
  GLP_MEDICATIONS,
  MEDICATION_DOSES,
  YES_NO,
} from "../data";
import { useOnboard, useScreenContent } from "./OnboardContext";
import { ALLOWED_IMAGE_ACCEPT, validateImageUpload } from "./constants";

const s7Defaults = {
  question:
    "Have you taken any GLP-1 medications before or are you taking one now?",
  options: YES_NO,
  ctaLabel: "Continue",
};

export function S7() {
  const { form, updateField, goTo } = useOnboard();
  const c = useScreenContent("s7", s7Defaults);

  return (
    <div className="sc">
      <div className="q">{c.question}</div>
      <Radio
        options={c.options}
        value={form.s7}
        onSelect={(value) => updateField("s7", value)}
      />
      <button
        type="button"
        className="cta"
        disabled={!form.s7}
        onClick={() => goTo(form.s7 === "Yes" ? "s7m" : "s7e")}
      >
        {c.ctaLabel}
      </button>
    </div>
  );
}

const s7mDefaults = {
  question: "Which GLP-1 medication have you used or currently using?",
  options: GLP_MEDICATIONS,
  ctaLabel: "Continue",
};

export function S7m() {
  const { form, updateField, goTo } = useOnboard();
  const c = useScreenContent("s7m", s7mDefaults);

  return (
    <div className="sc">
      <div className="q">{c.question}</div>
      <Radio
        options={c.options}
        value={form.glpMed}
        onSelect={(value) => {
          if (value !== form.glpMed) updateField("glpDose", "");
          updateField("glpMed", value);
        }}
      />
      <button
        type="button"
        className="cta"
        disabled={!form.glpMed}
        onClick={() => goTo("s7b")}
      >
        {c.ctaLabel}
      </button>
    </div>
  );
}

const s7bDefaults = {
  // `{med}` is substituted at render time with the selected medication name.
  questionTemplate: "What dose of {med} are you taking or have you taken?",
  detailsLabel:
    "Please share how many units of medication you are drawing up with each injection, and how often you inject.",
  detailsPlaceholder: "Please specify",
  ctaLabel: "Continue",
};

export function S7b() {
  const { form, updateField, goTo } = useOnboard();
  const c = useScreenContent("s7b", s7bDefaults);

  return (
    <div className="sc">
      <div className="q">
        {(c.questionTemplate ?? "").replace("{med}", form.glpMed || "")}
      </div>
      <Radio
        options={MEDICATION_DOSES[form.glpMed] ?? []}
        value={form.glpDose}
        onSelect={(value) => updateField("glpDose", value)}
      />
      <div className="qs">
        {c.detailsLabel}
      </div>
      <textarea
        className="inp"
        maxLength={500}
        placeholder={c.detailsPlaceholder}
        value={form.glpDoseDetails ?? ""}
        onChange={(event) =>
          updateField("glpDoseDetails", event.target.value.replace(/\s{3,}/g, "  ").slice(0, 500))
        }
      />
      <button
        type="button"
        className="cta"
        disabled={!form.glpDose}
        onClick={() => goTo("s7a")}
      >
        {c.ctaLabel}
      </button>
    </div>
  );
}

const s7aDefaults = {
  question: "How was your experience with GLP-1 medications?",
  options: GLP_EXPERIENCE,
  ctaLabel: "Continue",
};

export function S7a() {
  const { form, updateField, goTo } = useOnboard();
  const c = useScreenContent("s7a", s7aDefaults);

  return (
    <div className="sc">
      <div className="q">{c.question}</div>
      <Radio
        options={c.options}
        value={form.glpExperience}
        onSelect={(value) => updateField("glpExperience", value)}
      />
      <button
        type="button"
        className="cta"
        disabled={!form.glpExperience}
        onClick={() => goTo("s7c")}
      >
        {c.ctaLabel}
      </button>
    </div>
  );
}

const s7cDefaults = {
  question: "What was the date of your last injection (Month/Day/Year)?",
  dateLabel: "Last injection date",
  ctaLabel: "Continue",
};

export function S7c() {
  const { form, updateField, goTo, todayDate } = useOnboard();
  const c = useScreenContent("s7c", s7cDefaults);
  const minInjectionDate = useMemo(
    () => glpLastInjectionMinDate(todayDate),
    [todayDate],
  );
  const dateError = glpLastInjectionDateError(form.glpLastInjection, {
    maxDate: todayDate,
    minDate: minInjectionDate,
  });
  const canContinue = !!form.glpLastInjection && !dateError;

  return (
    <div className="sc">
      <div className="q">{c.question}</div>
      <input
        className="inp"
        type="date"
        min={minInjectionDate}
        max={todayDate}
        aria-label={c.dateLabel}
        title={c.dateLabel}
        aria-invalid={!!dateError}
        value={form.glpLastInjection ?? ""}
        onChange={(event) => updateField("glpLastInjection", event.target.value)}
      />
      {dateError && (
        <div className="field-err" role="alert">
          {dateError}
        </div>
      )}
      <button
        type="button"
        className="cta"
        disabled={!canContinue}
        onClick={() => goTo("s7d")}
      >
        {c.ctaLabel}
      </button>
    </div>
  );
}

const s7dDefaults = {
  question:
    "If you have a photo of your current medication or prescription, you can upload it here. Please make sure your name and dosing details are visible.",
  uploadLabel: "⬆ Upload file",
  uploadingLabel: "Uploading…",
  ctaLabel: "Continue",
};

export function S7d() {
  const {
    form,
    goTo,
    uploadError,
    setUploadError,
    uploadPatientDocument,
  } = useOnboard();
  const c = useScreenContent("s7d", s7dDefaults);
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
    const ok = await uploadPatientDocument("vialPhoto", file);
    setUploading(false);
    if (!ok) {
      setUploadError((prev) => prev || "Could not upload your file.");
    }
  };

  return (
    <div className="sc">
      <div className="q" style={{ fontSize: 17, fontWeight: 600 }}>
        {c.question}
      </div>
      <label className="cta2 upload-btn">
        {uploading ? c.uploadingLabel : c.uploadLabel}
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
      {form.vialPhotoName && (
        <div className="upload-name">✓ {form.vialPhotoName}</div>
      )}
      {uploadError && (
        <div className="field-err">{uploadError}</div>
      )}
      <button
        type="button"
        className="cta"
        disabled={uploading}
        onClick={() => goTo("s7e")}
      >
        {c.ctaLabel}
      </button>
    </div>
  );
}
