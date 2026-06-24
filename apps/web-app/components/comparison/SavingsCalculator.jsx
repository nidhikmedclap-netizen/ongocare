"use client";

import { useMemo, useState } from "react";
import styles from "./ComparisonPage.module.css";

const MIN_WEIGHT = 150;
const MAX_WEIGHT = 400;
const BASE_MONTHLY = 199;

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function SavingsCalculator() {
  const [currentWeight, setCurrentWeight] = useState(220);
  const [goalWeight, setGoalWeight] = useState(180);

  const safeGoal = Math.min(goalWeight, currentWeight - 5);

  const estimate = useMemo(() => {
    const loss = Math.max(0, currentWeight - safeGoal);
    const months = Math.max(3, Math.ceil(loss / 8));
    const traditional = months * 450;
    const ongo = months * BASE_MONTHLY;
    const savings = Math.max(0, traditional - ongo);
    return { months, traditional, ongo, savings };
  }, [currentWeight, safeGoal]);

  return (
    <div className={styles.calculatorCard}>
      <h3 className={styles.calculatorTitle}>Estimate your savings</h3>
      <p className={styles.calculatorLead}>
        Adjust your weights to see a rough monthly cost comparison. Final pricing
        depends on your clinician&apos;s recommendation.
      </p>

      <div className={styles.sliderGroup}>
        <div className={styles.sliderRow}>
          <label htmlFor="current-weight" className={styles.sliderLabel}>
            Current weight
            <span>{currentWeight} lbs</span>
          </label>
          <input
            id="current-weight"
            type="range"
            min={MIN_WEIGHT}
            max={MAX_WEIGHT}
            value={currentWeight}
            onChange={(e) => setCurrentWeight(Number(e.target.value))}
            className={styles.slider}
          />
        </div>

        <div className={styles.sliderRow}>
          <label htmlFor="goal-weight" className={styles.sliderLabel}>
            Goal weight
            <span>{safeGoal} lbs</span>
          </label>
          <input
            id="goal-weight"
            type="range"
            min={MIN_WEIGHT}
            max={currentWeight - 5}
            value={safeGoal}
            onChange={(e) => setGoalWeight(Number(e.target.value))}
            className={styles.slider}
          />
        </div>
      </div>

      <div className={styles.estimateBox}>
        <div className={styles.estimateRow}>
          <span>Estimated program length</span>
          <strong>{estimate.months} months</strong>
        </div>
        <div className={styles.estimateRow}>
          <span>Traditional clinic cost</span>
          <strong>{formatCurrency(estimate.traditional)}</strong>
        </div>
        <div className={styles.estimateRowHighlight}>
          <span>Ongo Care estimate</span>
          <strong>{formatCurrency(estimate.ongo)}</strong>
        </div>
        <div className={styles.estimateSavings}>
          Potential savings: <strong>{formatCurrency(estimate.savings)}</strong>
        </div>
      </div>

      <a href="/weightloss-onboard" className={styles.accentBtn}>
        Get your plan →
      </a>
    </div>
  );
}
