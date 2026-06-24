"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./ThemeSwitcher.module.css";

const THEMES = [
  {
    id: "sage",
    name: "Sage",
    primary: "#347e5d",
    primaryDark: "#1b4332",
    primaryLight: "#74c69d",
    primarySoft: "#d8f3dc",
  },
  {
    id: "purple",
    name: "Purple",
    primary: "#7c5cd6",
    primaryDark: "#4c3a9b",
    primaryLight: "#b8a4f0",
    primarySoft: "#f3eefe",
  },
  {
    id: "blue",
    name: "Ocean",
    primary: "#0e7490",
    primaryDark: "#155e75",
    primaryLight: "#67e8f9",
    primarySoft: "#ecfeff",
  },
  {
    id: "wine",
    name: "Wine",
    primary: "#b8455e",
    primaryDark: "#7d2c40",
    primaryLight: "#e8a4b3",
    primarySoft: "#fdf2f4",
  },
];

const STORAGE_KEY = "site-theme";

export default function ThemeSwitcher({ floating = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeId, setActiveId] = useState(THEMES[0].id);
  const wrapperRef = useRef(null);

  const applyTheme = (theme) => {
    const root = document.documentElement;
    root.style.setProperty("--color-primary", theme.primary);
    root.style.setProperty("--color-primary-dark", theme.primaryDark);
    root.style.setProperty("--color-primary-light", theme.primaryLight);
    root.style.setProperty("--color-primary-soft", theme.primarySoft);
    setActiveId(theme.id);
    localStorage.setItem(STORAGE_KEY, theme.id);
  };

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved || saved === THEMES[0].id) {
      setActiveId(THEMES[0].id);
      return;
    }
    const theme = THEMES.find((t) => t.id === saved);
    if (theme) applyTheme(theme);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

  return (
    <div
      className={`${styles.wrapper}${floating ? ` ${styles.floating}` : ""}`}
      ref={wrapperRef}
    >
      <button
        type="button"
        className={styles.toggle}
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        aria-label={isOpen ? "Close theme picker" : "Open theme picker"}
      >
        <span className={styles.toggleIcon} aria-hidden="true">
          🎨
        </span>
      </button>

      <div
        className={`${styles.panel} ${isOpen ? styles.panelOpen : ""}`}
        role="group"
        aria-label="Theme color options"
      >
        <span className={styles.panelLabel}>Theme</span>

        <div className={styles.swatches}>
          {THEMES.map((theme) => (
            <button
              key={theme.id}
              type="button"
              onClick={() => applyTheme(theme)}
              className={`${styles.swatch} ${
                activeId === theme.id ? styles.swatchActive : ""
              }`}
              style={{ backgroundColor: theme.primary }}
              aria-label={`Apply ${theme.name} theme`}
              aria-pressed={activeId === theme.id}
              title={theme.name}
            >
              {activeId === theme.id && (
                <span className={styles.swatchCheck} aria-hidden="true">
                  ✓
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
