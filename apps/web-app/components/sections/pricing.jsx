"use client";

import { useState } from "react";
import styles from "./Pricing.module.css";
import { WEGOVY_PAGE } from "@/lib/medications/pages";

const defaultContent = {
  eyebrow: "Program Pricing Overview",
  headingMain: "What's included in your",
  headingAccent: "weight loss membership",
  subcopy:
    "We offer clear and transparent pricing for our program. This reflects our belief that each patient deserves healthcare access at an affordable range.",
  trustList: [
    { value: "5000+", text: "Members" },
    { value: "$0", text: "Initial Call" },
    { value: "24/7", text: "Availability" },
  ],
  disclaimerTitle: "Pricing note",
  disclaimerText:
    "Displayed pricing applies to compounded medications. Brand-name options and final costs may vary based on your prescription, dosage, and pharmacy.",
  ctaLabel: "Start My Medical Evaluation at $69",
  ctaHref: "/weightloss-onboard",
  plans: [
    { id: "1m", duration: "1 month", months: 1, basePrice: 69, originalPrice: 79 },
    { id: "3m", duration: "3 months", months: 3, basePrice: 219, originalPrice: 240 },
    { id: "12m", duration: "6 months", months: 6, basePrice: 499, originalPrice: 525 },
  ],
  features: [
    "Access to evaluations from licensed doctors",
    "Access to nutrition coaching sessions",
    "Prescription approval and medication access",
    "24/7 care team availability",
  ],
  medications: [
    { name: "Wegovy®", href: WEGOVY_PAGE, price: "Brand Rx", icon: "💊" },
    { name: "Semaglutide", price: "+ $299/mo", icon: "💊" },
    { name: "Tirzepatide", price: "+ $399/mo", icon: "💊" },
    { name: "Liraglutide", price: "Varies", icon: "💊" },
  ],
  medicationsTitle: "Medication options",
};

export default function Pricing({ content }) {
  const c = { ...defaultContent, ...(content || {}) };
  const PLANS = c.plans;
  const FEATURES = c.features;
  const MEDICATIONS = c.medications;

  const [selectedId, setSelectedId] = useState(PLANS[0]?.id ?? "1m");
  const selected = PLANS.find((p) => p.id === selectedId) ?? PLANS[0];
  const savings = selected.originalPrice - selected.basePrice;

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.grid}>
          {/* LEFT — Copy */}
          <div className={styles.content}>
            <p className={styles.eyebrow}>{c.eyebrow}</p>
            <h2 className={styles.heading}>
              {c.headingMain}{" "}
              <span className={styles.headingAccent}>
                {c.headingAccent}
              </span>
            </h2>
            <p className={styles.subcopy}>
             {c.subcopy}
            </p>

            <div className={styles.trustList}>
              {c.trustList.map((t) => (
                <div key={t.text} className={styles.trustItem}>
                  <span className={styles.trustValue}>{t.value}</span>
                  <span className={styles.trustText}>{t.text}</span>
                </div>
              ))}
            </div>

            <div className={styles.disclaimer}>
              <span className={styles.disclaimerIcon} aria-hidden="true">ℹ</span>
              <div className={styles.disclaimerBody}>
                <span className={styles.disclaimerTitle}>{c.disclaimerTitle}</span>
                <p className={styles.disclaimerText}>
                  {c.disclaimerText}
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT — Pricing card */}
          <div className={styles.card}>
            {/* Toggle pill */}
            <div className={styles.toggle} role="tablist">
              {PLANS.map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  role="tab"
                  aria-selected={selectedId === plan.id}
                  className={`${styles.toggleBtn} ${
                    selectedId === plan.id ? styles.toggleBtnActive : ""
                  }`}
                  onClick={() => setSelectedId(plan.id)}
                >
                  {plan.duration}
                </button>
              ))}
            </div>

            {/* Price block */}
            <div className={styles.priceRow}>
              <div className={styles.priceLeft}>
                <span className={styles.priceOriginal}>
                  ${selected.originalPrice}/mo
                </span>
                <div className={styles.priceCurrent}>
                  <span
                    key={selected.id}
                    className={styles.priceValue}
                  >
                    ${selected.basePrice}
                  </span>
                  <span className={styles.priceUnit}>/mo</span>
                </div>
              </div>
              <span className={styles.saveBadge}>
                Save ${savings}
              </span>
            </div>

            {/* Features */}
            <ul className={styles.features}>
              {FEATURES.map((f, i) => (
                <li key={i} className={styles.featureItem}>
                  <span className={styles.featureCheck} aria-hidden="true">
                    ✓
                  </span>
                  <span className={styles.featureText}>{f}</span>
                </li>
              ))}
            </ul>

            {/* Medication options */}
            <div className={styles.medications}>
              <h3 className={styles.medicationsTitle}>{c.medicationsTitle}</h3>
              <ul className={styles.medList}>
                {MEDICATIONS.map((m, i) => (
                  <li key={i} className={styles.medItem}>
                    <div className={styles.medLeft}>
                      <span className={styles.medIcon} aria-hidden="true">
                        {m.icon}
                      </span>
                      {m.href ? (
                        <a href={m.href} className={styles.medNameLink}>
                          {m.name}
                        </a>
                      ) : (
                        <span className={styles.medName}>{m.name}</span>
                      )}
                    </div>
                    {m.price && (
                      <span className={styles.medPrice}>{m.price}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA */}
            <a
              href={c.ctaHref}
              className={styles.cta}
              style={{ textDecoration: "none" }}
            >
              {c.ctaLabel}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
