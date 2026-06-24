"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./BMICalculator.module.css";

const CATEGORIES = [
  {
    label: "Under",
    modalLabel: "Underweight",
    range: "< 18.5",
    modalRange: "<18.5",
    min: 0,
    max: 18.5,
    tone: "low",
    description:
      "Your BMI is below the healthy range. A licensed clinician can help explore underlying factors and guide you toward a safe, sustainable plan.",
  },
  {
    label: "Healthy",
    modalLabel: "Healthy Weight",
    range: "18.5 – 24.9",
    modalRange: "18.5+",
    min: 18.5,
    max: 25,
    tone: "ok",
    description:
      "Your BMI is in the healthy range. GLP-1 medications are typically reserved for people with a higher BMI or related health conditions.",
  },
  {
    label: "Over",
    modalLabel: "Overweight",
    range: "25 – 29.9",
    modalRange: "25+",
    min: 25,
    max: 30,
    tone: "warn",
    description:
      "Your BMI is in the overweight range. You may qualify for GLP-1 medications, especially when paired with a weight-related health condition.",
  },
  {
    label: "Obese",
    modalLabel: "Obesity",
    range: "≥ 30",
    modalRange: "30+",
    min: 30,
    max: 60,
    tone: "high",
    description:
      "Your BMI is in the obese range. You likely qualify for GLP-1 medications. A licensed clinician will confirm based on your full health profile.",
  },
];

const ELIGIBILITY = {
  low: { label: "Not a candidate" },
  ok: { label: "Unlikely to qualify" },
  warn: { label: "May qualify" },
  high: { label: "Likely qualifies" },
};

const defaultContent = {
  eyebrow: "BMI ELIGIBILITY",
  headingMain: "Could a GLP-1 be",
  headingItalic: "right",
  headingSuffix: "for you?",
  subcopy:
    "Your provider reviews key criteria to check your eligibility. Clinical factors like BMI and waist circumference may be considered.",
};

