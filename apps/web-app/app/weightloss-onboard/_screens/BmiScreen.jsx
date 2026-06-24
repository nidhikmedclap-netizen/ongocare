"use client";

import { BmiGauge } from "../components";
import {
  eligibilityText,
  sanitizeIntegerString,
  HEIGHT_FT_MAX,
  HEIGHT_IN_MAX,
  HEIGHT_CM_MAX,
  WEIGHT_LBS_MAX,
  WEIGHT_KG_MAX,
} from "../utils";
import { useOnboard, useScreenContent } from "./OnboardContext";
import { BMI_CATEGORY_CARDS } from "./constants";

const s3Defaults = {
  eyebrow: "Step 1 · Eligibility check",
  question: "Let's check if GLP-1 is right for you",
  subtitle:
    "Your height and weight help us calculate your BMI — a key factor in eligibility.",
  imperialLabel: "Imperial (ft / lbs)",
  metricLabel: "Metric (cm / kg)",
  heightLabel: "Height",
  weightLabel: "Weight",
  heightCmPlaceholder: "175",
  weightKgPlaceholder: "80",
  heightFtPlaceholder: "5",
  heightInPlaceholder: "10",
  weightLbsPlaceholder: "180",
  ctaLabel: "Continue",
  categories: BMI_CATEGORY_CARDS,
};

export default function S3Bmi() {
  const {
    form,
    updateField,
    goTo,
    bmi,
    bmiError,
    currentBmiCategory,
    setBmiUnit,
    submitMauticOnComplete,
  } = useOnboard();
  const c = useScreenContent("s3", s3Defaults);

  return (
    <div className="sc bmi-screen">
      <div className="bmi-eyebrow">{c.eyebrow}</div>
      <div className="q bmi-q">{c.question}</div>
      <div className="qs bmi-qs">
        {c.subtitle}
      </div>

      <div className="bmi-shell">
        <div className="unit-toggle bmi-toggle">
          <button
            type="button"
            className={form.bmiUnit === "imperial" ? "active" : ""}
            onClick={() => setBmiUnit("imperial")}
          >
            {c.imperialLabel}
          </button>
          <button
            type="button"
            className={form.bmiUnit === "metric" ? "active" : ""}
            onClick={() => setBmiUnit("metric")}
          >
            {c.metricLabel}
          </button>
        </div>

        {form.bmiUnit === "metric" ? (
          <div className="bmi-fields">
            <div className="bmi-field">
              <label className="bmi-field-label">{c.heightLabel}</label>
              <div className="bmi-field-input">
                <input
                  className="inp bmi-inp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={3}
                  placeholder={c.heightCmPlaceholder}
                  value={form.heightCm}
                  onChange={(event) =>
                    updateField("heightCm", sanitizeIntegerString(event.target.value, HEIGHT_CM_MAX))
                  }
                />
                <span className="bmi-unit">cm</span>
              </div>
            </div>
            <div className="bmi-field">
              <label className="bmi-field-label">{c.weightLabel}</label>
              <div className="bmi-field-input">
                <input
                  className="inp bmi-inp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={3}
                  placeholder={c.weightKgPlaceholder}
                  value={form.weightKg}
                  onChange={(event) =>
                    updateField("weightKg", sanitizeIntegerString(event.target.value, WEIGHT_KG_MAX))
                  }
                />
                <span className="bmi-unit">kg</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bmi-fields">
            <div className="bmi-field">
              <label className="bmi-field-label">{c.heightLabel}</label>
              <div className="bmi-field-pair">
                <div className="bmi-field-input">
                  <input
                    className="inp bmi-inp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={1}
                    placeholder={c.heightFtPlaceholder}
                    value={form.heightFt}
                    onChange={(event) =>
                      updateField("heightFt", sanitizeIntegerString(event.target.value, HEIGHT_FT_MAX))
                    }
                  />
                  <span className="bmi-unit">ft</span>
                </div>
                <div className="bmi-field-input">
                  <input
                    className="inp bmi-inp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={2}
                    placeholder={c.heightInPlaceholder}
                    value={form.heightIn}
                    onChange={(event) =>
                      updateField("heightIn", sanitizeIntegerString(event.target.value, HEIGHT_IN_MAX))
                    }
                  />
                  <span className="bmi-unit">in</span>
                </div>
              </div>
            </div>
            <div className="bmi-field">
              <label className="bmi-field-label">{c.weightLabel}</label>
              <div className="bmi-field-input">
                <input
                  className="inp bmi-inp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={4}
                  placeholder={c.weightLbsPlaceholder}
                  value={form.weightLbs}
                  onChange={(event) =>
                    updateField("weightLbs", sanitizeIntegerString(event.target.value, WEIGHT_LBS_MAX))
                  }
                />
                <span className="bmi-unit">lbs</span>
              </div>
            </div>
          </div>
        )}

        {bmiError && <div className="field-err">{bmiError}</div>}

        <div
          className={`bmi-gauge-shell${
            currentBmiCategory && !bmiError
              ? ` bmi-gauge-shell-${currentBmiCategory}`
              : ""
          }`}
        >
          <BmiGauge
            bmi={bmiError ? null : bmi}
            category={bmiError ? null : currentBmiCategory}
          />
        </div>

        {bmi !== null && !bmiError && (
          <div
            className={`bmi-pill bmi-pill-center bmi-pill-${currentBmiCategory ?? "none"}`}
          >
            {eligibilityText(bmi)}
          </div>
        )}

        <div className="cat-row">
          {c.categories.map((category) => (
            <div
              key={category.key}
              className={`cat-card cat-card-${category.key} ${currentBmiCategory === category.key ? "active" : ""}`}
            >
              <div className="cat-name">{category.name}</div>
              <div className="cat-range">{category.range}</div>
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        className="cta"
        disabled={bmi === null || bmiError !== null}
        onClick={() => {
          if (bmi !== null && bmi < 27) {
            submitMauticOnComplete({}, "dHard");
            goTo("dHard");
          } else {
            goTo("iGood");
          }
        }}
      >
        {c.ctaLabel}
      </button>
    </div>
  );
}
