"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthUser } from "@/lib/auth/useAuthUser";
import { redirectAfterAuth } from "@/lib/auth/redirectAfterAuth";
import { dashboardPathForRole } from "@/lib/urls/dashboardPaths";
import { isGoogleOnlyAuthUser } from "@/lib/auth/authProviders";
import {
  bootstrapGooglePatient,
  needsGoogleHipaaConsent,
} from "@/lib/auth/googlePatientBootstrap";
import HipaaGoogleConsentModal from "@/components/auth/HipaaGoogleConsentModal";
import { formatPhoneDisplay, isValidPhone as isValidUsPhone } from "@/lib/phone/usPhone";
import "./wlf.css";
import {
  bmiCategory,
  bmiInputError,
  calculateBmi,
  isRequiredText,
  isValidEmail,
  isValidPassword,
  isValidWaistOptional,
  isValidWeightLbs,
  sanitizeEmail,
} from "./utils";
import {
  patientProfileFormIsValid,
  profileMaxDobDate,
} from "./_lib/patientProfileValidation";
import {
  initialForm,
  noBackScreens,
} from "./schema";
import { submitToMautic } from "./mautic";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/auth";
import {
  saveOnboardingProgress,
  signUpNewUser,
} from "./firebaseClient";
import {
  mapGoogleSignInError,
  signInWithGoogle,
} from "@/lib/auth/googleSignIn";
import {
  getEffectiveResumeStep,
  isOnboardingComplete,
  normalizeStepForResume,
  ONBOARDING_SUCCESS_STEPS,
  TERMINAL_ONBOARDING_STEPS,
} from "@/lib/onboarding/resumePath";
import { hasPlanCheckout, mergePaymentIntoOnboarding } from "@/lib/billing/patientPayment";
import { PLANS } from "./data";
import {
  uploadPatientPhotoId,
  uploadPatientVialPhoto,
} from "@/lib/storage/uploads";
import { toastError, toastSuccess } from "@/lib/ui/notify";
import { isOnboardingFieldEmpty } from "@/lib/onboarding/displayFields";
import {
  authEmailMismatchMessage,
  canReuseAuthSessionForPatientOnboarding,
  wrongRoleOnboardingMessage,
} from "./_lib/patientOnboardingAccess";

import { OnboardProvider } from "./_screens/OnboardContext";
import { SectionStepper, SCREEN_TO_SECTION } from "./_screens/sections";

import { S1Welcome, S2Inspiration } from "./_screens/WelcomeScreens";
import S3Bmi from "./_screens/BmiScreen";
import { IGood, IRoad } from "./_screens/InterstitialScreens";
import { S4, S5, S6 } from "./_screens/WeightHistoryScreens";
import { S7, S7m, S7b, S7a, S7c, S7d } from "./_screens/MedicationScreens";
import S7eIdentity from "./_screens/IdentityScreen";
import { S9, S9b } from "./_screens/BariatricScreens";
import { S10, S11 } from "./_screens/MedicalScreens";
import { S12, S13, S13a, S14, S14b, S15 } from "./_screens/SafetyScreens";
import { S16, S17, S18 } from "./_screens/LifestyleScreens";
import {
  S19,
  S20Email,
  S21,
  S22,
} from "./_screens/ProfileScreens";
import S22bDoctor from "./_screens/DoctorIntroScreen";
import S23Booking from "./_screens/S23Booking";
import { SPlan, SPay } from "./_screens/PlanPayScreens";
import { IConfirm, DHard, IThanks } from "./_screens/EndStateScreens";

// Drives the header progress bar — order matters.
// dHard / iThanks intentionally omitted (off-flow ends).
const PROGRESS_ORDER = [
  // Welcome → email/password → personal profile happens upfront so we
  // capture contact info before the BMI / medical questions kick in.
  "s1", "s2", "s20", "s21",
  "s3", "iGood", "iRoad",
  "s4", "s5", "s6",
  "s7", "s7m", "s7b", "s7a", "s7c", "s7d", "s7e",
  "s9", "s9b",
  "s10", "s11",
  "s12", "s13", "s13a", "s14", "s14b", "s15",
  "s16", "s17", "s18",
  "s19", "s22", "s22b", "s23",
  "sPlan", "sPay", "iConfirm",
];

const SCREEN_COMPONENTS = {
  s1: S1Welcome,
  s2: S2Inspiration,
  s3: S3Bmi,
  iGood: IGood,
  iRoad: IRoad,
  s4: S4,
  s5: S5,
  s6: S6,
  s7: S7,
  s7m: S7m,
  s7b: S7b,
  s7a: S7a,
  s7c: S7c,
  s7d: S7d,
  s7e: S7eIdentity,
  s9: S9,
  s9b: S9b,
  s10: S10,
  s11: S11,
  s12: S12,
  s13: S13,
  s13a: S13a,
  s14: S14,
  s14b: S14b,
  s15: S15,
  s16: S16,
  s17: S17,
  s18: S18,
  s19: S19,
  s20: S20Email,
  s21: S21,
  s22: S22,
  s22b: S22bDoctor,
  s23: S23Booking,
  sPlan: SPlan,
  sPay: SPay,
  iConfirm: IConfirm,
  dHard: DHard,
  iThanks: IThanks,
};

const ONBOARD_STEP_KEY = "ongocare:onboard-step";

function isValidOnboardScreen(step) {
  return typeof step === "string" && !!SCREEN_COMPONENTS[step];
}