export default function BMICalculator({ content }) {
  const c = { ...defaultContent, ...(content || {}) };
  const [unit, setUnit] = useState("metric");
  const [weightKg, setWeightKg] = useState(70);
  const [heightCm, setHeightCm] = useState(170);
  const [weightLb, setWeightLb] = useState(154);
  const [feet, setFeet] = useState(5);
  const [inches, setInches] = useState(7);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!isModalOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") setIsModalOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [isModalOpen]);

  const bmi = useMemo(() => {
    if (unit === "metric") {
      const m = heightCm / 100;
      if (!m) return 0;
      return weightKg / (m * m);
    } else {
      const totalIn = feet * 12 + inches;
      if (!totalIn) return 0;
      return (weightLb / (totalIn * totalIn)) * 703;
    }
  }, [unit, weightKg, heightCm, weightLb, feet, inches]);

  const category = useMemo(
    () => CATEGORIES.find((c) => bmi >= c.min && bmi < c.max) ?? CATEGORIES[3],
    [bmi]
  );

  const eligibility = ELIGIBILITY[category.tone];

  const angle = useMemo(() => {
    const clamped = Math.min(40, Math.max(10, bmi));
    const t = (clamped - 10) / 30;
    return -120 + t * 240;
  }, [bmi]);

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <span className={styles.eyebrow}>{c.eyebrow}</span>

        <div className={styles.grid}>
          <div className={styles.left}>
            <h2 className={styles.heading}>
              {c.headingMain}{" "}
              <span className={styles.headingItalic}>{c.headingItalic}</span> {c.headingSuffix}
            </h2>

            <p className={styles.subcopy}>
           {c.subcopy}
            </p>

            <div className={styles.unitToggle} role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={unit === "metric"}
                className={`${styles.unitBtn} ${
                  unit === "metric" ? styles.unitBtnActive : ""
                }`}
                onClick={() => setUnit("metric")}
              >
                Metric
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={unit === "imperial"}
                className={`${styles.unitBtn} ${
                  unit === "imperial" ? styles.unitBtnActive : ""
                }`}
                onClick={() => setUnit("imperial")}
              >
                Imperial
              </button>
            </div>

            <div className={styles.inputs}>
              {unit === "metric" ? (
                <>
                  <Field
                    label="Weight (kg)"
                    value={weightKg}
                    onChange={setWeightKg}
                  />
                  <Field
                    label="Height (cm)"
                    value={heightCm}
                    onChange={setHeightCm}
                  />
                </>
              ) : (
                <>
                  <Field
                    label="Weight (lbs)"
                    value={weightLb}
                    onChange={setWeightLb}
                  />
                  <Field label="Feet" value={feet} onChange={setFeet} />
                  <Field
                    label="Inches"
                    value={inches}
                    onChange={setInches}
                  />
                </>
              )}
            </div>

            <div
              className={`${styles.resultCard} ${
                styles[`tone_${category.tone}`]
              }`}
            >
              <div className={styles.resultHeader}>
                <span className={styles.resultEyebrow}>Eligibility</span>
                <span className={styles.resultLabel}>{eligibility.label}</span>
              </div>
              <button
                type="button"
                className={styles.cta}
                onClick={() => setIsModalOpen(true)}
              >
                Check My Eligibility →
              </button>
            </div>

            <div className={styles.legend}>
              {CATEGORIES.map((c) => (
                <div
                  key={c.label}
                  className={`${styles.legendItem} ${
                    c.tone === category.tone ? styles.legendItemActive : ""
                  }`}
                >
                  <span className={styles.legendLabel}>{c.label}</span>
                  <span className={styles.legendRange}>{c.range}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.right}>
            <Gauge bmi={bmi} angle={angle} category={category} />
          </div>
        </div>
      </div>

      {isModalOpen && (
        <EligibilityModal
          bmi={bmi}
          category={category}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </section>
  );
}

function EligibilityModal({ bmi, category, onClose }) {
  return (
    <div
      className={styles.modalBackdrop}
      role="presentation"
      onClick={onClose}
    >
      <div
        className={styles.modalPanel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bmi-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className={styles.modalClose}
          onClick={onClose}
          aria-label="Close"
        >
          ✕
        </button>

        <div className={styles.modalGrid}>
          <div className={styles.modalLeft}>
            <h3 id="bmi-modal-title" className={styles.modalTitle}>
              Check your eligibility.
            </h3>

            <MiniGauge bmi={bmi} category={category} />

            <p className={styles.modalDesc}>
              Body Mass Index (BMI) is a measurement that uses your height and
              weight to estimate whether your weight is in a healthy range for
              your height.*
            </p>
          </div>

          <div className={styles.modalRight}>
            {CATEGORIES.map((c) => {
              const isActive = c.tone === category.tone;
              return (
                <div
                  key={c.tone}
                  className={`${styles.modalCat} ${styles[`modalCat_${c.tone}`]} ${
                    isActive ? styles.modalCatActive : ""
                  }`}
                >
                  <div className={styles.modalCatHeader}>
                    <span
                      className={`${styles.modalCatDot} ${styles[`modalCatDot_${c.tone}`]}`}
                      aria-hidden="true"
                    />
                    <span className={styles.modalCatLabel}>{c.modalLabel}</span>
                    <span className={styles.modalCatRange}>{c.modalRange}</span>
                  </div>
                  {isActive && (
                    <p className={styles.modalCatDesc}>{c.description}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className={styles.modalFooter}>
          <p className={styles.modalFootnote}>
            *BMI doesn&apos;t directly measure body fat and may not accurately
            reflect health for people with high muscle mass, pregnant women,
            children, older adults, certain ethnic groups, or those with medical
            conditions. It shouldn&apos;t be used as the only way to assess
            health.
          </p>
          <p className={styles.modalFootnote}>
            The BMI calculator does not determine eligibility for weight loss
            treatments. A healthcare provider must evaluate your overall health
            and history to decide if treatment is right for you.
          </p>
        </div>
      </div>
    </div>
  );
}

function MiniGauge({ bmi, category }) {
  const size = 220;
  const cx = size / 2;
  const cy = size / 2 + 20;
  const r = 90;

  const polar = (deg, radius = r) => {
    const rad = ((deg - 90) * Math.PI) / 180;
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  };

  const start = polar(-90);
  const end = polar(90);
  const arcPath = `M ${start.x} ${start.y} A ${r} ${r} 0 0 1 ${end.x} ${end.y}`;

  const clamped = Math.min(40, Math.max(10, bmi || 0));
  const t = (clamped - 10) / 30;
  const angle = -90 + t * 180;
  const dot = polar(angle);

  return (
    <div className={styles.miniGauge}>
      <svg
        viewBox={`0 0 ${size} ${size / 1.4}`}
        className={styles.miniGaugeSvg}
        aria-hidden="true"
      >
        <path
          d={arcPath}
          fill="none"
          stroke="#e9e9ef"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <circle
          cx={dot.x}
          cy={dot.y}
          r="7"
          fill="#ffffff"
          stroke={`var(--bmi-tone-${category.tone})`}
          strokeWidth="3"
        />
      </svg>
      <div className={styles.miniGaugeReadout}>
        <span className={styles.miniGaugeValue}>
          {bmi > 0 ? bmi.toFixed(0) : "0"}
        </span>
        <span className={styles.miniGaugeLabel}>Your BMI</span>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }) {
  return (
    <label className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      <input
        type="number"
        className={styles.fieldInput}
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
      />
    </label>
  );
}

function Gauge({ bmi, angle, category }) {
  const size = 320;
  const cx = size / 2;
  const cy = size / 2;
  const r = 130;
  const tickInner = r - 18;
  const tickOuter = r + 8;

  const polar = (deg, radius = r) => {
    const rad = ((deg - 90) * Math.PI) / 180;
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  };

  const start = polar(-120);
  const end = polar(120);
  const arcPath = `M ${start.x} ${start.y} A ${r} ${r} 0 1 1 ${end.x} ${end.y}`;

  const totalArcLength = (240 / 360) * 2 * Math.PI * r;
  const arcProgress = (angle + 120) / 240;
  const visibleArcLength = totalArcLength * arcProgress;

  const ticks = [];
  for (let deg = -120; deg <= 120; deg += 12) {
    const isMajor = (deg + 120) % 60 === 0;
    const inner = polar(deg, isMajor ? tickInner - 4 : tickInner);
    const outer = polar(deg, tickOuter);
    ticks.push({ inner, outer, isMajor, deg });
  }

  return (
    <div className={styles.gauge}>
      <svg viewBox={`0 0 ${size} ${size}`} className={styles.gaugeSvg}>
        <defs>
          <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--color-primary-light)" />
            <stop offset="100%" stopColor="var(--color-primary-dark)" />
          </linearGradient>
          <filter id="gaugeGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {ticks.map((tick, i) => (
          <line
            key={i}
            x1={tick.inner.x}
            y1={tick.inner.y}
            x2={tick.outer.x}
            y2={tick.outer.y}
            stroke="rgba(255, 255, 255, 0.3)"
            strokeWidth={tick.isMajor ? 2 : 1}
            strokeLinecap="round"
            opacity={tick.isMajor ? 0.6 : 0.3}
          />
        ))}

        <path
          d={arcPath}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="22"
          strokeLinecap="round"
        />

        <path
          d={arcPath}
          fill="none"
          stroke="url(#gaugeGrad)"
          strokeWidth="22"
          strokeLinecap="round"
          opacity="0.9"
          filter="url(#gaugeGlow)"
          strokeDasharray={`${visibleArcLength} ${totalArcLength}`}
          className={styles.gaugeArc}
        />

        <g
          className={styles.pointer}
          style={{
            transform: `rotate(${angle}deg)`,
            transformOrigin: `${cx}px ${cy}px`,
          }}
        >
          <circle
            cx={cx}
            cy={cy - r}
            r="14"
            fill="var(--color-accent)"
            opacity="0.25"
          />
          <circle
            cx={cx}
            cy={cy - r}
            r="9"
            fill="var(--color-accent)"
            stroke="var(--color-surface)"
            strokeWidth="3"
          />
        </g>
      </svg>

      <div className={styles.gaugeReadout}>
        <span className={styles.gaugeEyebrow}>YOUR BMI</span>
        <span className={styles.gaugeValue}>
          {bmi > 0 ? bmi.toFixed(1) : "—"}
        </span>
        <span
          className={`${styles.gaugeCategory} ${
            styles[`tone_${category.tone}`]
          }`}
        >
          {category.label}
        </span>
      </div>

      <p className={styles.disclaimer}>
       This chart is for general reference and not a diagnosis. Eligibility is determined by a licensed provider based on your individual health profile, and a prescription is never guaranteed.
      </p>
    </div>
  );
}
