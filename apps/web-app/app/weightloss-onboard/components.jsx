"use client";

// Reusable presentational pieces used across the onboarding form.
// These are stateless — they receive values and callbacks from the parent.

import {
  MEDICATION_ADDONS,
  PLANS,
  PLAN_BENEFITS,
} from "./data";
import { formatSavings } from "./utils";

// Each option in Radio/Multi/Select can be either a plain string (where the
// string is both the stored form value AND the display label), or an object
// of the shape { value, label }. Routing logic across the form keys off the
// form value (e.g. `form.s9.includes("None of these")`), so when tenants
// want a different label without breaking the routing they should pass
// objects and keep the `value` field identical to the default.
function optionValue(option) {
  return typeof option === "string" ? option : option.value;
}
function optionLabel(option) {
  return typeof option === "string" ? option : option.label;
}

// ─────────────────────────────────────────
//  Radio — single-select list of options
// ─────────────────────────────────────────
export function Radio({ options, value, onSelect }) {
  return (
    <div className="opts" role="radiogroup">
      {options.map((option) => {
        const v = optionValue(option);
        const selected = value === v;
        return (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={selected}
            className={`opt radio ${selected ? "sel" : ""}`}
            onClick={() => onSelect(v)}
          >
            <span className="chk" />
            {optionLabel(option)}
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────
//  Multi — multi-select list with checkmarks
// ─────────────────────────────────────────
export function Multi({ options, values, onToggle }) {
  return (
    <div className="opts" role="group">
      {options.map((option) => {
        const v = optionValue(option);
        const selected = values.includes(v);
        return (
          <button
            key={v}
            type="button"
            role="checkbox"
            aria-checked={selected}
            className={`opt ${selected ? "sel" : ""}`}
            onClick={() => onToggle(v)}
          >
            <span className="chk">✓</span>
            {optionLabel(option)}
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────
//  Select — styled <select> dropdown
// ─────────────────────────────────────────
export function Select({ value, onChange, placeholder, options, style }) {
  return (
    <select
      className="inp"
      style={style}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      <option value="">{placeholder}</option>
      {options.map((option) => {
        const v = optionValue(option);
        return (
          <option key={v} value={v}>
            {optionLabel(option)}
          </option>
        );
      })}
    </select>
  );
}

// ─────────────────────────────────────────
//  BmiGauge — semi-circular progress gauge
// ─────────────────────────────────────────
const GAUGE_CENTER_X = 200;
const GAUGE_CENTER_Y = 200;
const GAUGE_RADIUS = 160;
const GAUGE_BMI_MIN = 15;
const GAUGE_BMI_MAX = 40;
const GAUGE_TICK_COUNT = 14;

export function BmiGauge({ bmi, category }) {
  const clampedBmi =
    bmi == null
      ? GAUGE_BMI_MIN
      : Math.max(GAUGE_BMI_MIN, Math.min(GAUGE_BMI_MAX, bmi));
  const progress = (clampedBmi - GAUGE_BMI_MIN) / (GAUGE_BMI_MAX - GAUGE_BMI_MIN);
  const arcLength = Math.PI * GAUGE_RADIUS;
  const filledLength = arcLength * progress;
  const markerRotation = progress * 180;

  const ticks = Array.from({ length: GAUGE_TICK_COUNT }, (_, index) => {
    const tickProgress = index / (GAUGE_TICK_COUNT - 1);
    const angle = Math.PI * tickProgress;
    const tickInner = GAUGE_RADIUS + 14;
    const tickOuter = GAUGE_RADIUS + 22;
    return {
      x1: GAUGE_CENTER_X - tickInner * Math.cos(angle),
      y1: GAUGE_CENTER_Y - tickInner * Math.sin(angle),
      x2: GAUGE_CENTER_X - tickOuter * Math.cos(angle),
      y2: GAUGE_CENTER_Y - tickOuter * Math.sin(angle),
    };
  });

  const arcPath = `M ${GAUGE_CENTER_X - GAUGE_RADIUS},${GAUGE_CENTER_Y} A ${GAUGE_RADIUS},${GAUGE_RADIUS} 0 0,1 ${GAUGE_CENTER_X + GAUGE_RADIUS},${GAUGE_CENTER_Y}`;

  return (
    <div className="bmi-gauge-wrap">
      <svg viewBox="0 0 400 240" className="bmi-gauge">
        <path
          d={arcPath}
          fill="none"
          stroke="rgba(0,0,0,0.08)"
          strokeWidth="20"
          strokeLinecap="round"
        />
        <path
          d={arcPath}
          fill="none"
          stroke="#2D6A4F"
          strokeWidth="20"
          strokeLinecap="round"
          strokeDasharray={arcLength}
          strokeDashoffset={arcLength - filledLength}
          style={{
            transition: "stroke-dashoffset .55s cubic-bezier(.22,.61,.36,1)",
            opacity: bmi == null ? 0 : 1,
          }}
        />
        {ticks.map((tick, index) => (
          <line
            key={index}
            x1={tick.x1}
            y1={tick.y1}
            x2={tick.x2}
            y2={tick.y2}
            stroke="rgba(0,0,0,0.18)"
            strokeWidth="2"
          />
        ))}
        <g
          style={{
            transform: `rotate(${markerRotation}deg)`,
            transformOrigin: `${GAUGE_CENTER_X}px ${GAUGE_CENTER_Y}px`,
            transition: "transform .55s cubic-bezier(.22,.61,.36,1)",
            opacity: bmi == null ? 0 : 1,
          }}
        >
          <circle
            cx={GAUGE_CENTER_X - GAUGE_RADIUS}
            cy={GAUGE_CENTER_Y}
            r="10"
            fill="#1a1a1a"
            stroke="#fff"
            strokeWidth="3"
          />
        </g>
      </svg>
      <div className="bmi-gauge-text">
        <div className="bmi-gauge-eyebrow">YOUR BMI</div>
        <div className="bmi-gauge-value">
          {bmi != null ? bmi.toFixed(1) : "—"}
        </div>
        <div className="bmi-gauge-cat">
          {category ? category.toUpperCase() : ""}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
//  StressSlider — 1–10 slider with Low/Medium/High zone styling
// ─────────────────────────────────────────
export function StressSlider({ value, onChange }) {
  const zone = value <= 3 ? "low" : value <= 7 ? "med" : "high";
  return (
    <div className={`stress-block stress-${zone}`}>
      <div className="stress-row">
        <span className="smin">1</span>
        <div className="stress-track-wrap">
          <input
            type="range"
            min={1}
            max={10}
            value={value}
            onChange={(event) => onChange(Number(event.target.value))}
          />
          <div className="stress-ticks" aria-hidden>
            {Array.from({ length: 10 }).map((_, index) => (
              <span key={index} />
            ))}
          </div>
        </div>
        <span className="smax">10</span>
        <span className="sv">{value}</span>
      </div>
      <div className="stress-zones">
        <span className={zone === "low" ? "active" : ""}>Low</span>
        <span className={zone === "med" ? "active" : ""}>Medium</span>
        <span className={zone === "high" ? "active" : ""}>High</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
//  PlanCard — horizontal row plans + benefits
//  (Used on the sPlan screen.)
// ─────────────────────────────────────────

// Helper — renders the saving label without the broken minus sign
// Falls back to a clean "Save $X" string if formatSavings produced "$-X"
function cleanSavings(raw) {
  const text = String(raw);
  const numMatch = text.match(/-?\d+(\.\d+)?/);
  if (!numMatch) return text;
  const n = Math.abs(parseFloat(numMatch[0]));
  return `Save $${n}`;
}

export function PlanCard({ selectedPlanId, onSelectPlan }) {
  const popularId = PLANS.reduce(
    (best, plan) => (plan.save > best.save ? plan : best),
    PLANS[0],
  ).id;

  const activePlan =
    PLANS.find((plan) => plan.id === selectedPlanId) ?? PLANS[0];

  return (
    <>
      {/* Stacked horizontal plan rows */}
      <div className="plan-list">
        {PLANS.map((plan) => {
          const isSelected = selectedPlanId === plan.id;
          const isPopular = plan.id === popularId;
          return (
            <button
              key={plan.id}
              type="button"
              className={`plan-row ${isSelected ? "sel" : ""} ${
                isPopular ? "popular" : ""
              }`}
              onClick={() => onSelectPlan(plan.id)}
              aria-pressed={isSelected}
            >
              {isPopular && (
                <span className="plan-row-badge">Best value</span>
              )}

              <span className="plan-row-radio" aria-hidden>
                <span className="plan-row-radio-dot" />
              </span>

              <span className="plan-row-info">
                <span className="plan-row-label">{plan.label}</span>
                <span className="plan-row-old">
                  ${plan.oldMonthly} was
                </span>
              </span>

              <span className="plan-row-price">
                <span className="plan-row-amt">
                  <span className="plan-row-currency">$</span>
                  {plan.monthly}
                </span>
                <span className="plan-row-permo">
                  {plan.months === 1 ? "/month" : ` / ${plan.label}`}
                </span>
              </span>

              <span className="plan-row-save">
                {cleanSavings(formatSavings(plan.save))}
              </span>
            </button>
          );
        })}
      </div>

      {/* Benefits + medication options card */}
      <div className="plan-detail-card">
        <div className="plan-detail-head">
          Your <strong>{activePlan.label}</strong> plan includes
        </div>

        <ul className="plan-bullets">
          {PLAN_BENEFITS.map((benefit) => (
            <li key={benefit}>
              <span className="plan-tick" aria-hidden>
                <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="5 12.5 10 17 19 7.5" />
                </svg>
              </span>
              {benefit}
            </li>
          ))}
        </ul>

        <div className="plan-divider" />

        <div className="plan-meds-title">Medication options</div>
        <div className="plan-meds">
          {MEDICATION_ADDONS.map((medication) => (
            <div key={medication.label} className="plan-med-row">
              <span
                className={`plan-med-icon ${medication.pill ? "pill" : "skin"}`}
                aria-hidden
              >
                {medication.pill ? "💊" : "🧴"}
              </span>
              <span className="plan-med-label">{medication.label}</span>
              {medication.price && (
                <span className="plan-med-price">{medication.price}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
