// Deep-link back into the weight-loss onboarding form at the saved step.
import { DEFAULT_ORG_SLUG } from "@/lib/orgs";

/** Screens that end a path — not valid resume targets when stored as currentStep. */
export const TERMINAL_ONBOARDING_STEPS = new Set(["iConfirm", "iThanks", "dHard"]);

/** Successful completion — eligible patients only (not the dHard / iThanks off-ramp). */
export const ONBOARDING_SUCCESS_STEPS = new Set(["iConfirm"]);

export function isOnboardingComplete(profile) {
  if (!profile) return false;
  // Disqualified off-ramp is never "complete" even if status was saved incorrectly.
  if (profile.currentStep === "iThanks" || profile.currentStep === "dHard") {
    return false;
  }
  if (profile.status === "onboarded") return true;
  return ONBOARDING_SUCCESS_STEPS.has(profile.currentStep);
}

/** Last main-flow step reached before a terminal off-ramp (for partial progress). */
function progressStepBeforeTerminal(profile, progressOrder) {
  const history = Array.isArray(profile?.onboardingStepHistory)
    ? profile.onboardingStepHistory
    : [];
  for (let i = history.length - 1; i >= 0; i--) {
    const step = history[i];
    if (!step || TERMINAL_ONBOARDING_STEPS.has(step)) continue;
    const idx = progressOrder.indexOf(step);
    if (idx >= 0) return idx;
  }
  const s3Idx = progressOrder.indexOf("s3");
  return s3Idx >= 0 ? s3Idx : -1;
}

/**
 * Progress for the patient dashboard. Terminal success steps count as 100%
 * even if `status` was not yet mirrored to Firestore.
 */
export function computeOnboardingProgress(profile, progressOrder) {
  if (isOnboardingComplete(profile)) {
    return {
      isComplete: true,
      progressPct: 100,
      stepIndex: Math.max(0, progressOrder.length - 1),
    };
  }

  const current = profile?.currentStep;
  if (current === "iThanks" || current === "dHard") {
    const stepIndex = progressStepBeforeTerminal(profile, progressOrder);
    const progressPct =
      stepIndex >= 0
        ? Math.round(((stepIndex + 1) / progressOrder.length) * 100)
        : 0;
    return { isComplete: false, progressPct, stepIndex };
  }

  const resumeStep = getEffectiveResumeStep(profile);
  const stepIndex = resumeStep ? progressOrder.indexOf(resumeStep) : -1;
  const progressPct =
    stepIndex >= 0
      ? Math.round(((stepIndex + 1) / progressOrder.length) * 100)
      : 0;

  return { isComplete: false, progressPct, stepIndex };
}

const DEFAULT_TERMINAL_FALLBACK = {
  dHard: "s3",
  iThanks: "dHard",
};

/**
 * Map a stored or URL step to a screen the user can resume on.
 * Terminal steps (e.g. dHard after low BMI) fall back to the last
 * non-terminal screen in history, or a sensible default.
 */
export function normalizeStepForResume(step, historyStack = [], options = {}) {
  if (!step || typeof step !== "string") return "";
  if (step === "iConfirm") return "";
  if (step === "iThanks") return "dHard";
  if (!TERMINAL_ONBOARDING_STEPS.has(step)) {
    return applyGoogleResumeRules(step, options);
  }

  for (let i = historyStack.length - 1; i >= 0; i--) {
    const prev = historyStack[i];
    if (prev && !TERMINAL_ONBOARDING_STEPS.has(prev)) {
      return applyGoogleResumeRules(prev, options);
    }
  }

  return applyGoogleResumeRules(
    DEFAULT_TERMINAL_FALLBACK[step] || "s3",
    options,
  );
}

function applyGoogleResumeRules(step, { authProvider } = {}) {
  if (authProvider === "google" && (!step || step === "s20")) {
    return "s21";
  }
  return step || "";
}

/**
 * When `currentStep` was never written (login before save landed, etc.),
 * infer the furthest screen from onboarding answers already in Firestore.
 */
function inferResumeStepFromProfile(profile) {
  if (!profile || isOnboardingComplete(profile)) return "";

  const onb = profile.onboarding || {};
  const options = { authProvider: profile?.authProvider };
  const hasEmail = !!(profile.email || onb.email);
  const hasConsents = !!(profile.consentHIPAA || onb.consentH);
  const hasProfileBasics = !!(
    profile.firstName &&
    profile.lastName &&
    profile.dob &&
    profile.state
  );
  const hasBmi = !!(
    onb.heightFt ||
    onb.heightCm ||
    onb.weightLbs ||
    onb.weightKg
  );

  if (hasBmi) return applyGoogleResumeRules("s3", options);
  if (hasProfileBasics) return "s3";
  if (hasEmail && hasConsents) return applyGoogleResumeRules("s21", options);
  if (Array.isArray(onb.s2) && onb.s2.length > 0) return "s20";
  if (onb.s1) return "s2";

  return "";
}

/** Email/consent captured but profile (s21) not finished — s20 is not a resume target. */
function storedStepAfterEmailCapture(profile, step, options) {
  if (step !== "s20") return step;
  const onb = profile?.onboarding || {};
  const hasEmail = !!(profile?.email || onb.email);
  const hasConsents = !!(profile?.consentHIPAA || onb.consentH);
  const hasProfileBasics = !!(
    profile?.firstName &&
    profile?.lastName &&
    profile?.dob &&
    profile?.state
  );
  if (hasEmail && hasConsents && !hasProfileBasics) {
    return applyGoogleResumeRules("s21", options);
  }
  return step;
}

/**
 * Best resume target from a Firestore profile: stored step, step history,
 * then inferred progress from saved answers.
 */
export function getEffectiveResumeStep(profile) {
  if (!profile) return "";

  const history = Array.isArray(profile.onboardingStepHistory)
    ? profile.onboardingStepHistory
    : [];
  const options = { authProvider: profile?.authProvider };

  const fromStored = storedStepAfterEmailCapture(
    profile,
    normalizeStepForResume(profile.currentStep, history, options),
    options,
  );
  if (fromStored) return fromStored;

  for (let i = history.length - 1; i >= 0; i--) {
    const step = history[i];
    if (!step || TERMINAL_ONBOARDING_STEPS.has(step)) continue;
    const norm = applyGoogleResumeRules(step, options);
    if (norm) return norm;
  }

  return inferResumeStepFromProfile(profile);
}

export function onboardingResumePath(currentStep, orgSlug, options = {}) {
  const slug = orgSlug && orgSlug !== DEFAULT_ORG_SLUG ? orgSlug : null;
  const base = slug ? `/${slug}/weightloss-onboard` : "/weightloss-onboard";
  const history = Array.isArray(options.stepHistory) ? options.stepHistory : [];
  const step =
    options.effectiveStep ||
    normalizeStepForResume(currentStep, history, options);
  if (!step) {
    return base;
  }
  return `${base}?step=${encodeURIComponent(step)}`;
}

/** Convenience when callers already have the Firestore profile object. */
export function onboardingResumePathFromProfile(profile) {
  const effectiveStep = getEffectiveResumeStep(profile);
  return onboardingResumePath(profile?.currentStep, profile?.orgSlug, {
    authProvider: profile?.authProvider,
    stepHistory: profile?.onboardingStepHistory,
    effectiveStep,
  });
}
