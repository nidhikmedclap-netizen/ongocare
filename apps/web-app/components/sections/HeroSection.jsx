"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import styles from "./HeroSection.module.css";
import { WEGOVY_PAGE } from "@/lib/medications/pages";

const defaultContent = {
  eyebrow: "JOIN 5,000+ PATIENTS WHO STARTED THEIR GLP-1 JOURNEY",
  headingMain: "Science-backed",
  headingItalic: " GLP-1 weight loss",
  headingSuffix: "  program",
  subcopy:
    "Receive GLP-1 evaluations and prescriptions personalized to your body and treatment goals.",
  ctaLabel: "Start My Medical Evaluation",
  ctaHref: "/weightloss-onboard",
  trustBadges: [
    "Board-certified Physicians",
    "HIPAA Compliant Platform",
    "100% Online Consultations",
  ],
  disclaimer: "Prescription approvals are subject to the doctor's discretion.",
  cards: [
    { src: "/images/glp-c.webp", label: "Wegovy", color: "#9b6dff", href: WEGOVY_PAGE },
    { src: "/images/glp-b.webp", label: "Mounjaro", color: "#2bb8a3" },
    { src: "/images/glp-a.webp", label: "Zepbound", color: "#7c5cd6" },
    { src: "/images/glp-d.webp", label: "Novo", color: "#e7508f" },
    { src: "/images/glp-e.webp", label: "Ozempic", color: "#ee8a4f" },
  ],
};

const drops = [
  { x: "4%",  size: 6,  duration: 7.5, delay: 0,    drift: 18 },
  { x: "9%",  size: 5,  duration: 9,   delay: 1.6,  drift: -22, dot: true },
  { x: "14%", size: 7,  duration: 6.5, delay: 3.2,  drift: 12 },
  { x: "19%", size: 4,  duration: 8.5, delay: 0.8,  drift: -10, dot: true },
  { x: "24%", size: 8,  duration: 7,   delay: 2.4,  drift: 26 },
  { x: "29%", size: 5,  duration: 9.5, delay: 4,    drift: -18 },
  { x: "34%", size: 6,  duration: 8,   delay: 1.2,  drift: 14, dot: true },
  { x: "39%", size: 7,  duration: 6.8, delay: 3.6,  drift: -24 },
  { x: "44%", size: 5,  duration: 9.2, delay: 0.4,  drift: 20 },
  { x: "49%", size: 6,  duration: 7.6, delay: 2.8,  drift: -12, dot: true },
  { x: "54%", size: 8,  duration: 6.4, delay: 1.8,  drift: 22 },
  { x: "59%", size: 4,  duration: 9.8, delay: 4.4,  drift: -16, dot: true },
  { x: "64%", size: 7,  duration: 7.2, delay: 0.6,  drift: 18 },
  { x: "69%", size: 5,  duration: 8.4, delay: 3,    drift: -20 },
  { x: "74%", size: 6,  duration: 6.6, delay: 1.4,  drift: 16, dot: true },
  { x: "79%", size: 8,  duration: 9,   delay: 2.2,  drift: -26 },
  { x: "84%", size: 5,  duration: 7.8, delay: 0.2,  drift: 14 },
  { x: "89%", size: 7,  duration: 8.6, delay: 3.4,  drift: -18, dot: true },
  { x: "94%", size: 6,  duration: 6.2, delay: 1,    drift: 22 },
  { x: "97%", size: 4,  duration: 9.4, delay: 4.2,  drift: -14, dot: true },
];

