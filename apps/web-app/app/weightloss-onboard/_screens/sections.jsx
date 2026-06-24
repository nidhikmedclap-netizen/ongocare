"use client";

import { useEffect, useRef } from "react";
import { useOnboard } from "./OnboardContext";

export const SECTIONS_ORDER = [
  "weight", "meds", "id", "bariatric",
  "medical", "safety", "lifestyle", "profile",
];

export const SECTION_INFO = {
  weight:    { label: "Weight history",    short: "Weight" },
  meds:      { label: "Medication history", short: "Meds" },
  id:        { label: "Identity",           short: "ID" },
  bariatric: { label: "Surgical history",   short: "Surgery" },
  medical:   { label: "Medical history",    short: "Medical" },
  safety:    { label: "Safety screening",   short: "Safety" },
  lifestyle: { label: "Lifestyle",          short: "Lifestyle" },
  profile:   { label: "Almost done",        short: "Wrap-up" },
};

export const SECTION_SCREENS = {
  weight:    ["s4", "s5", "s6"],
  meds:      ["s7", "s7m", "s7b", "s7a", "s7c", "s7d"],
  id:        ["s7e"],
  bariatric: ["s9", "s9b"],
  medical:   ["s10", "s11"],
  safety:    ["s12", "s13", "s13a", "s14", "s14b", "s15"],
  lifestyle: ["s16", "s17", "s18"],
  // s21 (profile: name/DOB/phone/address) used to live at the END of the
  // form inside this "profile" / Wrap-up section. It now runs right after
  // s20 (email/password), so it's intentionally NOT mapped to a section —
  // the form falls back to the linear progress bar for that screen, like
  // it does for s1, s2, s20. The Wrap-up stepper resumes at s19.
  profile:   ["s19", "s22", "s22b", "s23"],
};

export const SCREEN_TO_SECTION = (() => {
  const map = {};
  Object.keys(SECTION_SCREENS).forEach((section) => {
    SECTION_SCREENS[section].forEach((screenId) => {
      map[screenId] = section;
    });
  });
  return map;
})();

export function SectionStepper({ section, currentScreen: _currentScreen }) {
  const currentIdx = SECTIONS_ORDER.indexOf(section);
  const total = SECTIONS_ORDER.length;
  const { content } = useOnboard();
  const sectionOverrides = content?.sections ?? null;
  const activeRef = useRef(null);

  const currentLabel =
    sectionOverrides?.[section]?.label ?? SECTION_INFO[section].label;

  useEffect(() => {
    activeRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [section]);

  return (
    <div className="step-pills-wrap">
      {/* Compact stepper — fits any phone width without horizontal scroll */}
      <div
        className="step-pills step-pills--mobile"
        aria-label="Form progress"
      >
        <div className="step-pills-mobile-head">
          <span className="step-pills-mobile-label">{currentLabel}</span>
          <span className="step-pills-mobile-count">
            {currentIdx + 1} of {total}
          </span>
        </div>
        <div className="step-pills-mobile-track" role="list">
          {SECTIONS_ORDER.map((sec, i) => {
            const status =
              i < currentIdx ? "done" : i === currentIdx ? "active" : "todo";
            const segLabel =
              sectionOverrides?.[sec]?.short ?? SECTION_INFO[sec].short;
            return (
              <div
                key={sec}
                role="listitem"
                className={`step-pills-mobile-seg step-pills-mobile-seg-${status}`}
                aria-current={status === "active" ? "step" : undefined}
                aria-label={segLabel}
                title={segLabel}
              />
            );
          })}
        </div>
      </div>

      {/* Full pill row — tablet / desktop */}
      <div className="step-pills step-pills--desktop" aria-label="Form progress">
        <div className="step-pills-track">
          {SECTIONS_ORDER.map((sec, i) => {
            const status =
              i < currentIdx ? "done" : i === currentIdx ? "active" : "todo";
            const isLast = i === SECTIONS_ORDER.length - 1;
            const sectionLabel =
              sectionOverrides?.[sec]?.short ?? SECTION_INFO[sec].short;
            return (
              <div key={sec} className="step-pills-cell">
                <div
                  ref={status === "active" ? activeRef : undefined}
                  className={`step-pill step-pill-${status}`}
                  aria-current={status === "active" ? "step" : undefined}
                >
                  {status === "done" && (
                    <span className="step-pill-check" aria-hidden>
                      <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="5 12.5 10 17 19 7.5" />
                      </svg>
                    </span>
                  )}
                  <span className="step-pill-label">
                    {sectionLabel}
                  </span>
                </div>
                {!isLast && (
                  <div
                    className={`step-pills-line ${i < currentIdx ? "is-done" : ""}`}
                    aria-hidden
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
