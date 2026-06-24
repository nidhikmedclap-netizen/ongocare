"use client";

import { Multi, Radio } from "../components";
import { PAST_METHODS, STRUGGLE_DURATIONS } from "../data";
import {
  includesSomethingElse,
  isSomethingElseSelection,
  sanitizeIntegerString,
  waistError,
  weightLbsError,
  WAIST_IN_MAX,
  WEIGHT_LBS_MAX,
} from "../utils";
import { useOnboard, useScreenContent } from "./OnboardContext";

const s4Defaults = {
  question: "Can you share a little about your weight journey so far?",
  subtitle: "This helps your doctor understand your journey.",
  placeholderHigh: "Highest adult weight (lbs)",
  placeholderLow: "Lowest weight, past 5 yrs (lbs)",
  placeholderGoal: "Goal weight (lbs)",
  placeholderWaist: "Waist circumference (inches) — optional",
  ctaLabel: "Continue",
};

export function S4() {
  const { form, updateField, goTo, weightHistoryScreenIsValid } = useOnboard();
  const c = useScreenContent("s4", s4Defaults);

  const wtHighErr = weightLbsError(form.wtHigh);
  const wtLowErr = weightLbsError(form.wtLow);
  const wtGoalErr = weightLbsError(form.wtGoal);
  const waistErr = waistError(form.waist);

  return (
    <div className="sc">
      <div className="q">{c.question}</div>
      <div className="qs">{c.subtitle}</div>
      <div className="r2">
        <input
          className="inp"
          style={{ margin: 0 }}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          maxLength={4}
          placeholder={c.placeholderHigh}
          value={form.wtHigh}
          onChange={(event) =>
            updateField("wtHigh", sanitizeIntegerString(event.target.value, WEIGHT_LBS_MAX))
          }
        />
        <input
          className="inp"
          style={{ margin: 0 }}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          maxLength={4}
          placeholder={c.placeholderLow}
          value={form.wtLow}
          onChange={(event) =>
            updateField("wtLow", sanitizeIntegerString(event.target.value, WEIGHT_LBS_MAX))
          }
        />
      </div>
      {(wtHighErr || wtLowErr) && (
        <div className="field-err">{wtHighErr || wtLowErr}</div>
      )}
      <input
        className="inp"
        type="text"
        inputMode="numeric"
        autoComplete="off"
        maxLength={4}
        placeholder={c.placeholderGoal}
        value={form.wtGoal}
        onChange={(event) =>
          updateField("wtGoal", sanitizeIntegerString(event.target.value, WEIGHT_LBS_MAX))
        }
      />
      {wtGoalErr && <div className="field-err">{wtGoalErr}</div>}
      <input
        className="inp"
        type="text"
        inputMode="numeric"
        autoComplete="off"
        maxLength={3}
        placeholder={c.placeholderWaist}
        value={form.waist}
        onChange={(event) =>
          updateField("waist", sanitizeIntegerString(event.target.value, WAIST_IN_MAX))
        }
      />
      {waistErr && <div className="field-err">{waistErr}</div>}
      <button
        type="button"
        className="cta"
        disabled={!weightHistoryScreenIsValid}
        onClick={() => goTo("s5")}
      >
        {c.ctaLabel}
      </button>
    </div>
  );
}

const s5Defaults = {
  question: "How long has your weight been a concern for you?",
  options: STRUGGLE_DURATIONS,
  ctaLabel: "Continue",
};

export function S5() {
  const { form, updateField, goTo } = useOnboard();
  const c = useScreenContent("s5", s5Defaults);

  return (
    <div className="sc">
      <div className="q">{c.question}</div>
      <Radio
        options={c.options}
        value={form.s5}
        onSelect={(value) => updateField("s5", value)}
      />
      <button
        type="button"
        className="cta"
        disabled={!form.s5}
        onClick={() => goTo("s6")}
      >
        {c.ctaLabel}
      </button>
    </div>
  );
}

const s6Defaults = {
  question: "What have you tried before to lose weight?",
  subtitle: "Select all that apply.",
  options: PAST_METHODS,
  otherPlaceholder: "Please specify (optional)",
  ctaLabel: "Continue",
};

export function S6() {
  const { form, updateField, goTo } = useOnboard();
  const c = useScreenContent("s6", s6Defaults);
  const showOtherField = includesSomethingElse(form.s6);

  const onToggleS6 = (value) => {
    const removing = form.s6.includes(value);
    const next = removing
      ? form.s6.filter((entry) => entry !== value)
      : [...form.s6, value];
    updateField("s6", next);
    if (isSomethingElseSelection(value) && removing) {
      updateField("s6Other", "");
    }
  };

  return (
    <div className="sc">
      <div className="q">{c.question}</div>
      <div className="qs">{c.subtitle}</div>
      <Multi
        options={c.options}
        values={form.s6}
        onToggle={onToggleS6}
      />
      {showOtherField && (
        <input
          className="inp"
          type="text"
          maxLength={200}
          placeholder={c.otherPlaceholder}
          value={form.s6Other}
          onChange={(event) =>
            updateField("s6Other", event.target.value.slice(0, 200))
          }
        />
      )}
      <button
        type="button"
        className="cta"
        disabled={form.s6.length === 0}
        onClick={() => goTo("s7")}
      >
        {c.ctaLabel}
      </button>
    </div>
  );
}