export default function HeroSection({ content }) {
  const c = { ...defaultContent, ...(content || {}) };
  const cards = c.cards;
  const trustBadges = c.trustBadges;
  const repeatedCards = [...cards, ...cards, ...cards, ...cards];

  const wrapRef = useRef(null);
  const trackRef = useRef(null);

useEffect(() => {
  const wrap = wrapRef.current;
  const track = trackRef.current;
  if (!wrap || !track) return;

  const prefersReducedMotion =
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  if (prefersReducedMotion) return;

  const isMobile = () => window.innerWidth <= 767;

  const cardEls = Array.from(track.children);
  const rectBuffer = new Array(cardEls.length);

  let rafId = 0;
  let isVisible = false;
  let wrapRect = wrap.getBoundingClientRect();

  const clearTransforms = () => {
    for (let i = 0; i < cardEls.length; i++) cardEls[i].style.transform = "";
  };

  const update = () => {
    if (!isVisible || isMobile()) {
      rafId = 0;
      return;
    }

    const wrapCenter = wrapRect.left + wrapRect.width / 2;
    const wrapHalfWidth = wrapRect.width / 2;
    for (let i = 0; i < cardEls.length; i++) {
      rectBuffer[i] = cardEls[i].getBoundingClientRect();
    }

    for (let i = 0; i < cardEls.length; i++) {
      const cardRect = rectBuffer[i];
      const cardCenter = cardRect.left + cardRect.width / 2;
      const distance = (cardCenter - wrapCenter) / wrapHalfWidth;
      const clamped = distance < -1.2 ? -1.2 : distance > 1.2 ? 1.2 : distance;
      const rotateY = clamped * -45;
      const translateZ = -Math.abs(clamped) * 100;
      cardEls[i].style.transform = `rotateY(${rotateY}deg) translateZ(${translateZ}px)`;
    }

    rafId = requestAnimationFrame(update);
  };

  const start = () => {
    if (rafId !== 0) return;
    if (isMobile()) {
      clearTransforms();
      return;
    }
    rafId = requestAnimationFrame(update);
  };

  const stop = () => {
    if (rafId !== 0) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
  };

  const io = new IntersectionObserver(
    ([entry]) => {
      isVisible = entry.isIntersecting;
      if (isVisible) start();
      else stop();
    },
    { rootMargin: "100px 0px" }
  );
  io.observe(wrap);

  let resizeRaf = 0;
  const handleResize = () => {
    if (resizeRaf) cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(() => {
      wrapRect = wrap.getBoundingClientRect();
      if (isMobile()) {
        stop();
        clearTransforms();
      } else if (isVisible) {
        start();
      }
    });
  };

  let scrollRaf = 0;
  const handleScroll = () => {
    if (scrollRaf) return;
    scrollRaf = requestAnimationFrame(() => {
      wrapRect = wrap.getBoundingClientRect();
      scrollRaf = 0;
    });
  };

  window.addEventListener("resize", handleResize);
  window.addEventListener("scroll", handleScroll, { passive: true });

  return () => {
    io.disconnect();
    stop();
    if (resizeRaf) cancelAnimationFrame(resizeRaf);
    if (scrollRaf) cancelAnimationFrame(scrollRaf);
    window.removeEventListener("resize", handleResize);
    window.removeEventListener("scroll", handleScroll);
  };
}, []);

  return (
    <section className={styles.hero}>
      {/* Floating decorative orbs */}
      <span className={`${styles.orb} ${styles.orb_1}`} aria-hidden="true" />
      <span className={`${styles.orb} ${styles.orb_2}`} aria-hidden="true" />
      <span className={`${styles.orb} ${styles.orb_3}`} aria-hidden="true" />
      <span className={`${styles.orb} ${styles.orb_4}`} aria-hidden="true" />

      {/* Themed rain — falls behind content, picks up theme colors */}
      <div className={styles.rain} aria-hidden="true">
        {drops.map((d, i) => (
          <span
            key={i}
            className={`${styles.drop} ${d.dot ? styles.dropDot : ""}`}
            style={{
              "--x": d.x,
              "--size": `${d.size}px`,
              "--duration": `${d.duration}s`,
              "--delay": `${d.delay}s`,
              "--drift": `${d.drift}px`,
            }}
          />
        ))}
      </div>

      <div className={styles.container}>
        <div className={styles.content}>
          <span className={styles.eyebrow}>
            <span className={styles.eyebrowDot} />
            {c.eyebrow}
          </span>

          <h1 className={styles.heading}>
            {c.headingMain}
            <br />
            <span className={styles.headingItalic}>{c.headingItalic}</span>{c.headingSuffix}
          </h1>

          <p className={styles.subcopy}>
            {c.subcopy}
          </p>

          <div className={styles.actionRow}>
            <a
              href={c.ctaHref}
              className={styles.primaryBtn}
              style={{ textDecoration: "none" }}
            >
             {c.ctaLabel}
              <span className={styles.btnArrow} aria-hidden="true">→</span>
            </a>

            <div className={styles.trustBadges}>
              {trustBadges.map((label) => (
                <span key={label} className={styles.trustBadge}>
                  <span className={styles.trustCheck} aria-hidden="true">✓</span>
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Full-width 3D curved marquee */}
      <div ref={wrapRef} className={styles.marqueeWrap}>
        <div ref={trackRef} className={styles.marqueeTrack}>
          {repeatedCards.map((card, i) => {
            const cardInner = (
              <div
                className={styles.card}
                style={{
                  background: `linear-gradient(135deg, ${card.color}, ${card.color}aa)`,
                }}
              >
                <div className={styles.cardImageWrap}>
                  <Image
                    src={card.src}
                    alt={card.label}
                    fill
                    sizes="(max-width: 480px) 130px, (max-width: 767px) 160px, (max-width: 1024px) 200px, 280px"
                    className={styles.cardImage}
                    priority={i < 5}
                  />
                </div>
                <div className={styles.cardFooter}>
                  <span className={styles.cardLabel}>{card.label}</span>
                  <span className={styles.cardBadge}>FDA · GLP-1</span>
                </div>
              </div>
            );

            return (
              <div key={i} className={styles.cardWrapper}>
                {card.href ? (
                  <a
                    href={card.href}
                    className={styles.cardLink}
                    aria-label={`Learn about ${card.label}`}
                  >
                    {cardInner}
                  </a>
                ) : (
                  cardInner
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className={styles.carouselDisclaimer}>
        <span className={styles.carouselDisclaimerIcon} aria-hidden="true">
          ℹ
        </span>
        <p className={styles.carouselDisclaimerText}>
          {c.disclaimer}
        </p>
      </div>
    </section>
  );
}
