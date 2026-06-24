"use client";

import { Multi, Radio } from "../components";
import {
  NO_YES,
  NO_YES_UNSURE,
  SAFETY_TREATMENTS,
  SEX_OPTIONS,
} from "../data";
import { useOnboard, useScreenContent } from "./OnboardContext";

const s12Defaults = {
  question: "Are you currently dealing with any of the following?",
  subtitle: "Select all that apply.",
  options: SAFETY_TREATMENTS,
  ctaLabel: "Continue",
};

export function S12() {
  const { form, toggleWithNone, goTo } = useOnboard();
  const c = useScreenContent("s12", s12Defaults);

  return (
    <div className="sc">
      <div className="q">{c.question}</div>
      <div className="qs">{c.subtitle}</div>
      <Multi
        options={c.options}
        values={form.s12}
        onToggle={(value) => toggleWithNone("s12", value, "None")}
      />
      <button
        type="button"
        className="cta"
        disabled={form.s12.length === 0}
        onClick={() => goTo("s13")}
      >
        {c.ctaLabel}
      </button>
    </div>
  );
}

const s13Defaults = {
  question:
    "Have you or a close family member had medullary thyroid cancer or MEN2 syndrome?",
  options: NO_YES_UNSURE,
  ctaLabel: "Continue",
};

export function S13() {
  const { form, updateField, goTo, submitMauticOnComplete } = useOnboard();
  const c = useScreenContent("s13", s13Defaults);

  return (
    <div className="sc">
      <div className="q">{c.question}</div>
      <Radio
        options={c.options}
        value={form.s13}
        onSelect={(value) => updateField("s13", value)}
      />
      <button
        type="button"
        className="cta"
        disabled={!form.s13}
        onClick={() => {
          if (form.s13 === "Yes") {
            submitMauticOnComplete({}, "dHard");
            goTo("dHard");
          } else {
            goTo("s13a");
          }
        }}
      >
        {c.ctaLabel}
      </button>
    </div>
  );
}

const s13aDefaults = {
  question: "What was your sex assigned at birth?",
  options: SEX_OPTIONS,
  ctaLabel: "Continue",
};

export function S13a() {
  const { form, updateField, goTo } = useOnboard();
  const c = useScreenContent("s13a", s13aDefaults);

  return (
    <div className="sc">
      <div className="q">{c.question}</div>
      <Radio
        options={c.options}
        value={form.sexAtBirth}
        onSelect={(value) => updateField("sexAtBirth", value)}
      />
      <button
        type="button"
        className="cta"
        disabled={!form.sexAtBirth}
        onClick={() =>
          goTo(form.sexAtBirth === "Male" ? "s15" : "s14")
        }
      >
        {c.ctaLabel}
      </button>
    </div>
  );
}

const s14Defaults = {
  question: "Are you pregnant, planning to become pregnant, or breastfeeding?",
  options: NO_YES,
  ctaLabel: "Continue",
};

export function S14() {
  const { form, updateField, goTo } = useOnboard();
  const c = useScreenContent("s14", s14Defaults);

  return (
    <div className="sc">
      <div className="q">{c.question}</div>
      <Radio
        options={c.options}
        value={form.s14}
        onSelect={(value) => updateField("s14", value)}
      />
      <button
        type="button"
        className="cta"
        disabled={!form.s14}
        onClick={() => goTo(form.s14 === "Yes" ? "s14b" : "s15")}
      >
        {c.ctaLabel}
      </button>
    </div>
  );
}

const s14bDefaults = {
  question:
    "By selecting “I Understand” you understand that any prescribed treatment must be discontinued prior to attempting pregnancy, becoming pregnant, or upon beginning breastfeeding.",
  consentLabel: "I understand",
  ctaLabel: "Continue",
};

export function S14b() {
  const { form, updateField, goTo } = useOnboard();
  const c = useScreenContent("s14b", s14bDefaults);

  return (
    <div className="sc">
      <div className="q consent-warn">
        {c.question}
      </div>
      <div className="opts" style={{ gap: 7 }}>
        <label
          className={`opt consent ${form.pregnancyConsent ? "sel" : ""}`}
          onClick={() =>
            updateField("pregnancyConsent", !form.pregnancyConsent)
          }
        >
          <span className="chk">✓</span>
          <span className="consent-text">{c.consentLabel}</span>
        </label>
      </div>
      <button
        type="button"
        className="cta"
        disabled={!form.pregnancyConsent}
        onClick={() => goTo("s15")}
      >
        {c.ctaLabel}
      </button>
    </div>
  );
}

const s15Defaults = {
  question: "Have you ever had pancreatitis?",
  options: NO_YES,
  ctaLabel: "Continue",
};

export function S15() {
  const { form, updateField, goTo, submitMauticOnComplete } = useOnboard();
  const c = useScreenContent("s15", s15Defaults);

  return (
    <div className="sc">
      <div className="q">{c.question}</div>
      <Radio
        options={c.options}
        value={form.s15}
        onSelect={(value) => updateField("s15", value)}
      />
      <button
        type="button"
        className="cta"
        disabled={!form.s15}
        onClick={() => {
          if (form.s15 === "Yes") {
            submitMauticOnComplete({}, "dHard");
            goTo("dHard");
          } else {
            goTo("s16");
          }
        }}
      >
        {c.ctaLabel}
      </button>
    </div>
  );
}
