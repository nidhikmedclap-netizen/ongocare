"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import styles from "./WelcomePopup.module.css";

const STORAGE_KEY = "welcome-popup-seen";
const DELAY_MS = 2000;

const THEME_PREVIEW = [
  { id: "sage", color: "#347e5d", name: "Sage" },
  { id: "purple", color: "#7c5cd6", name: "Purple" },
  { id: "blue", color: "#0e7490", name: "Ocean" },
  { id: "wine", color: "#b8455e", name: "Wine" },
];

export default function WelcomePopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(STORAGE_KEY)) return;

    const timer = window.setTimeout(() => {
      setIsOpen(true);
      sessionStorage.setItem(STORAGE_KEY, "1");
    }, DELAY_MS);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen]);

  const handleClose = () => {
    setIsClosing(true);
    window.setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, 220);
  };

  if (!isOpen) return null;

  return (
    <div
      className={`${styles.backdrop} ${isClosing ? styles.backdropClosing : ""}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-popup-title"
      onClick={handleClose}
    >
      <div
        className={`${styles.card} ${isClosing ? styles.cardClosing : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className={styles.closeBtn}
          onClick={handleClose}
          aria-label="Close"
        >
          ✕
        </button>

        <span className={styles.eyebrow}>✨ Just shipped</span>
        <h2 id="welcome-popup-title" className={styles.title}>
          Make it <span className={styles.titleAccent}>yours</span>
        </h2>
        <p className={styles.subtitle}>
          Two new ways to explore the site — give them a try.
        </p>

        <div className={styles.features}>
          <div className={styles.feature}>
            <div className={styles.featurePreview}>
              <div className={styles.swatchRow}>
                {THEME_PREVIEW.map((t) => (
                  <span
                    key={t.id}
                    className={styles.swatch}
                    style={{ backgroundColor: t.color }}
                    title={t.name}
                  />
                ))}
              </div>
            </div>
            <div className={styles.featureCopy}>
              <h3 className={styles.featureTitle}>Pick your color theme</h3>
              <p className={styles.featureText}>
                Choose from 4 palettes — tap the 🎨 button at the bottom-right.
              </p>
            </div>
          </div>

          <div className={styles.feature}>
            <div
              className={styles.featurePreview}
              onMouseEnter={() => setHovered(true)}
              onMouseLeave={() => setHovered(false)}
            >
              <div className={styles.beforeAfter}>
                <Image
                  src="/images/fat-girl.webp"
                  alt="Before"
                  fill
                  sizes="200px"
                  className={`${styles.baImage} ${hovered ? styles.baFade : ""}`}
                />
                <Image
                  src="/images/slim-girl.webp"
                  alt="After"
                  fill
                  sizes="200px"
                  className={`${styles.baImage} ${styles.baImageAfter} ${
                    hovered ? styles.baShow : ""
                  }`}
                />
                <span className={styles.baHint}>
                  {hovered ? "After" : "Hover →"}
                </span>
              </div>
            </div>
            <div className={styles.featureCopy}>
              <h3 className={styles.featureTitle}>See before & after</h3>
              <p className={styles.featureText}>
                Hover the weight-loss section to reveal real transformation
                results.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          className={styles.ctaBtn}
          onClick={handleClose}
        >
          Got it, let me explore
        </button>
      </div>
    </div>
  );
}
