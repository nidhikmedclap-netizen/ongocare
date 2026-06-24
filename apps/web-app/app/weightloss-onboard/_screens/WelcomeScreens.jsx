"use client";

import { Multi } from "../components";
import { INSPIRATIONS } from "../data";
import { useOnboard, useScreenContent } from "./OnboardContext";
import { WEIGHT_GOAL_CARDS } from "./constants";

const s1Defaults = {
  titleStart: "Let's ",
  titleEm: "personalize",
  titleEnd: "your treatment",
  subtitle: "Answer a few quick questions to match you with the right plan.",
  question: "How much weight would you like to lose?",
  cards: WEIGHT_GOAL_CARDS,
  ctaLabel: "Continue",
  signInPrefix: "Already a member?",
  signInLabel: "Sign In",
  signInHref: "/login",
};

export function S1Welcome() {
  const { form, updateField, goTo } = useOnboard();
  const c = useScreenContent("s1", s1Defaults);

  return (
    <div className="welcome">
      <div className="welcome-hero">
        <div className="welcome-hero-text">
          <h1 className="welcome-title">
            {c.titleStart}<em>{c.titleEm}</em><br />{c.titleEnd}
          </h1>
          <p className="welcome-sub">{c.subtitle}</p>
        </div>
      </div>

      <div className="welcome-card">
        <div className="welcome-q">{c.question}</div>
        <div className="welcome-opts">
          {c.cards.map((card) => {
            const isSelected = form.s1 === card.value;
            return (
              <button
                key={card.value}
                type="button"
                className={`welcome-opt ${isSelected ? "sel" : ""}`}
                onClick={() => updateField("s1", card.value)}
              >
                <span className="welcome-opt-text">
                  <span className="welcome-opt-title">{card.value}</span>
                  <span className="welcome-opt-desc">{card.desc}</span>
                </span>
                <span className="welcome-opt-arrow" aria-hidden>→</span>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          className="cta welcome-cta"
          disabled={!form.s1}
          onClick={() => goTo("s2")}
        >
          {c.ctaLabel}
        </button>
        <div className="welcome-foot">
          {c.signInPrefix} <a href={c.signInHref}>{c.signInLabel}</a>
        </div>
      </div>
    </div>
  );
}

const s2Defaults = {
  pill: "Almost there",
  titleStart: "What's ",
  titleEm: "driving you",
  titleEnd: "right now?",
  subtitle: "Tell us what matters most so we can tailor your plan.",
  question: "What's making you want to start now?",
  questionSub: "Select all that apply.",
  options: INSPIRATIONS,
  ctaLabel: "Continue",
  signInPrefix: "Already a member?",
  signInLabel: "Sign In",
  signInHref: "/login",
};

export function S2Inspiration() {
  const { form, toggleValue, goTo } = useOnboard();
  const c = useScreenContent("s2", s2Defaults);

  return (
    <div className="welcome">
      <div className="welcome-hero">
        <div className="welcome-hero-text">
          <span className="welcome-pill">
            <span className="welcome-pill-dot" />
            {c.pill}
          </span>
          <h1 className="welcome-title">
            {c.titleStart}<em>{c.titleEm}</em><br />{c.titleEnd}
          </h1>
          <p className="welcome-sub">{c.subtitle}</p>
        </div>
      </div>

      <div className="welcome-card">
        <div className="welcome-q">{c.question}</div>
        <div className="welcome-q-sub">{c.questionSub}</div>
        <Multi
          options={c.options}
          values={form.s2}
          onToggle={(value) => toggleValue("s2", value)}
        />
        <button
          type="button"
          className="cta welcome-cta"
          disabled={form.s2.length === 0}
          onClick={() => goTo("s20")}
        >
          {c.ctaLabel}
        </button>
        <div className="welcome-foot">
          {c.signInPrefix} <a href={c.signInHref}>{c.signInLabel}</a>
        </div>
      </div>
    </div>
  );
}
