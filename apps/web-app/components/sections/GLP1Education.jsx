"use client";

import { Fragment, useState } from "react";
import Image from "next/image";
import styles from "./GLP1Education.module.css";

const defaultContent = {
  headingMain: "Why choose",
  headingAccent: "Ongo Weight Loss",
  subcopy:
    "Our weight loss program is designed to support your overall health and wellness.",
  ctaLabel: "Start My Medical Evaluation",
  ctaHref: "/weightloss-onboard",
  heroImage: "/images/Gemini_Generated_Image_56dfmw56dfmw56df 1.webp",
  miniStats: [
    { value: "5000+", label: "Members" },
    { value: "100%", label: "Online" },
  ],
};

const DEFAULT_BENEFITS = [
  {
    id: "proven",
    title: "Personalized vs. Generic Plans",
    description:
      "No one-size-fits-all approach; each plan is tailored to your health.",
  },
  {
    id: "biological",
    title: "Medical Guidance vs. Self-trial",
    description:
      "Receive guidance from licensed doctors, not chatbots, for safe care.",
  },
  {
    id: "beyond",
    title: "Sustainable Results vs. Quick Fixes",
    description:
      "We focus on long-term weight loss, not quick, short-term solutions.",
  },
  {
    id: "support",
    title: "Online Evaluation and Prescription",
    description:
      "No in-person visits required; online evaluations with prescriptions issued when appropriate.",
  },
];

const DEFAULT_FEATURES = [
  { icon: "/images/Rx Based.webp", label: "Rx Based\nMedications" },
  { icon: "/images/hippa.webp", label: "HIPAA Compliant\nSystem" },
  { icon: "/images/Prescribed by.webp", label: "Prescribed by\nlicensed doctors" },
  { icon: "/images/Medication delivery.webp", label: "Medication delivery\nto your door" },
];

export default function GLP1Education({ content }) {
  const c = { ...defaultContent, ...(content || {}) };
  const BENEFITS = content?.benefits ?? DEFAULT_BENEFITS;
  const FEATURES = content?.features ?? DEFAULT_FEATURES;
  const MINI_STATS = c.miniStats;

  const [activeBenefit, setActiveBenefit] = useState(BENEFITS[0].id);

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.grid}>
          {/* LEFT — Visual with floating features */}
          <div className={styles.visual}>
            <div className={styles.imageStack}>
              <div className={styles.imageBackdrop} />
              <div className={styles.imageWrap}>
                <Image
                  src={c.heroImage}
                  alt="Doctor showing positive results"
                  fill
                  sizes="(max-width: 900px) 90vw, 460px"
                  className={styles.heroImage}
                />
              </div>

              {/* Floating feature pills */}
              {FEATURES.map((f, i) => (
                <div
                  key={i}
                  className={`${styles.featurePill} ${
                    styles[`featurePill_${i + 1}`]
                  }`}
                >
                  <span className={styles.featureIcon}>
                    <Image src={f.icon} alt="" width={28} height={28} />
                  </span>
                  <span className={styles.featureText}>{f.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — Content */}
          <div className={styles.content}>
            <h2 className={styles.heading}>
              {c.headingMain}{" "}
              <span className={styles.headingAccent}>{c.headingAccent}</span>
            </h2>

            <p className={styles.subcopy}>
             {c.subcopy}
            </p>

            {/* Compact accordion benefits */}
            <div className={styles.benefits} role="tablist">
              {BENEFITS.map((b) => {
                const isActive = activeBenefit === b.id;
                return (
                  <div
                    key={b.id}
                    className={`${styles.benefit} ${
                      isActive ? styles.benefitActive : ""
                    }`}
                  >
                    <button
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      className={styles.benefitTrigger}
                      onClick={() => setActiveBenefit(b.id)}
                    >
                      <span className={styles.benefitCheck} aria-hidden="true">
                        ✓
                      </span>
                      <span className={styles.benefitTitle}>{b.title}</span>
                    </button>
                    <div className={styles.benefitPanel}>
                      <p className={styles.benefitDescription}>
                        {b.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* CTA row */}
            <div className={styles.ctaRow}>
              <a
                href={c.ctaHref}
                className={styles.primaryCta}
                style={{ textDecoration: "none" }}
              >
               {c.ctaLabel}
                <span className={styles.ctaArrow}>→</span>
              </a>

              <div className={styles.miniStats}>
                {MINI_STATS.map((s, i) => (
                  <Fragment key={s.label}>
                    <div className={styles.miniStatItem}>
                      <span className={styles.miniStatValue}>{s.value}</span>
                      <span className={styles.miniStatLabel}>{s.label}</span>
                    </div>
                    {i < MINI_STATS.length - 1 && (
                      <div className={styles.miniStatDivider} />
                    )}
                  </Fragment>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
