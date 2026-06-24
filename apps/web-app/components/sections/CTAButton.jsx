"use client";

import { Fragment, useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import styles from "./CTAButton.module.css";

const defaultContent = {
  eyebrow: "Clinician-Supervised Lifestyle Guidance",
  headingMain: "A personalized plan designed for",
  headingAccent: "long-term success",
  rotatingText: "★ MODERN HEALTHCARE · MODERN CARE  ",
  cardTitle: "Lifestyle support\nmade just for you",
  cardText:
    "We believe that progress over perfection matters. That's why each plan includes nutrition tips and physical activity guidance at every step of your journey.",
  stats: [
    { value: "-29.3 lbs", label: "Avg loss in 6 months" },
    { value: "92%", label: "See visible results" },
  ],
  cardHint: "Drag the slider to see real results",
  footerText: "We're promoting safe, steady, and sustainable weight loss.",
  footerLink: "We're here for those who choose progress →",
  beforeImage: "/images/healthy.webp",
  afterImage: "/images/slimmer.webp",
};

export default function CTAButton({ content }) {
  const c = { ...defaultContent, ...(content || {}) };
  const ROTATING_TEXT = c.rotatingText;
  const [position, setPosition] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [showAutoDemo, setShowAutoDemo] = useState(false);
  const containerRef = useRef(null);
  const isDraggingRef = useRef(false);

  const updatePosition = useCallback((clientX) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setPosition(Math.max(0, Math.min(100, percentage)));
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !showAutoDemo) {
          setShowAutoDemo(true);

         const sequence = [
  { pos: 100, delay: 1000 },
  { pos: 0, delay: 2500 },
];
          sequence.forEach(({ pos, delay }) => {
            setTimeout(() => {
              if (!isDraggingRef.current && !hasInteracted) {
                setPosition(pos);
              }
            }, delay);
          });

          observer.disconnect();
        }
      },
      { threshold: 0.4 }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [showAutoDemo, hasInteracted]);

  useEffect(() => {
    const handleMove = (e) => {
      if (!isDraggingRef.current) return;
      const clientX =
        "touches" in e ? e.touches[0].clientX : e.clientX;
      updatePosition(clientX);
    };

    const handleEnd = () => {
      isDraggingRef.current = false;
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleEnd);
    document.addEventListener("touchmove", handleMove, { passive: false });
    document.addEventListener("touchend", handleEnd);

    return () => {
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleEnd);
      document.removeEventListener("touchmove", handleMove);
      document.removeEventListener("touchend", handleEnd);
    };
  }, [updatePosition]);

  const handleStart = (clientX) => {
    isDraggingRef.current = true;
    setIsDragging(true);
    setHasInteracted(true);
    updatePosition(clientX);
  };

  const handleKeyDown = (e) => {
    setHasInteracted(true);
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setPosition((p) => Math.max(0, p - 5));
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      setPosition((p) => Math.min(100, p + 5));
    }
  };

  const sliderTransition =
    showAutoDemo && !hasInteracted && !isDragging
      ? "all 0.8s cubic-bezier(0.4, 0, 0.2, 1)"
      : isDragging
      ? "none"
      : "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)";

  const showingMostlyAfter = position > 50;
  const showingMostlyBefore = position < 50;

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <p className={styles.eyebrow}>
          {c.eyebrow}
        </p>

        <h2 className={styles.heading}>
          {c.headingMain}
          <br />
          <span className={styles.headingAccent}>{c.headingAccent}</span>
        </h2>

        <article className={styles.card}>
          {/* Rotating badge */}
          <div className={styles.rotatingBadge} aria-hidden="true">
            <svg viewBox="0 0 200 200" className={styles.rotatingSvg}>
              <defs>
                <path
                  id="circlePath"
                  d="M 100, 100 m -78, 0 a 78,78 0 1,1 156,0 a 78,78 0 1,1 -156,0"
                />
              </defs>
              <text className={styles.rotatingText}>
                <textPath href="#circlePath" startOffset="0">
                  {ROTATING_TEXT.repeat(2)}
                </textPath>
              </text>
            </svg>
            <span className={styles.badgeCenter} />
          </div>

          {/* LEFT — Crossfade comparison */}
          <div
            ref={containerRef}
            className={`${styles.compareWrap} ${
              isDragging ? styles.compareWrap_active : ""
            }`}
          >
            {/* BASE LAYER — fat girl (BEFORE) always at full opacity */}
            <Image
              src={c.beforeImage}
              alt="Before weight loss program"
              fill
              sizes="(max-width: 600px) 100vw, (max-width: 1024px) 50vw, 600px"
              className={`${styles.compareImage} ${styles.beforeImage}`}
              draggable={false}
            />

            {/* OVERLAY LAYER — slim girl (AFTER) opacity controlled by slider */}
            <Image
              src={c.afterImage}
              alt="After weight loss program"
              fill
              sizes="(max-width: 600px) 100vw, (max-width: 1024px) 50vw, 600px"
              className={`${styles.compareImage} ${styles.afterImage}`}
              style={{
                opacity: position / 100,
                transition: sliderTransition,
              }}
              draggable={false}
            />

            {/* Labels with dynamic emphasis */}
            <span
              className={`${styles.labelBefore} ${
                showingMostlyBefore ? styles.labelBright : styles.labelDim
              }`}
            >
              BEFORE
            </span>
            <span
              className={`${styles.labelAfter} ${
                showingMostlyAfter ? styles.labelBright : styles.labelDim
              }`}
            >
              AFTER
            </span>

            {/* Bottom transformation track + handle */}
            <div
              className={styles.sliderTrack}
              onMouseDown={(e) => handleStart(e.clientX)}
              onTouchStart={(e) => handleStart(e.touches[0].clientX)}
            >
              {/* Filled portion of track */}
              <div
                className={styles.sliderFill}
                style={{
                  width: `${position}%`,
                  transition: sliderTransition,
                }}
              />

              {/* Drag handle */}
              <div
                className={`${styles.handle} ${
                  isDragging ? styles.handleActive : ""
                } ${!hasInteracted ? styles.handlePulsing : ""}`}
                style={{
                  left: `${position}%`,
                  transition: sliderTransition,
                }}
                role="slider"
                aria-label="Compare before and after"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(position)}
                tabIndex={0}
                onKeyDown={handleKeyDown}
              >
                <span className={styles.handleArrow}>‹</span>
                <span className={styles.handleGrip}>
                  <span className={styles.gripDot} />
                  <span className={styles.gripDot} />
                  <span className={styles.gripDot} />
                </span>
                <span className={styles.handleArrow}>›</span>
              </div>

              {/* Track labels */}
              <span className={styles.trackLabelLeft}>BEFORE</span>
              <span className={styles.trackLabelRight}>AFTER</span>
            </div>

            {/* "Drag me" tooltip — disappears once user interacts */}
            {!hasInteracted && (
              <div className={styles.dragTooltip} aria-hidden="true">
                <span className={styles.dragTooltipText}>
                  Drag to see her transformation
                </span>
                <span className={styles.dragTooltipArrow}>→</span>
              </div>
            )}

            {/* Position % indicator */}
            <div className={styles.positionIndicator}>
              <span className={styles.positionLabel}>
                {Math.round(position)}% transformed
              </span>
            </div>
          </div>

          {/* RIGHT — content */}
          <div className={styles.cardContent}>
            <h3 className={styles.cardTitle} style={{ whiteSpace: "pre-line" }}>
              {c.cardTitle}
            </h3>
            <p className={styles.cardText}>
              {c.cardText}
            </p>

            <div className={styles.stats}>
              {c.stats.map((s, i) => (
                <Fragment key={s.label}>
                  <div className={styles.statItem}>
                    <span className={styles.statValue}>{s.value}</span>
                    <span className={styles.statLabel}>{s.label}</span>
                  </div>
                  {i < c.stats.length - 1 && (
                    <div className={styles.statDivider} />
                  )}
                </Fragment>
              ))}
            </div>

            <p className={styles.cardHint}>
              <span className={styles.hintDot} />
              {c.cardHint}
            </p>
          </div>
        </article>

        <footer className={styles.footer}>
          <p className={styles.footerText}>
            {c.footerText}
          </p>
          <a href="#details" className={styles.footerLink}>
            {c.footerLink}
          </a>
        </footer>
      </div>
    </section>
  );
}
