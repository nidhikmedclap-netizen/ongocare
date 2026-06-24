"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { redirectAfterAuth } from "@/lib/auth/redirectAfterAuth";
import { dashboardPathForRole } from "@/lib/urls/dashboardPaths";
import { useAuthUser } from "@/lib/auth/useAuthUser";
import { saveOnboardingProgress } from "../firebaseClient";
import { isValidEmail } from "../utils";
import { useOnboard, useScreenContent } from "./OnboardContext";

const iConfirmDefaults = {
  title: "You're all set!",
  body:
    "Your consultation is booked. Check your email for prep instructions. Your doctor will review your intake before the call.",
  confirmedTitle: "Consultation confirmed",
  fallbackTime: "Your selected time",
  channel: "Phone consultation",
  expectTitle: "What to expect",
  expectBody:
    "Your doctor will discuss your goals and prescribe a personalised GLP-1 plan if clinically appropriate.",
  ctaLabel: "Go to your patient portal →",
};

export function IConfirm() {
  const { form } = useOnboard();
  const c = useScreenContent("iConfirm", iConfirmDefaults);
  const router = useRouter();
  const { profile } = useAuthUser();

  useEffect(() => {
    let active = true;

    async function completeOnboarding() {
      if (profile?.status === "onboarded") {
        await redirectAfterAuth({
          router,
          role: "patient",
          orgSlug: profile?.orgSlug || form.orgSlug,
          defaultNext: dashboardPathForRole(
            "patient",
            profile?.orgSlug || form.orgSlug,
          ),
        });
        return;
      }

      await saveOnboardingProgress(form, "iConfirm", "onboarded", form.orgSlug || "");
      if (!active) return;

      await redirectAfterAuth({
        router,
        role: "patient",
        orgSlug: profile?.orgSlug || form.orgSlug,
        defaultNext: dashboardPathForRole(
          "patient",
          profile?.orgSlug || form.orgSlug,
        ),
      });
    }

    void completeOnboarding();
    return () => {
      active = false;
    };
    // Run once when the confirmation screen mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="inter">
      <div className="ibg" />
      <div className="ic center">
        <div className="ic-body">
          <div className="iconfirm-tick">✓</div>
          <div
            className="ititle"
            style={{ fontSize: 26, marginBottom: 10 }}
          >
            {c.title}
          </div>
          <div className="ibody">
            {c.body}
          </div>
          <div className="cbox">
            <strong>{c.confirmedTitle}</strong>
            <span>
              {form.slot
                ? form.slot.replace("|", " · ")
                : c.fallbackTime}{" "}
              · {c.channel}
            </span>
          </div>
          <div className="cbox">
            <strong>{c.expectTitle}</strong>
            <span>
              {c.expectBody}
            </span>
          </div>
        </div>
        <button
          type="button"
          className="icta"
          onClick={() =>
            redirectAfterAuth({
              router,
              role: "patient",
              orgSlug: profile?.orgSlug,
              defaultNext: "/dashboard",
            })
          }
        >
          {c.ctaLabel}
        </button>
      </div>
    </div>
  );
}

const dHardDefaults = {
  title: "We want to keep you safe",
  body:
    "Based on your answers, GLP-1 medications may not be appropriate for you at this time. Please speak with your primary care physician for personalised guidance.",
  emailPlaceholder: "Your email — we'll share helpful resources",
  ctaLabel: "Keep me updated",
  capturedEmailNote:
    "We saved your account under {email}. You can return to your dashboard any time.",
  dashboardCtaLabel: "Go to your dashboard",
};

export function DHard() {
  const { form, updateField, goTo, submitMauticOnComplete } = useOnboard();
  const c = useScreenContent("dHard", dHardDefaults);
  const router = useRouter();
  const { profile } = useAuthUser();
  const hasCapturedEmail = isValidEmail(form.email);

  return (
    <div className="disq">
      <div className="di-art" aria-hidden>
        <svg
          className="di-svg"
          viewBox="0 0 320 280"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="diHeart" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="var(--wlf-brand-light)" />
              <stop offset="100%" stopColor="var(--wlf-brand)" />
            </linearGradient>
            <radialGradient id="diHalo" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="var(--wlf-brand-soft)" stopOpacity="0.95" />
              <stop offset="60%" stopColor="var(--wlf-brand-soft)" stopOpacity="0.45" />
              <stop offset="100%" stopColor="var(--wlf-brand-soft)" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="diMedallion" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.92)" />
              <stop offset="100%" stopColor="var(--wlf-brand-soft)" stopOpacity="0.5" />
            </linearGradient>
            <clipPath id="diMedallionClip">
              <circle cx="160" cy="140" r="92" />
            </clipPath>
          </defs>

          <circle
            className="di-halo"
            cx="160" cy="140" r="140"
            fill="url(#diHalo)"
          />

          <circle
            className="di-ring"
            cx="160" cy="140" r="118"
            fill="none"
            stroke="var(--wlf-brand-light)"
            strokeWidth="1.5"
            strokeDasharray="2 8"
            opacity="0.5"
          />

          <g className="di-sparkles">
            <circle className="di-spark di-spark-1" cx="58"  cy="56"  r="3" fill="var(--wlf-brand-light)" />
            <circle className="di-spark di-spark-2" cx="262" cy="68"  r="2.5" fill="var(--wlf-brand)" />
            <circle className="di-spark di-spark-3" cx="284" cy="200" r="3" fill="var(--wlf-brand-light)" />
            <circle className="di-spark di-spark-4" cx="42"  cy="218" r="2.5" fill="var(--wlf-brand)" />
            <circle className="di-spark di-spark-5" cx="206" cy="36"  r="2" fill="var(--wlf-brand-light)" />
            <circle className="di-spark di-spark-6" cx="36"  cy="138" r="2" fill="var(--wlf-brand)" />
            <circle className="di-spark di-spark-7" cx="288" cy="142" r="2.5" fill="var(--wlf-brand-light)" />
          </g>

          <circle
            cx="160" cy="140" r="92"
            fill="url(#diMedallion)"
            stroke="rgba(52, 126, 93, 0.14)"
            strokeWidth="1"
          />

          <g clipPath="url(#diMedallionClip)">
            <path
              d="M 60 178 L 108 178 L 118 162 L 132 200 L 146 178 L 174 178 L 184 168 L 194 190 L 204 178 L 260 178"
              stroke="var(--wlf-brand-dark)"
              strokeWidth="1.8"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.18"
            />
            <path
              className="di-pulse"
              d="M 60 178 L 108 178 L 118 162 L 132 200 L 146 178 L 174 178 L 184 168 L 194 190 L 204 178 L 260 178"
              stroke="var(--wlf-brand)"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={1}
            />
          </g>

          <g className="di-heart-wrap" transform="translate(160 124)">
            <g className="di-heart">
              <ellipse
                className="di-heart-shadow"
                cx="0" cy="40" rx="38" ry="5"
                fill="var(--wlf-brand-dark)"
                opacity="0.12"
              />
              <path
                d="M 0 22 C -50 -8, -50 -43, -20 -43 C -10 -43, -2 -36, 0 -26 C 2 -36, 10 -43, 20 -43 C 50 -43, 50 -8, 0 22 Z"
                fill="url(#diHeart)"
              />
              <path
                d="M -28 -28 Q -24 -36, -14 -36"
                stroke="rgba(255,255,255,0.55)"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
              />
            </g>
          </g>

          <circle
            className="di-ripple di-ripple-1"
            cx="160" cy="140" r="92"
            fill="none"
            stroke="var(--wlf-brand)"
            strokeWidth="2"
          />
          <circle
            className="di-ripple di-ripple-2"
            cx="160" cy="140" r="92"
            fill="none"
            stroke="var(--wlf-brand)"
            strokeWidth="2"
          />
        </svg>
      </div>

      <div className="dt">{c.title}</div>
      <div className="db">
        {c.body}
      </div>

      {hasCapturedEmail ? (
        <>
          <div
            className="db"
            style={{ maxWidth: 360, marginTop: 8, fontSize: 15, lineHeight: 1.5 }}
          >
            {(c.capturedEmailNote ?? "").replace("{email}", form.email)}
          </div>
          <button
            type="button"
            className="cta"
            style={{ maxWidth: 320, marginTop: 16 }}
            onClick={() =>
              redirectAfterAuth({
                router,
                role: "patient",
                orgSlug: profile?.orgSlug,
                defaultNext: dashboardPathForRole("patient", profile?.orgSlug),
              })
            }
          >
            {c.dashboardCtaLabel}
          </button>
        </>
      ) : (
        <>
          <input
            className="inp"
            type="email"
            placeholder={c.emailPlaceholder}
            style={{ maxWidth: 320, textAlign: "center" }}
            value={form.email}
            onChange={(event) => updateField("email", event.target.value)}
          />
          <button
            type="button"
            className="cta"
            style={{ maxWidth: 320, marginTop: 10 }}
            disabled={!isValidEmail(form.email)}
            onClick={() => {
              submitMauticOnComplete({}, "iThanks");
              goTo("iThanks");
            }}
          >
            {c.ctaLabel}
          </button>
        </>
      )}
    </div>
  );
}