function isPageReload() {
  if (typeof window === "undefined") return false;
  const entry = performance.getEntriesByType?.("navigation")?.[0];
  return entry?.type === "reload";
}

function readSessionStep() {
  try {
    const step = sessionStorage.getItem(ONBOARD_STEP_KEY);
    return isValidOnboardScreen(step) ? step : null;
  } catch {
    return null;
  }
}

function persistOnboardStep(screen) {
  if (typeof window === "undefined") return;
  try {
    if (screen === "s1") sessionStorage.removeItem(ONBOARD_STEP_KEY);
    else sessionStorage.setItem(ONBOARD_STEP_KEY, screen);
  } catch {
    // ignore quota / private mode
  }

  const url = new URL(window.location.href);
  if (screen === "s1") url.searchParams.delete("step");
  else url.searchParams.set("step", screen);
  const search = url.searchParams.toString();
  const next = `${url.pathname}${search ? `?${search}` : ""}${url.hash}`;
  const current = `${url.pathname}${url.search}${url.hash}`;
  if (current !== next) {
    window.history.replaceState(window.history.state, "", next);
  }
}

function clearOnboardStepSession() {
  try {
    sessionStorage.removeItem(ONBOARD_STEP_KEY);
  } catch {
    // ignore
  }
}

function stepForPersistence(screen, historyStack) {
  if (!TERMINAL_ONBOARDING_STEPS.has(screen)) return screen;
  if (screen === "iConfirm") return screen;
  return normalizeStepForResume(screen, historyStack);
}

function pickResumeStep(urlStep, profileStep, history, options) {
  const urlNorm =
    typeof urlStep === "string" && urlStep
      ? normalizeStepForResume(urlStep, history, options)
      : "";
  const profileNorm =
    typeof profileStep === "string" && profileStep
      ? normalizeStepForResume(profileStep, history, options)
      : "";

  if (!urlNorm && !profileNorm) return "";
  if (!urlNorm) return profileNorm;
  if (!profileNorm) return urlNorm;

  const urlIdx = PROGRESS_ORDER.indexOf(urlNorm);
  const profIdx = PROGRESS_ORDER.indexOf(profileNorm);
  if (urlIdx >= 0 && profIdx >= 0) {
    return urlIdx >= profIdx ? urlNorm : profileNorm;
  }
  if (profIdx >= 0) return profileNorm;
  if (urlIdx >= 0) return urlNorm;
  return profileNorm || urlNorm;
}

function isMidOnboardingScreen(step) {
  const idx = PROGRESS_ORDER.indexOf(step);
  const startIdx = PROGRESS_ORDER.indexOf("s20");
  const endIdx = PROGRESS_ORDER.indexOf("iConfirm");
  return idx >= startIdx && idx >= 0 && endIdx >= 0 && idx < endIdx;
}

/** Auto-redirect completed patients to the dashboard, but not from welcome or iConfirm. */
function shouldAutoRedirectCompletedPatient(step) {
  if (step === "iConfirm") return false;
  // s1/s2: user opened onboarding from marketing CTA — stay on welcome; use Sign In.
  if (step === "s1" || step === "s2") return false;
  return !isMidOnboardingScreen(step);
}

function resolveResumeStep(profileStep, urlStep, profile) {
  const history = Array.isArray(profile?.onboardingStepHistory)
    ? profile.onboardingStepHistory
    : [];
  const options = { authProvider: profile?.authProvider };
  const effectiveProfileStep = profile
    ? getEffectiveResumeStep(profile)
    : profileStep
      ? normalizeStepForResume(profileStep, history, options)
      : "";
  const candidate = pickResumeStep(urlStep, effectiveProfileStep, history, options);
  if (candidate && SCREEN_COMPONENTS[candidate]) {
    if (
      profile &&
      hasPlanCheckout(mergePaymentIntoOnboarding(profile)) &&
      (candidate === "sPlan" || candidate === "sPay")
    ) {
      return "iConfirm";
    }
    return candidate;
  }
  return null;
}

