"use client";

import { useState, useEffect, useRef } from "react";
import styles from "./CreateGLP1Plan.module.css";
import { medicationPath } from "@/lib/medications/pages";

const defaultContent = {
  eyebrow: "OUR MEDICATIONS",
  headingMain: "Find the right medication for your",
  headingAccent: "weight management",
  subcopy:
    "Our providers may prescribe from one of six GLP-1 options depending on medical necessity and your health needs.",
  ctaPrefix: "Get started with",
  disclaimerLead: "Important:",
  disclaimerBody:
    " Medications such as Ozempic, Mounjaro, Rybelsus, and Victoza are not FDA-approved for weight loss but are often prescribed off-label based on medical necessity.",
  disclaimerSmall:
    "Your provider may offer compounded medication based on your eligibility. However, compounded medications are not FDA-approved.",
};

const DEFAULT_MEDICATIONS = [
  {
    id: "wegovy-pill",
    name: "Wegovy®",
    isNew: true,
    description: "Weekly injection helps reduce cravings and support lasting weight management results.",
    benefits: ["FDA Approved", "Once-weekly injection"],
    videoSrc: "/images/wegovy-inj.mp4",
    learnMoreHref: medicationPath("wegovy"),
  },
  {
    id: "zepbound",
    name: "Zepbound®",
    isNew: true,
    description: "Weekly injection helps reduce appetite and support consistent long-term weight loss.",
    benefits: ["FDA Approved", "Once-weekly injection"],
    videoSrc: "/images/zepbound-inj.mp4",
    learnMoreHref: medicationPath("zepbound"),
  },
  {
    id: "ozempic",
    name: "Ozempic®",
    description: "Weekly injection supporting appetite control and healthier long-term weight management goals.",
    benefits: ["FDA Approved", "Once-weekly injection"],
    videoSrc: "/images/ozmepic-inj.mp4",
    offLabel: "Prescribed off-label for weight loss",
    learnMoreHref: medicationPath("ozempic"),
  },
  {
    id: "mounjaro",
    name: "Mounjaro®",
    isNew: true,
    description: "Weekly injection supporting blood sugar balance and sustainable weight loss progress.",
    benefits: ["FDA Approved", "Once-weekly injection"],
    videoSrc: "/images/ozmepic-inj.mp4",
    offLabel: "Prescribed off-label for weight loss",
    learnMoreHref: medicationPath("mounjaro"),
  },
  {
    id: "rybelsus",
    name: "Rybelsus®",
    description: "Daily oral medication supporting balanced blood sugar and gradual weight management support.",
    benefits: ["FDA Approved", "Once-daily tablet"],
    videoSrc: "/images/ryb-tab.mp4",
    offLabel: "Prescribed off-label for weight loss",
    learnMoreHref: medicationPath("rybelsus"),
  },
  {
    id: "liraglutide",
    name: "Liraglutide",
    description: "Daily injection helps control appetite and encourage sustainable long-term weight loss.",
    benefits: ["FDA Approved", "Once-daily injection"],
    videoSrc: "/images/liraglutide-inj.mp4",
    offLabel: "Prescribed off-label for weight loss under the brand name Victoza®",
    learnMoreHref: medicationPath("liraglutide"),
  },
];

const CYCLE_DURATION = 6000;

export default function CreateGLP1Plan({ content }) {
  const c = { ...defaultContent, ...(content || {}) };
  const MEDICATIONS = content?.medications ?? DEFAULT_MEDICATIONS;

  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(Date.now());

  const selected = MEDICATIONS[activeIndex];

  useEffect(() => {
    if (isPaused) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    startTimeRef.current = Date.now();

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const newProgress = (elapsed / CYCLE_DURATION) * 100;

      if (newProgress >= 100) {
        setActiveIndex((prev) => (prev + 1) % MEDICATIONS.length);
        startTimeRef.current = Date.now();
        setProgress(0);
      } else {
        setProgress(newProgress);
      }
    }, 50);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPaused, activeIndex]);

  const handleSelectManual = (index) => {
    setActiveIndex(index);
    setProgress(0);
    startTimeRef.current = Date.now();
  };

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        {/* Header */}
        <header className={styles.header}>
          <p className={styles.eyebrow}>{c.eyebrow}</p>
          <h2 className={styles.heading}>
            {c.headingMain}{" "}
            <span className={styles.headingAccent}>{c.headingAccent}</span>
          </h2>
          <p className={styles.subcopy}>
            {c.subcopy}
          </p>
        </header>

        {/* Stage — video LEFT, info RIGHT */}
        <div
          className={styles.stage}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* LEFT — Video */}
          <div className={styles.videoFrame}>
            <video
              key={selected.id}
              className={styles.video}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
            >
              <source src={selected.videoSrc} type="video/mp4" />
            </video>
          </div>

          {/* RIGHT — Info card */}
          <div key={selected.id + "-info"} className={styles.infoCard}>
            <div className={styles.infoHeader}>
              <h3 className={styles.medName}>{selected.name}</h3>
              {selected.isNew && (
                <span className={styles.newBadge}>NEW</span>
              )}
            </div>

            {selected.description && (
              <p className={styles.medDescription}>{selected.description}</p>
            )}

            <ul className={styles.benefitList}>
              {selected.benefits.map((benefit) => (
                <li key={benefit} className={styles.benefitItem}>
                  <span className={styles.benefitCheck} aria-hidden="true">
                    ✓
                  </span>
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>

            {selected.offLabel && (
              <p className={styles.offLabelNote}>
                <span className={styles.offLabelIcon} aria-hidden="true">
                  ⓘ
                </span>
                <span>{selected.offLabel}</span>
              </p>
            )}

            <div className={styles.ctaRow}>
              <a
                href="/weightloss-onboard"
                className={styles.ctaButton}
                style={{ textDecoration: "none" }}
              >
                {c.ctaPrefix} {selected.name}
                <span aria-hidden="true">→</span>
              </a>
              {selected.learnMoreHref && (
                <a
                  href={selected.learnMoreHref}
                  className={styles.learnMoreLink}
                >
                  Learn about {selected.name.replace("®", "")} →
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className={styles.progressTrack}>
          <div
            className={styles.progressFill}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Pill navigation */}
        <div className={styles.pillNav} role="tablist">
          {MEDICATIONS.map((med, i) => {
            const isActive = i === activeIndex;
            return (
              <button
                key={med.id}
                role="tab"
                aria-selected={isActive}
                className={`${styles.pill} ${
                  isActive ? styles.pillActive : ""
                }`}
                onClick={() => handleSelectManual(i)}
              >
                <span className={styles.pillNumber}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className={styles.pillName}>{med.name}</span>
                {med.isNew && (
                  <span className={styles.pillNewBadge}>NEW</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Disclaimers */}
        <div className={styles.disclaimers}>
          <p className={styles.disclaimer}>
            <span className={styles.disclaimerLink}>{c.disclaimerLead}</span>{c.disclaimerBody}
          </p>
          <p className={styles.disclaimerSmall}>
            {c.disclaimerSmall}
          </p>
        </div>
      </div>
    </section>
  );
}