const iThanksDefaults = {
  title: "Thanks — you're on the list",
  bodyTemplate:
    "We'll send helpful resources to {email}. In the meantime, please reach out to your primary care provider for personalised guidance.",
  dashboardCtaLabel: "Go to your dashboard",
};

export function IThanks() {
  const { form, authenticatedUid } = useOnboard();
  const c = useScreenContent("iThanks", iThanksDefaults);
  const router = useRouter();
  const { profile } = useAuthUser();
  const bodyParts = (c.bodyTemplate ?? "").split("{email}");
  const showDashboardCta =
    !!authenticatedUid || isValidEmail(form.email);

  return (
    <div className="inter">
      <div className="ibg" />
      <div className="ic center">
        <div className="ic-body">
          <div className="th-art" aria-hidden>
            <svg
              className="th-svg"
              viewBox="0 0 320 280"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="thBadge" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="var(--wlf-brand-light)" />
                  <stop offset="100%" stopColor="var(--wlf-brand)" />
                </linearGradient>
                <radialGradient id="thHalo" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="var(--wlf-brand-soft)" stopOpacity="0.95" />
                  <stop offset="60%" stopColor="var(--wlf-brand-soft)" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="var(--wlf-brand-soft)" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="thMedallion" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.92)" />
                  <stop offset="100%" stopColor="var(--wlf-brand-soft)" stopOpacity="0.5" />
                </linearGradient>
              </defs>

              <circle
                className="th-halo"
                cx="160" cy="140" r="140"
                fill="url(#thHalo)"
              />

              <circle
                className="th-ring"
                cx="160" cy="140" r="118"
                fill="none"
                stroke="var(--wlf-brand-light)"
                strokeWidth="1.5"
                strokeDasharray="2 8"
                opacity="0.55"
              />

              <g>
                <circle className="th-spark th-spark-1" cx="58"  cy="56"  r="3"   fill="var(--wlf-brand-light)" />
                <circle className="th-spark th-spark-2" cx="262" cy="68"  r="2.5" fill="var(--wlf-brand)" />
                <circle className="th-spark th-spark-3" cx="284" cy="200" r="3"   fill="var(--wlf-brand-light)" />
                <circle className="th-spark th-spark-4" cx="42"  cy="218" r="2.5" fill="var(--wlf-brand)" />
                <circle className="th-spark th-spark-5" cx="206" cy="36"  r="2"   fill="var(--wlf-brand-light)" />
                <circle className="th-spark th-spark-6" cx="36"  cy="138" r="2"   fill="var(--wlf-brand)" />
                <circle className="th-spark th-spark-7" cx="288" cy="142" r="2.5" fill="var(--wlf-brand-light)" />
              </g>

              <circle
                cx="160" cy="140" r="92"
                fill="url(#thMedallion)"
                stroke="rgba(52, 126, 93, 0.14)"
                strokeWidth="1"
              />

              <g className="th-rays" stroke="var(--wlf-brand)" strokeWidth="3" strokeLinecap="round">
                <line className="th-ray th-ray-1" x1="160" y1="68"  x2="160" y2="84"  />
                <line className="th-ray th-ray-2" x1="206" y1="80"  x2="196" y2="93"  />
                <line className="th-ray th-ray-3" x1="232" y1="124" x2="217" y2="129" />
                <line className="th-ray th-ray-4" x1="232" y1="156" x2="217" y2="151" />
                <line className="th-ray th-ray-5" x1="206" y1="200" x2="196" y2="187" />
                <line className="th-ray th-ray-6" x1="160" y1="212" x2="160" y2="196" />
                <line className="th-ray th-ray-7" x1="114" y1="200" x2="124" y2="187" />
                <line className="th-ray th-ray-8" x1="88"  y1="156" x2="103" y2="151" />
                <line className="th-ray th-ray-9" x1="88"  y1="124" x2="103" y2="129" />
                <line className="th-ray th-ray-10" x1="114" y1="80"  x2="124" y2="93"  />
              </g>

              <g className="th-badge-wrap" transform="translate(160 140)">
                <g className="th-badge">
                  <ellipse cx="0" cy="58" rx="48" ry="6" fill="var(--wlf-brand-dark)" opacity="0.14" />
                  <circle r="56" fill="url(#thBadge)" />
                  <ellipse cx="0" cy="-22" rx="36" ry="14" fill="rgba(255,255,255,0.22)" />
                  <path
                    className="th-check"
                    d="M -22 2 L -8 18 L 24 -18"
                    stroke="#FFFFFF"
                    strokeWidth="7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                    pathLength={1}
                  />
                </g>
              </g>

              <circle
                className="th-ripple th-ripple-1"
                cx="160" cy="140" r="92"
                fill="none"
                stroke="var(--wlf-brand)"
                strokeWidth="2"
              />
              <circle
                className="th-ripple th-ripple-2"
                cx="160" cy="140" r="92"
                fill="none"
                stroke="var(--wlf-brand)"
                strokeWidth="2"
              />
            </svg>
          </div>

          <div
            className="ititle"
            style={{ fontSize: 26, marginBottom: 10 }}
          >
            {c.title}
          </div>
          <div className="ibody">
            {bodyParts[0]}<strong>{form.email}</strong>{bodyParts[1] ?? ""}
          </div>
        </div>
        {showDashboardCta && (
          <button
            type="button"
            className="icta"
            onClick={() =>
              redirectAfterAuth({
                router,
                role: "patient",
                orgSlug: profile?.orgSlug,
                defaultNext: dashboardPathForRole("patient", profile?.orgSlug),
              })
            }
          >
            {c.dashboardCtaLabel}
          </button>
        )}
      </div>
    </div>
  );
}
