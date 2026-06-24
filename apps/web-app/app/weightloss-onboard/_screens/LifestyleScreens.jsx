"use client";

import { Multi, Radio, Select, StressSlider } from "../components";
import {
  ALCOHOL_FREQUENCY,
  EXERCISE_DAYS,
  FAST_FOOD_PER_WEEK,
  MEALS_PER_DAY,
  RECREATIONAL_DRUGS,
  SLEEP_HOURS,
  SUGARY_DRINKS_PER_WEEK,
  WATER_INTAKE,
} from "../data";
import { useOnboard, useScreenContent } from "./OnboardContext";

function optionValue(option) {
  return typeof option === "string" ? option : option.value;
}

/** Keep "I don't use any" then "Other" last so the specify field sits under Other. */
function orderRecreationalDrugOptions(options) {
  const main = [];
  let none = null;
  let other = null;
  for (const option of options) {
    const value = optionValue(option);
    if (value === "I don't use any") none = option;
    else if (value === "Other") other = option;
    else main.push(option);
  }
  return [...main, ...(none ? [none] : []), ...(other ? [other] : [])];
}

const s16Defaults = {
  question: "How many alcoholic drinks do you have in a week?",
  options: ALCOHOL_FREQUENCY,
  ctaLabel: "Continue",
};

export function S16() {
  const { form, updateField, goTo } = useOnboard();
  const c = useScreenContent("s16", s16Defaults);

  return (
    <div className="sc">
      <div className="q">{c.question}</div>
      <Radio
        options={c.options}
        value={form.s16}
        onSelect={(value) => updateField("s16", value)}
      />
      <button
        type="button"
        className="cta"
        disabled={!form.s16}
        onClick={() => goTo("s17")}
      >
        {c.ctaLabel}
      </button>
    </div>
  );
}

const s17Defaults = {
  question: "Do you use any recreational drugs?",
  subtitle: "Your answer is private.",
  options: RECREATIONAL_DRUGS,
  otherPlaceholder: "Please specify (optional)",
  ctaLabel: "Continue",
};

export function S17() {
  const { form, updateField, toggleWithNone, goTo } = useOnboard();
  const c = useScreenContent("s17", s17Defaults);
  const drugOptions = orderRecreationalDrugOptions(c.options);

  return (
    <div className="sc">
      <div className="q">{c.question}</div>
      <div className="qs">{c.subtitle}</div>
      <Multi
        options={drugOptions}
        values={form.s17}
        onToggle={(value) => {
          const removingOther = value === "Other" && form.s17.includes("Other");
          toggleWithNone("s17", value, "I don't use any");
          if (value === "I don't use any" || removingOther) {
            updateField("s17Other", "");
          }
        }}
      />
      {form.s17.includes("Other") && (
        <textarea
          className="inp s17-other-specify"
          maxLength={200}
          placeholder={c.otherPlaceholder}
          value={form.s17Other}
          onChange={(event) =>
            updateField("s17Other", event.target.value.replace(/\s{3,}/g, "  ").slice(0, 200))
          }
        />
      )}
      <button
        type="button"
        className="cta"
        disabled={form.s17.length === 0}
        onClick={() => goTo("s18")}
      >
        {c.ctaLabel}
      </button>
    </div>
  );
}

const s18Defaults = {
  question: "Can you tell us a bit about your daily routine and habits?",
  subtitle: "This helps your doctor build the right plan for you.",
  mealsPlaceholder: "Meals per day",
  exercisePlaceholder: "Exercise days / week",
  sleepPlaceholder: "Sleep hours / night",
  fastFoodPlaceholder: "Fast food / week",
  sugaryPlaceholder: "Sugary drinks / week",
  waterPlaceholder: "Water intake daily",
  stressLabel: "Stress level",
  ctaLabel: "Continue",
  mealsOptions: MEALS_PER_DAY,
  exerciseOptions: EXERCISE_DAYS,
  sleepOptions: SLEEP_HOURS,
  fastFoodOptions: FAST_FOOD_PER_WEEK,
  sugaryOptions: SUGARY_DRINKS_PER_WEEK,
  waterOptions: WATER_INTAKE,
};

export function S18() {
  const { form, updateField, goTo, lifestyleScreenIsValid } = useOnboard();
  const c = useScreenContent("s18", s18Defaults);

  return (
    <div className="sc">
      <div className="q">{c.question}</div>
      <div className="qs">{c.subtitle}</div>
      <div className="r2">
        <Select
          style={{ margin: 0 }}
          placeholder={c.mealsPlaceholder}
          options={c.mealsOptions}
          value={form.meals}
          onChange={(value) => updateField("meals", value)}
        />
        <Select
          style={{ margin: 0 }}
          placeholder={c.exercisePlaceholder}
          options={c.exerciseOptions}
          value={form.exercise}
          onChange={(value) => updateField("exercise", value)}
        />
      </div>
      <div className="r2" style={{ marginTop: 8 }}>
        <Select
          style={{ margin: 0 }}
          placeholder={c.sleepPlaceholder}
          options={c.sleepOptions}
          value={form.sleep}
          onChange={(value) => updateField("sleep", value)}
        />
        <Select
          style={{ margin: 0 }}
          placeholder={c.fastFoodPlaceholder}
          options={c.fastFoodOptions}
          value={form.fastFood}
          onChange={(value) => updateField("fastFood", value)}
        />
      </div>
      <div className="r2" style={{ marginTop: 8 }}>
        <Select
          style={{ margin: 0 }}
          placeholder={c.sugaryPlaceholder}
          options={c.sugaryOptions}
          value={form.sugary}
          onChange={(value) => updateField("sugary", value)}
        />
        <Select
          style={{ margin: 0 }}
          placeholder={c.waterPlaceholder}
          options={c.waterOptions}
          value={form.water}
          onChange={(value) => updateField("water", value)}
        />
      </div>
      <div className="stress-label">{c.stressLabel}</div>
      <StressSlider
        value={form.stress}
        onChange={(value) => updateField("stress", value)}
      />
      <button
        type="button"
        className="cta"
        disabled={!lifestyleScreenIsValid}
        onClick={() => goTo("s19")}
      >
        {c.ctaLabel}
      </button>
    </div>
  );
}
