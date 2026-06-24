"use client";

import { Multi } from "../components";
import { BARIATRIC_PROCEDURES } from "../data";
import { buildSurgeryListText } from "../utils";
import { useOnboard, useScreenContent } from "./OnboardContext";

const s9Defaults = {
  question: "Have you had any weight loss surgery in the past?",
  subtitle: "Select all that apply.",
  options: BARIATRIC_PROCEDURES,
  ctaLabel: "Continue",
};

export function S9() {
  const { form, toggleWithNone, goTo } = useOnboard();
  const c = useScreenContent("s9", s9Defaults);

  return (
    <div className="sc">
      <div className="q">{c.question}</div>
      <div className="qs">{c.subtitle}</div>
      <Multi
        options={c.options}
        values={form.s9}
        onToggle={(value) =>
          toggleWithNone("s9", value, "None of these")
        }
      />
      <button
        type="button"
        className="cta"
        disabled={form.s9.length === 0}
        onClick={() =>
          goTo(
            form.s9.some((procedure) => procedure !== "None of these")
              ? "s9b"
              : "s10",
          )
        }
      >
        {c.ctaLabel}
      </button>
    </div>
  );
}

const s9bDefaults = {
  // `{list}` substitutes the surgery list, `{word}` is `was`/`were`.
  questionTemplate: "When was your {list} {word}?",
  datePlaceholder: "e.g. March 2022 or 03/15/2020",
  ctaLabel: "Continue",
};

export function S9b() {
  const { form, updateField, goTo } = useOnboard();
  const c = useScreenContent("s9b", s9bDefaults);
  const realProcedures = form.s9.filter(
    (procedure) => procedure !== "None of these",
  );
  const { list, word } = buildSurgeryListText(realProcedures);
  const value = form.bariDate ?? "";

  return (
    <div className="sc">
      <div className="q">
        {(c.questionTemplate ?? "")
          .replace("{list}", list || "")
          .replace("{word}", word || "")}
      </div>
      <textarea
        className="inp"
        placeholder={c.datePlaceholder}
        value={value}
        onChange={(event) => updateField("bariDate", event.target.value)}
      />
      <button
        type="button"
        className="cta"
        disabled={!value.trim()}
        onClick={() => goTo("s10")}
      >
        {c.ctaLabel}
      </button>
    </div>
  );
}