function profileToFormState(profile, prev) {
  const onb = profile.onboarding || {};
  const docs = onb.documents || {};
  const next = { ...prev };

  // Never clobber in-progress answers with empty Firestore placeholders.
  // This can happen when the profile doc appears mid-flow before the first
  // successful save-progress, or after a partial write.
  for (const [key, value] of Object.entries(onb)) {
    if (key === "documents") continue;
    if (isOnboardingFieldEmpty(prev[key]) && !isOnboardingFieldEmpty(value)) {
      next[key] = value;
    }
  }

  const pickDoc = (local, stored) =>
    isOnboardingFieldEmpty(local) && !isOnboardingFieldEmpty(stored) ? stored : local;

  next.photoIdPath = pickDoc(prev.photoIdPath, onb.photoIdPath || docs.photoId?.path);
  next.photoIdName = pickDoc(prev.photoIdName, onb.photoIdName || docs.photoId?.fileName);
  next.photoIdContentType = pickDoc(
    prev.photoIdContentType,
    onb.photoIdContentType || docs.photoId?.contentType,
  );
  next.vialPhotoPath = pickDoc(prev.vialPhotoPath, onb.vialPhotoPath || docs.vialPhoto?.path);
  next.vialPhotoName = pickDoc(prev.vialPhotoName, onb.vialPhotoName || docs.vialPhoto?.fileName);
  next.vialPhotoContentType = pickDoc(
    prev.vialPhotoContentType,
    onb.vialPhotoContentType || docs.vialPhoto?.contentType,
  );

  if (profile.email) next.email = profile.email;
  if (!next.firstName && (profile.firstName || onb.firstName)) {
    next.firstName = profile.firstName || onb.firstName;
  }
  if (!next.lastName && (profile.lastName || onb.lastName)) {
    next.lastName = profile.lastName || onb.lastName;
  }
  if (!next.phone && (profile.phone || onb.phone)) {
    const phone = profile.phone || onb.phone;
    next.phone = isValidUsPhone(phone) ? formatPhoneDisplay(phone) : phone;
  }
  if (!next.dob && (profile.dob || onb.dob)) {
    next.dob = profile.dob || onb.dob;
  }
  if (profile.consentHIPAA !== undefined && !prev.consentH) {
    next.consentH = !!profile.consentHIPAA;
  }
  if (profile.consentTelehealth !== undefined && !prev.consentT) {
    next.consentT = !!profile.consentTelehealth;
  }

  const payment = mergePaymentIntoOnboarding(profile);
  if (hasPlanCheckout(payment)) {
    next.paid = !!payment.paid;
    next.paymentStatus = payment.paymentStatus || "";
    next.paymentIntentId = payment.paymentIntentId || "";
    next.paymentAmount = payment.paymentAmount ?? next.paymentAmount ?? null;
    next.paymentCurrency = payment.paymentCurrency || next.paymentCurrency || "";
    next.paymentBrand = payment.paymentBrand || next.paymentBrand || "";
    next.paymentLast4 = payment.paymentLast4 || next.paymentLast4 || "";
    next.paymentExpMonth = payment.paymentExpMonth ?? next.paymentExpMonth ?? null;
    next.paymentExpYear = payment.paymentExpYear ?? next.paymentExpYear ?? null;
    next.paymentCardholder = payment.paymentCardholder || next.paymentCardholder || "";
    if (payment.paidAt) next.paidAt = payment.paidAt;
    if (payment.paymentAuthorizedAt) {
      next.paymentAuthorizedAt = payment.paymentAuthorizedAt;
    }
    if (!next.plan && payment.plan) next.plan = payment.plan;
  }

  // Password is intentionally left as "" — we never store it.
  return next;
}

// Matches homepage Header defaultBranding so onboarding uses the same logo asset.
const DEFAULT_ONBOARD_BRANDING = {
  logoSrc: "/images/ongo-weight-loss-logo.webp",
  logoAlt: "Ongo Weight Loss",
  logoWidth: 220,
  logoHeight: 144,
  contactPhone: "+1 (888) 655-5267",
  contactPhoneHref: "tel:+18886555267",
  copyrightName: "Ongo Weight Loss",
};

