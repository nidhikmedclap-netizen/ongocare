"use client";

import { useOnboard, useScreenContent } from "./OnboardContext";
import { getCurrentLbs, projectTwentyPercentLossLbs } from "./constants";
import WeightProjection from "./WeightProjection";

/** Prefer entered weight; fall back to wtHigh so the chart always renders on iGood. */
function resolveProjectionCurrentLbs(form) {
  const entered = getCurrentLbs(form);
  if (entered > 0) return entered;
  const high = parseFloat(form.wtHigh);
  if (high > 0) return high;
  const low = parseFloat(form.wtLow);
  if (low > 0) return low;
  return 200;
}

const iGoodDefaults = {
  title: "Good news!",
  bodyStart: "Based on this info, ",
  bodyStrong: "you may be eligible",
  bodyEnd: " for GLP-1 treatment. Here's what your journey could look like:",
  ctaLabel: "Continue",
};

export function IGood() {
  const { form, goTo } = useOnboard();
  const c = useScreenContent("iGood", iGoodDefaults);

  const currentLbs = resolveProjectionCurrentLbs(form);
  const lossLbs = projectTwentyPercentLossLbs(currentLbs);
  const goalLbs = Math.max(1, currentLbs - lossLbs);

  return (
    <div className="inter inter-good">
      <div className="ibg" />
      <div className="ic center inter-scroll">
        <div className="ic-body">
          <div className="ititle">{c.title}</div>
          <div className="ibody">
            {c.bodyStart}<strong>{c.bodyStrong}</strong>{c.bodyEnd}
          </div>

          <WeightProjection
            currentLbs={currentLbs}
            goalLbs={goalLbs}
          />
        </div>
        <div className="inter-footer">
          <button
            type="button"
            className="icta inter-cta"
            onClick={() => goTo("iRoad")}
          >
            {c.ctaLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

const iRoadDefaults = {
  title: "Great! Now a few questions",
  subtitle: "Here's what's next on your journey to a personalised plan.",
  step1Title: "Health questions",
  step1Pill: "3–4 min",
  step1Desc: "Answer a few questions about your goals and history.",
  step2Title: "See your match",
  step2Pill: "Instant",
  step2Desc: "Get matched with a treatment plan tailored to you.",
  step3Title: "Book consultation",
  step3Pill: "10–30 min",
  step3Desc: "Pick a time that works — your physician will call you at the scheduled time.",
  step4Title: "Start your plan",
  step4Pill: "2–3 days",
  step4Desc: "Receive medication shipped discreetly to your door.",
  trust1: "Licensed physicians",
  trust2: "HIPAA secure",
  ctaLabel: "Continue",
};

export function IRoad() {
  const { goTo } = useOnboard();
  const c = useScreenContent("iRoad", iRoadDefaults);

  return (
    <div className="inter inter-road">
      <div className="ibg" />
      <div className="ic center inter-scroll">
        <div className="ic-body">
          <div className="ir-hero" aria-hidden>
            <svg
              className="ir-hero-svg"
              viewBox="0 0 380 120"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="irPath" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="var(--wlf-brand)" />
                  <stop offset="100%" stopColor="var(--wlf-brand-light)" />
                </linearGradient>
              </defs>

              <path
                d="M 50 60 C 110 60, 130 60, 160 60 S 230 60, 270 60 S 340 60, 360 60"
                stroke="var(--wlf-border-strong)"
                strokeWidth="2"
                strokeDasharray="3 5"
                fill="none"
                strokeLinecap="round"
              />

              <path
                className="ir-hero-path"
                d="M 50 60 C 110 60, 130 60, 160 60 S 230 60, 270 60 S 340 60, 360 60"
                stroke="url(#irPath)"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
                pathLength={1}
              />

              {[
                { cx: 50,  delay: "0s",   icon: "♡",  size: 14 },
                { cx: 153, delay: "0.6s", icon: "✓",  size: 14 },
                { cx: 256, delay: "1.2s", icon: "📅", size: 12 },
                { cx: 360, delay: "1.8s", icon: "★",  size: 14 },
              ].map((m, i) => (
                <g key={i} className="ir-hero-node" style={{ animationDelay: m.delay }}>
                  <circle
                    cx={m.cx} cy="60" r="22"
                    fill="var(--wlf-brand-soft)"
                    className="ir-hero-halo"
                    style={{ animationDelay: m.delay }}
                  />
                  <circle
                    cx={m.cx} cy="60" r="14"
                    fill="var(--wlf-brand)"
                    stroke="#fff"
                    strokeWidth="2.5"
                    className="ir-hero-dot"
                    style={{ animationDelay: m.delay }}
                  />
                  <text
                    x={m.cx} y="65"
                    textAnchor="middle"
                    fontSize={m.size}
                    fill="#fff"
                    fontWeight="700"
                    className="ir-hero-icon"
                    style={{ animationDelay: m.delay }}
                  >
                    {m.icon}
                  </text>
                </g>
              ))}
            </svg>
          </div>

          <div className="ititle ir-title">
            {c.title}
          </div>
          <div className="ibody ir-sub">
            {c.subtitle}
          </div>

          <div className="ir-steps">
            <div className="ir-step is-active">
              <div className="ir-step-icon">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </div>
              <div className="ir-step-text">
                <div className="ir-step-row">
                  <span className="ir-step-title">{c.step1Title}</span>
                  <span className="ir-step-pill">{c.step1Pill}</span>
                </div>
                <div className="ir-step-desc">
                  {c.step1Desc}
                </div>
              </div>
            </div>

            <div className="ir-step">
              <div className="ir-step-icon">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 12l2 2 4-4" />
                  <circle cx="12" cy="12" r="10" />
                </svg>
              </div>
              <div className="ir-step-text">
                <div className="ir-step-row">
                  <span className="ir-step-title">{c.step2Title}</span>
                  <span className="ir-step-pill ir-step-pill-soft">{c.step2Pill}</span>
                </div>
                <div className="ir-step-desc">
                  {c.step2Desc}
                </div>
              </div>
            </div>

            <div className="ir-step">
              <div className="ir-step-icon">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <path d="M16 2v4M8 2v4M3 10h18" />
                </svg>
              </div>
              <div className="ir-step-text">
                <div className="ir-step-row">
                  <span className="ir-step-title">{c.step3Title}</span>
                  <span className="ir-step-pill ir-step-pill-soft">{c.step3Pill}</span>
                </div>
                <div className="ir-step-desc">
                  {c.step3Desc}
                </div>
              </div>
            </div>

            <div className="ir-step">
              <div className="ir-step-icon">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
              <div className="ir-step-text">
                <div className="ir-step-row">
                  <span className="ir-step-title">{c.step4Title}</span>
                  <span className="ir-step-pill ir-step-pill-soft">{c.step4Pill}</span>
                </div>
                <div className="ir-step-desc">
                  {c.step4Desc}
                </div>
              </div>
            </div>
          </div>

          <div className="ir-trust">
            <div className="ir-trust-item">
              <span className="ir-trust-icon" aria-hidden>
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </span>
              {c.trust1}
            </div>
            <div className="ir-trust-item">
              <span className="ir-trust-icon" aria-hidden>
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </span>
              {c.trust2}
            </div>
          </div>
        </div>
        <div className="inter-footer">
          <button
            type="button"
            className="icta inter-cta"
            onClick={() => goTo("s4")}
          >
            {c.ctaLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
