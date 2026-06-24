"use client";

import { Multi } from "../components";
import { OTHER_CONDITIONS, WEIGHT_DIAGNOSES } from "../data";
import { useOnboard, useScreenContent } from "./OnboardContext";

const s10Defaults = {
  question: "Have you been diagnosed with any of these health conditions?",
  subtitle: "Select all that apply.",
  options: WEIGHT_DIAGNOSES,
  ctaLabel: "Continue",
};

export function S10() {
  const { form, toggleWithNone, goTo } = useOnboard();
  const c = useScreenContent("s10", s10Defaults);

  return (
    <div className="sc">
      <div className="q">{c.question}</div>
      <div className="qs">{c.subtitle}</div>
      <Multi
        options={c.options}
        values={form.s10}
        onToggle={(value) =>
          toggleWithNone("s10", value, "None of the above")
        }
      />
      <button
        type="button"
        className="cta"
        disabled={form.s10.length === 0}
        onClick={() => goTo("s11")}
      >
        {c.ctaLabel}
      </button>
    </div>
  );
}

const s11Defaults = {
  question: "Do you have any other health conditions we should know about?",
  subtitle: "Select all that apply.",
  options: OTHER_CONDITIONS,
  otherPlaceholder: "Any other conditions? (optional)",
  ctaLabel: "Continue",
};

export function S11() {
  const { form, updateField, toggleWithNone, goTo } = useOnboard();
  const c = useScreenContent("s11", s11Defaults);

  return (
    <div className="sc">
      <div className="q">{c.question}</div>
      <div className="qs">{c.subtitle}</div>
      <Multi
        options={c.options}
        values={form.s11}
        onToggle={(value) => {
          const removingOther = value === "Other" && form.s11.includes("Other");
          toggleWithNone("s11", value, "None");
          if (value === "None" || removingOther) {
            updateField("s11Other", "");
          }
        }}
      />
      {form.s11.includes("Other") && (
        <input
          className="inp"
          type="text"
          maxLength={200}
          placeholder={c.otherPlaceholder}
          value={form.s11Other}
          onChange={(event) => updateField("s11Other", event.target.value.slice(0, 200))}
        />
      )}
      <button
        type="button"
        className="cta"
        disabled={form.s11.length === 0}
        onClick={() => goTo("s12")}
      >
        {c.ctaLabel}
      </button>
    </div>
  );
}