export default function WeightlossOnboardForm({
  content = null,
  branding = null,
  basePath = "/",
  orgSlug = null,
} = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stepFromUrl = searchParams.get("step");
  const freshStart = searchParams.get("start") === "1";
  const { user, profile, loading: authLoading, profileReady } = useAuthUser();
  const [hydrated, setHydrated] = useState(false);
  const progressRestoredRef = useRef(false);
  const skipSaveOnceRef = useRef(false);
  const skipResumeCorrectiveRef = useRef(false);
  const emailCaptureInProgressRef = useRef(false);
  const [resumeReady, setResumeReady] = useState(false);
  const [screen, setScreen] = useState("s1");
  const [form, setForm] = useState(initialForm);
  const formRef = useRef(initialForm);
  const screenRef = useRef("s1");
  const [uploadError, setUploadError] = useState("");
  const screenHistory = useRef([]);
  const scrollRef = useRef(null);
  const headerBranding = useMemo(
    () => ({ ...DEFAULT_ONBOARD_BRANDING, ...(branding || {}) }),
    [branding],
  );

  const { todayDate, maxDobDate } = useMemo(() => {
    const fmt = (d) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const today = new Date();
    return { todayDate: fmt(today), maxDobDate: profileMaxDobDate() };
  }, []);

  const progressPercent = useMemo(() => {
    if (screen === "dHard" || screen === "iThanks") return 0;
    const idx = PROGRESS_ORDER.indexOf(screen);
    if (idx === -1) return 0;
    return Math.round(((idx + 1) / PROGRESS_ORDER.length) * 100);
  }, [screen]);

  const goTo = useCallback((next) => {
    if (auth.currentUser?.uid) {
      saveOnboardingProgress(
        formRef.current,
        stepForPersistence(screenRef.current, screenHistory.current),
        ONBOARDING_SUCCESS_STEPS.has(screenRef.current) ? "onboarded" : undefined,
        orgSlug,
        screenHistory.current,
      );
    }
    setScreen((curr) => {
      screenHistory.current.push(curr);
      persistOnboardStep(next);
      return next;
    });
  }, [orgSlug]);

  useEffect(() => {
    formRef.current = form;
  }, [form]);

  useEffect(() => {
    screenRef.current = screen;
  }, [screen]);

  const back = useCallback(() => {
    const previous = screenHistory.current.pop();
    if (previous) {
      persistOnboardStep(previous);
      setScreen(previous);
    }
  }, []);

  // Tracks whether the user is signed in. Once true, subsequent screen
  // transitions auto-save form progress via /api/onboarding/save-progress.
  // Declared BEFORE the auto-save effect so the effect's dependency array can
  // reference it without hitting the temporal dead zone.
  const [authenticatedUid, setAuthenticatedUid] = useState(null);
  const [captureError, setCaptureError] = useState("");
  // `captureErrorKind` mirrors `err.kind` from signUpNewUser so the email
  // screen can render the right recovery affordance — e.g. a "Go to sign in"
  // link for EMAIL_ALREADY_REGISTERED.
  const [captureErrorKind, setCaptureErrorKind] = useState("");
  const [isCapturing, setIsCapturing] = useState(false);
  const [hipaaModalOpen, setHipaaModalOpen] = useState(false);
  const [hipaaSubmitting, setHipaaSubmitting] = useState(false);
  const [hipaaError, setHipaaError] = useState("");
  const [googleAwaitingRoute, setGoogleAwaitingRoute] = useState(false);
  const [googleIsNewUser, setGoogleIsNewUser] = useState(null);
  const googleAuthFlowRef = useRef(false);

  // ── Hydration on mount ────────────────────────────────────────────────
  // Runs once when Firebase Auth has resolved:
  //   - Signed out                 → fresh start at s1, no changes
  //   - Signed in, status="onboarded" → redirect to /dashboard/patient
  //                                     (they already finished; no point
  //                                     re-entering the form)
  //   - Signed in, mid-flow        → hydrate `form` from users/{uid} and
  //                                     jump `screen` to their currentStep
  //                                     so they resume exactly where they
  //                                     left off, instead of restarting at s1
  // Without this effect, a returning patient who clicks "Resume onboarding"
  // on the dashboard would be sent back to screen s1 with empty fields,
  // forcing them to click through everything they'd already filled.
  useEffect(() => {
    if (authLoading) return;

    // "Start your journey" from login — always open welcome (s1), not a saved step.
    if (freshStart) {
      clearOnboardStepSession();
      screenHistory.current = [];
      skipResumeCorrectiveRef.current = true;
      setForm(initialForm);
      setScreen("s1");
      skipSaveOnceRef.current = true;

      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.searchParams.delete("start");
        url.searchParams.delete("step");
        const search = url.searchParams.toString();
        const next = `${url.pathname}${search ? `?${search}` : ""}${url.hash}`;
        window.history.replaceState(window.history.state, "", next);
      }

      if (user) {
        if (!profileReady) return;
        if (
          isOnboardingComplete(profile) &&
          !emailCaptureInProgressRef.current &&
          !isCapturing &&
          shouldAutoRedirectCompletedPatient(screenRef.current)
        ) {
          progressRestoredRef.current = true;
          clearOnboardStepSession();
          if (profile?.status !== "onboarded") {
            saveOnboardingProgress(
              profileToFormState(profile, initialForm),
              profile.currentStep,
              "onboarded",
              orgSlug,
              profile.onboardingStepHistory,
            );
          }
          redirectAfterAuth({
            router,
            role: "patient",
            orgSlug: profile.orgSlug,
            defaultNext: dashboardPathForRole("patient", profile.orgSlug || orgSlug),
          });
          return;
        }
        if (canReuseAuthSessionForPatientOnboarding(profile)) {
          progressRestoredRef.current = true;
          setAuthenticatedUid(user.uid);
          if (user.email) {
            setForm((prev) => ({
              ...initialForm,
              email: sanitizeEmail(user.email),
            }));
          }
        }
      }

      setResumeReady(true);
      setHydrated(true);
      return;
    }

    if (
      user &&
      profileReady &&
      isOnboardingComplete(profile) &&
      !emailCaptureInProgressRef.current &&
      !isCapturing &&
      shouldAutoRedirectCompletedPatient(screenRef.current)
    ) {
      progressRestoredRef.current = true;
      clearOnboardStepSession();
      if (profile?.status !== "onboarded") {
        saveOnboardingProgress(
          profileToFormState(profile, initialForm),
          profile.currentStep,
          "onboarded",
          orgSlug,
          profile.onboardingStepHistory,
        );
      }
      redirectAfterAuth({
        router,
        role: "patient",
        orgSlug: profile.orgSlug,
        defaultNext: dashboardPathForRole("patient", profile.orgSlug || orgSlug),
      });
      setResumeReady(true);
      setHydrated(true);
      return;
    }

    // Browser refresh: restore the exact screen immediately (all steps, including
    // pre-email, medical history, payment, etc.) before Firestore/URL logic.
    if (isPageReload()) {
      const sessionStep = readSessionStep();
      if (sessionStep) {
        skipSaveOnceRef.current = true;
        setScreen(sessionStep);
      }
    }

    if (!user) {
      if (!isPageReload() || !readSessionStep()) {
        const urlResume = resolveResumeStep(null, stepFromUrl, null);
        if (urlResume) {
          skipSaveOnceRef.current = true;
          setScreen(urlResume);
        }
      }
      setResumeReady(true);
      setHydrated(true);
      return;
    }

    if (resumeReady) {
      // Profile may arrive after the first hydration pass (e.g. login →
      // dashboard → resume). Correct an s1 default once we know the target.
      if (
        !skipResumeCorrectiveRef.current &&
        user &&
        profileReady &&
        canReuseAuthSessionForPatientOnboarding(profile)
      ) {
        const corrective = resolveResumeStep(
          profile?.currentStep,
          stepFromUrl,
          profile,
        );
        if (corrective && screenRef.current === "s1" && corrective !== "s1") {
          skipSaveOnceRef.current = true;
          setForm((prev) => profileToFormState(profile, prev));
          if (Array.isArray(profile?.onboardingStepHistory)) {
            screenHistory.current = [...profile.onboardingStepHistory];
          }
          setAuthenticatedUid(user.uid);
          setScreen(corrective);
        } else if (
          !profile &&
          (authenticatedUid || auth.currentUser) &&
          (screenRef.current === "s1" || screenRef.current === "s20")
        ) {
          // Email signup: Auth user exists before users/{uid} is readable.
          const sessionStep = readSessionStep();
          const target =
            sessionStep && sessionStep !== "s1" ? sessionStep : "s21";
          skipSaveOnceRef.current = true;
          setAuthenticatedUid(user.uid);
          setScreen(target);
        }
      }
      return;
    }

    // Signed in — wait for a server-confirmed profile read so a stale
    // empty cache snapshot doesn't send the user back to s1.
    if (!profileReady) return;

    if (!canReuseAuthSessionForPatientOnboarding(profile)) {
      setResumeReady(true);
      setHydrated(true);
      return;
    }

    setAuthenticatedUid(user.uid);

    if (profile) {
      // Mid-flow user: restore form state from their saved Firestore doc.
      setForm((prev) => profileToFormState(profile, prev));
    } else if (user.email) {
      // Prefill email when Auth exists before Firestore profile (e.g. Google).
      setForm((prev) => ({
        ...prev,
        email: sanitizeEmail(user.email),
      }));
      // HIPAA modal is Google-only — never for email/password signup on s20.
      if (
        !stepFromUrl &&
        isGoogleOnlyAuthUser(user) &&
        needsGoogleHipaaConsent(profile, { isNewGoogleUser: googleIsNewUser })
      ) {
        setHipaaModalOpen(true);
      }
    }

    if (Array.isArray(profile?.onboardingStepHistory)) {
      screenHistory.current = [...profile.onboardingStepHistory];
    }

    if (!googleAuthFlowRef.current && (!isPageReload() || !readSessionStep())) {
      const resumeStep = resolveResumeStep(
        profile?.currentStep,
        stepFromUrl,
        profile,
      );
      if (resumeStep) {
        skipSaveOnceRef.current = true;
        setScreen(resumeStep);
      }
    }

    setResumeReady(true);
    setHydrated(true);
  }, [
    authLoading,
    profileReady,
    user,
    profile,
    router,
    stepFromUrl,
    freshStart,
    resumeReady,
    orgSlug,
    googleIsNewUser,
  ]);

  // Mirror the active screen to sessionStorage + URL on every step change.
  // Wait until resume hydration finishes so we don't strip ?step= while still
  // on the default s1 screen.
  useEffect(() => {
    if (!hydrated || !resumeReady) return;
    persistOnboardStep(screen);
  }, [screen, hydrated, resumeReady]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    window.scrollTo({ top: 0, behavior: "instant" });
    setUploadError("");
  }, [screen]);

  // Auto-save form progress to Firestore whenever the user advances to a new
  // screen — but only after the user is authenticated (post email capture).
  // Best-effort: failures are swallowed inside saveOnboardingProgress so they
  // never block UX. The final screen will re-send the full snapshot anyway.
  useEffect(() => {
    if (!authenticatedUid || !hydrated) return;
    if (skipSaveOnceRef.current) {
      skipSaveOnceRef.current = false;
      return;
    }
    const isComplete = ONBOARDING_SUCCESS_STEPS.has(screen);
    const timer = setTimeout(() => {
      saveOnboardingProgress(
        formRef.current,
        stepForPersistence(screen, screenHistory.current),
        isComplete ? "onboarded" : undefined,
        orgSlug,
        screenHistory.current,
      );
    }, 800);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, authenticatedUid, hydrated, orgSlug]);

  // Flush progress when the user leaves mid-screen (dashboard tab, close, etc.).
  useEffect(() => {
    if (!authenticatedUid) return undefined;
    const flush = () => {
      const screen = screenRef.current;
      saveOnboardingProgress(
        formRef.current,
        stepForPersistence(screen, screenHistory.current),
        ONBOARDING_SUCCESS_STEPS.has(screen) ? "onboarded" : undefined,
        orgSlug,
        screenHistory.current,
      );
    };
    const onHide = () => {
      if (document.visibilityState === "hidden") flush();
    };
    window.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, [authenticatedUid, orgSlug]);

  // Combined handler for the email screen Continue button:
  //   1. Fire-and-forget the existing Mautic marketing submit (unchanged)
  //   2. Strict sign-up via Firebase Auth. If the email already exists,
  //      we hard-fail and the UI surfaces a "Go to sign in" link → /login
  //   3. After auth, save the form snapshot to Firestore
  // Returns true on success — the screen uses this to decide whether to goTo.
  const submitMauticOnEmailCapture = useCallback(async () => {
    setCaptureError("");
    setCaptureErrorKind("");
    setIsCapturing(true);
    emailCaptureInProgressRef.current = true;
    // Existing Mautic marketing capture — fire and forget.
    submitToMautic(form, "s20");
    try {
      const existingUser = auth.currentUser;
      const historyAfterEmail = [...screenHistory.current, "s20"];
      if (existingUser) {
        if (!canReuseAuthSessionForPatientOnboarding(profile)) {
          const e = new Error(wrongRoleOnboardingMessage(profile?.role));
          e.kind = "WRONG_ROLE_SIGNED_IN";
          throw e;
        }
        const authEmail = existingUser.email?.trim().toLowerCase();
        const formEmail = form.email.trim().toLowerCase();
        if (authEmail && formEmail && authEmail !== formEmail) {
          const e = new Error(authEmailMismatchMessage(authEmail, formEmail));
          e.kind = "EMAIL_MISMATCH_SIGNED_IN";
          throw e;
        }
        skipSaveOnceRef.current = true;
        setAuthenticatedUid(existingUser.uid);
        progressRestoredRef.current = true;
        await saveOnboardingProgress(
          form,
          "s21",
          undefined,
          orgSlug,
          historyAfterEmail,
        );
        skipSaveOnceRef.current = true;
        return true;
      }
      const { uid } = await signUpNewUser(
        form.email.trim().toLowerCase(),
        form.password,
      );
      // Block the auto-save effect from persisting s20 while still on the email screen.
      skipSaveOnceRef.current = true;
      setAuthenticatedUid(uid);
      progressRestoredRef.current = true;
      // First save right after email/password signup — welcome email sends now.
      await saveOnboardingProgress(
        form,
        "s21",
        undefined,
        orgSlug,
        historyAfterEmail,
        { welcomeEmailTrigger: true },
      );
      skipSaveOnceRef.current = true;
      return true;
    } catch (err) {
      setCaptureError(err?.message || "Could not save your information.");
      setCaptureErrorKind(err?.kind || "");
      return false;
    } finally {
      emailCaptureInProgressRef.current = false;
      setIsCapturing(false);
    }
  }, [form, orgSlug, profile]);

  const routeGooglePatientAfterAuth = useCallback(
    async (patientProfile) => {
      googleAuthFlowRef.current = true;
      if (isOnboardingComplete(patientProfile)) {
        clearOnboardStepSession();
        await redirectAfterAuth({
          router,
          role: "patient",
          orgSlug: patientProfile?.orgSlug || orgSlug,
          defaultNext: dashboardPathForRole(
            "patient",
            patientProfile?.orgSlug || orgSlug,
          ),
        });
        return;
      }

      const resumeStep =
        getEffectiveResumeStep(patientProfile) ||
        (patientProfile?.authProvider === "google" ? "s21" : "s21");
      skipSaveOnceRef.current = true;
      progressRestoredRef.current = true;
      goTo(resumeStep || "s21");
    },
    [goTo, orgSlug, router],
  );

  const submitGoogleOnEmailCapture = useCallback(async () => {
    setCaptureError("");
    setCaptureErrorKind("");
    setIsCapturing(true);
    submitToMautic(form, "s20");
    try {
      const existingUser = auth.currentUser;
      if (existingUser?.email) {
        if (!canReuseAuthSessionForPatientOnboarding(profile)) {
          const e = new Error(wrongRoleOnboardingMessage(profile?.role));
          e.kind = "WRONG_ROLE_SIGNED_IN";
          throw e;
        }
        const email = existingUser.email.trim().toLowerCase();
        setAuthenticatedUid(existingUser.uid);
        progressRestoredRef.current = true;
        setForm({ ...form, email });
        setGoogleAwaitingRoute(true);
        return true;
      }
      const { uid, email, isNew } = await signInWithGoogle();
      setGoogleIsNewUser(isNew);
      setAuthenticatedUid(uid);
      progressRestoredRef.current = true;
      setForm({ ...form, email });
      setGoogleAwaitingRoute(true);
      return true;
    } catch (err) {
      setCaptureError(mapGoogleSignInError(err));
      setCaptureErrorKind(err?.kind || "");
      return false;
    } finally {
      setIsCapturing(false);
    }
  }, [form, profile]);

  useEffect(() => {
    if (!googleAwaitingRoute || authLoading || !user || !profileReady) return;
    setGoogleAwaitingRoute(false);

    if (needsGoogleHipaaConsent(profile, { isNewGoogleUser: googleIsNewUser })) {
      setHipaaError("");
      setHipaaModalOpen(true);
      return;
    }

    void routeGooglePatientAfterAuth(profile);
  }, [
    googleAwaitingRoute,
    authLoading,
    user,
    profileReady,
    profile,
    googleIsNewUser,
    routeGooglePatientAfterAuth,
  ]);

  const signedInWrongRole =
    !!user && profileReady && !canReuseAuthSessionForPatientOnboarding(profile);

  const submitMauticOnComplete = useCallback(
    (overrides, step) =>
      submitToMautic({ ...form, ...overrides }, step),
    [form],
  );

  const updateField = useCallback(
    (field, value) =>
      setForm((prev) => {
        const next = { ...prev, [field]: value };
        formRef.current = next;
        return next;
      }),
    [],
  );

  const uploadPatientDocument = useCallback(
    async (kind, file) => {
      const uid = authenticatedUid || auth.currentUser?.uid;
      if (!uid) {
        const message = "Please create your account before uploading documents.";
        setUploadError(message);
        toastError(message);
        return false;
      }

      setUploadError("");
      const upload =
        kind === "photoId" ? uploadPatientPhotoId : uploadPatientVialPhoto;
      let result;
      try {
        result = await upload({ uid, file });
      } catch (err) {
        const message =
          err?.message || "Could not upload your file. Please try again.";
        setUploadError(message);
        toastError(message);
        return false;
      }
      if (!result?.stored) {
        const message = "Could not upload your file. Please try again.";
        setUploadError(message);
        toastError(message);
        return false;
      }

      if (kind === "photoId") {
        updateField("photoIdName", result.stored.fileName);
        updateField("photoIdPath", result.stored.path);
        updateField("photoIdContentType", result.stored.contentType);
        toastSuccess("Photo ID uploaded", "Your ID photo was saved successfully.");
      } else {
        updateField("vialPhotoName", result.stored.fileName);
        updateField("vialPhotoPath", result.stored.path);
        updateField("vialPhotoContentType", result.stored.contentType);
        toastSuccess("Photo uploaded", "Your medication photo was saved successfully.");
      }
      return true;
    },
    [authenticatedUid, updateField],
  );

  const toggleValue = useCallback(
    (field, value) =>
      setForm((prev) => {
        const current = prev[field];
        const nextValues = current.includes(value)
          ? current.filter((entry) => entry !== value)
          : [...current, value];
        const next = { ...prev, [field]: nextValues };
        formRef.current = next;
        return next;
      }),
    [],
  );

  // Toggle a value, but treat `noneValue` as exclusive of every other value.
  const toggleWithNone = useCallback(
    (field, value, noneValue) =>
      setForm((prev) => {
        const current = prev[field];
        let nextValues;
        if (value === noneValue) {
          nextValues = current.includes(noneValue) ? [] : [noneValue];
        } else {
          const without = current.filter(
            (entry) => entry !== value && entry !== noneValue,
          );
          nextValues = current.includes(value) ? without : [...without, value];
        }
        const next = { ...prev, [field]: nextValues };
        formRef.current = next;
        return next;
      }),
    [],
  );

  const bmi = useMemo(
    () =>
      calculateBmi({
        unit: form.bmiUnit,
        heightFt: form.heightFt,
        heightIn: form.heightIn,
        weightLbs: form.weightLbs,
        heightCm: form.heightCm,
        weightKg: form.weightKg,
      }),
    [
      form.bmiUnit,
      form.heightFt,
      form.heightIn,
      form.weightLbs,
      form.heightCm,
      form.weightKg,
    ],
  );

  const bmiError = useMemo(
    () =>
      bmiInputError({
        unit: form.bmiUnit,
        heightFt: form.heightFt,
        heightIn: form.heightIn,
        weightLbs: form.weightLbs,
        heightCm: form.heightCm,
        weightKg: form.weightKg,
      }),
    [
      form.bmiUnit,
      form.heightFt,
      form.heightIn,
      form.weightLbs,
      form.heightCm,
      form.weightKg,
    ],
  );

  const currentBmiCategory = bmiCategory(bmi);

  const setBmiUnit = useCallback((next) => {
    setForm((prev) => {
      if (next === prev.bmiUnit) return prev;
      const updated = { ...prev, bmiUnit: next };
      if (next === "metric") {
        const feet = parseFloat(prev.heightFt) || 0;
        const inches = parseFloat(prev.heightIn) || 0;
        const pounds = parseFloat(prev.weightLbs) || 0;
        if (feet || inches) {
          updated.heightCm = String(Math.round((feet * 12 + inches) * 2.54));
        }
        if (pounds) updated.weightKg = String(Math.round(pounds / 2.20462));
      } else {
        const cm = parseFloat(prev.heightCm) || 0;
        const kg = parseFloat(prev.weightKg) || 0;
        if (cm) {
          const totalInches = cm / 2.54;
          const feet = Math.floor(totalInches / 12);
          updated.heightFt = String(feet);
          updated.heightIn = String(Math.round(totalInches - feet * 12));
        }
        if (kg) updated.weightLbs = String(Math.round(kg * 2.20462));
      }
      formRef.current = updated;
      return updated;
    });
  }, []);

  const submit = useCallback(() => {
    goTo("sPlan");
  }, [goTo]);

  const selectedPlan = useMemo(
    () => PLANS.find((plan) => plan.id === form.plan),
    [form.plan],
  );

  // HIPAA (consentH) is required; Telehealth/Terms (consentT) is optional.
  // Password is required here because S20 doubles as account creation.
  const emailScreenIsValid =
    isValidEmail(form.email) && isValidPassword(form.password) && form.consentH;

  const googleConsentIsValid = form.consentH;

  const profileScreenIsValid = patientProfileFormIsValid(form, { requireState: true });

  const weightHistoryScreenIsValid =
    isValidWeightLbs(form.wtHigh) &&
    isValidWeightLbs(form.wtGoal) &&
    (form.wtLow === "" || isValidWeightLbs(form.wtLow)) &&
    isValidWaistOptional(form.waist);

  const lifestyleScreenIsValid =
    !!form.meals &&
    !!form.exercise &&
    !!form.sleep &&
    !!form.fastFood &&
    !!form.sugary &&
    !!form.water;

  const medsScreenIsValid =
    isRequiredText(form.meds) && isRequiredText(form.allergies);

  const planScreenIsValid = !!form.plan;

  const openGoogleHipaaModal = useCallback(() => {
    progressRestoredRef.current = true;
    setHipaaError("");
    setHipaaModalOpen(true);
  }, []);

  const cancelGoogleHipaa = useCallback(async () => {
    setHipaaModalOpen(false);
    setHipaaError("");
    setGoogleIsNewUser(null);
    await signOut(auth);
    setAuthenticatedUid(null);
  }, []);

  const confirmGoogleHipaa = useCallback(async () => {
    setHipaaSubmitting(true);
    setHipaaError("");
    try {
      const bootstrap = await bootstrapGooglePatient({
        orgSlug,
        email: formRef.current.email || user?.email,
      });
      setHipaaModalOpen(false);
      googleAuthFlowRef.current = true;

      if (bootstrap.onboarded) {
        clearOnboardStepSession();
        await redirectAfterAuth({
          router,
          role: "patient",
          orgSlug: profile?.orgSlug || orgSlug,
          defaultNext: dashboardPathForRole(
            "patient",
            profile?.orgSlug || orgSlug,
          ),
        });
        return;
      }

      skipSaveOnceRef.current = true;
      progressRestoredRef.current = true;
      goTo(bootstrap.resumeStep || "s21");
    } catch (err) {
      setHipaaError(err?.message || "Could not save your consent.");
    } finally {
      setHipaaSubmitting(false);
    }
  }, [goTo, orgSlug, profile?.orgSlug, router, user?.email]);

  const onboardCtx = useMemo(
    () => ({
      screen,
      form,
      uploadError,
      setUploadError,
      goTo,
      back,
      updateField,
      uploadPatientDocument,
      toggleValue,
      toggleWithNone,
      submit,
      submitMauticOnEmailCapture,
      submitGoogleOnEmailCapture,
      signedInWrongRole,
      openGoogleHipaaModal,
      submitMauticOnComplete,
      bmi,
      bmiError,
      currentBmiCategory,
      setBmiUnit,
      todayDate,
      maxDobDate,
      selectedPlan,
      emailScreenIsValid,
      googleConsentIsValid,
      profileScreenIsValid,
      weightHistoryScreenIsValid,
      lifestyleScreenIsValid,
      medsScreenIsValid,
      planScreenIsValid,
      // Auth / capture state for the email screen UI.
      authenticatedUid,
      captureError,
      captureErrorKind,
      isCapturing,
      // Multi-tenant content + branding (null for the default site).
      content,
      branding,
      basePath,
    }),
    [
      screen,
      form,
      uploadError,
      goTo,
      back,
      updateField,
      uploadPatientDocument,
      toggleValue,
      toggleWithNone,
      submit,
      submitMauticOnEmailCapture,
      submitGoogleOnEmailCapture,
      signedInWrongRole,
      openGoogleHipaaModal,
      submitMauticOnComplete,
      bmi,
      bmiError,
      currentBmiCategory,
      setBmiUnit,
      todayDate,
      maxDobDate,
      selectedPlan,
      emailScreenIsValid,
      googleConsentIsValid,
      profileScreenIsValid,
      weightHistoryScreenIsValid,
      lifestyleScreenIsValid,
      medsScreenIsValid,
      planScreenIsValid,
      authenticatedUid,
      captureError,
      captureErrorKind,
      isCapturing,
      content,
      branding,
      basePath,
    ],
  );

  const ScreenComponent = SCREEN_COMPONENTS[screen];

  // Avoid flashing s1 to a returning user while hydration is still resolving.
  // For brand-new (signed-out) users this loading state typically lasts <100ms
  // — long enough for Firebase Auth's onAuthStateChanged to fire and confirm
  // "no session". After that the normal first-screen renders.
  if (!hydrated) {
    return (
      <div className="wlf-root">
        <div className="wlf-page">
          <main
            className="fw"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "50vh",
              color: "var(--color-text-muted, #5c6b73)",
              fontSize: 15,
            }}
          >
            Loading your progress…
          </main>
        </div>
      </div>
    );
  }

  return (
    <OnboardProvider value={onboardCtx}>
      <HipaaGoogleConsentModal
        open={hipaaModalOpen}
        submitting={hipaaSubmitting}
        error={hipaaError}
        onConfirm={confirmGoogleHipaa}
        onCancel={cancelGoogleHipaa}
      />
      <div className="wlf-root">
        <div className="wlf-page">
          <main className="fw" ref={scrollRef} aria-label="Weight loss onboarding">
            <div className="hdr">
              <button
                type="button"
                className={`back-btn ${noBackScreens.has(screen) ? "hide" : ""}`}
                onClick={back}
                aria-label="Go back"
              >
                ← Back
              </button>
              <span className="logo" aria-hidden="true">
                <span className="logo-mark">
                  <Image
                    src={headerBranding.logoSrc}
                    alt={headerBranding.logoAlt}
                    width={headerBranding.logoWidth}
                    height={headerBranding.logoHeight}
                    priority
                  />
                </span>
              </span>
              <a
                className="contact-link"
                href={headerBranding.contactPhoneHref}
                aria-label={`Call ${headerBranding.copyrightName} at ${headerBranding.contactPhone}`}
              >
                <span className="contact-icon" aria-hidden="true">📞</span>
                <span className="contact-num">
                  {headerBranding.contactPhone}
                </span>
              </a>
            </div>

            {/* Top progress bar — only on screens WITHOUT the section stepper.
                In-section screens get the dedicated stepper instead. */}
            {progressPercent > 0 && !SCREEN_TO_SECTION[screen] && (
              <div
                className="progress-bar"
                role="progressbar"
                aria-valuenow={progressPercent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Form completion progress"
              >
                <div
                  className="progress-fill"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            )}

            {SCREEN_TO_SECTION[screen] && (
              <SectionStepper
                section={SCREEN_TO_SECTION[screen]}
                currentScreen={screen}
              />
            )}

            {ScreenComponent && <ScreenComponent />}
          </main>
        </div>
      </div>
    </OnboardProvider>
  );
}
