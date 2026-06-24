// lib/auth/useEmailPasswordSignIn.js
//
// Sign-in state + side-effects shared by every email/password login page
// (patient /login, doctor /doctor/doctor-login, and any future portal).
//
//   const {
//     email, setEmail,
//     password, setPassword,
//     error, resetSent, submitting, canSubmit,
//     signIn, sendResetEmail,
//   } = useEmailPasswordSignIn({ defaultNext: "/dashboard/doctor" });
//
// Behavior:
//   - Reads ?next= and redirects there once auth state goes truthy.
//   - signIn() runs Firebase signInWithEmailAndPassword with error mapping
//     for the messages we actually want users to see.
//   - sendResetEmail() calls /api/auth/forgot-password when `resetRole` is
//     "patient" or "doctor" (branded email, role + portal checks).

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { signOut } from "firebase/auth";
import { doc, getDoc, getDocFromServer } from "firebase/firestore";
import { auth } from "@/lib/firebase/auth";
import { db } from "@/lib/firebase/firestore";
import { toastApiError, toastSuccess } from "@/lib/ui/notify";
import { userErrorMessage } from "@/lib/ui/userErrorMessage";
import { useAuthUser } from "@/lib/auth/useAuthUser";
import { adminDashboardPath } from "@/lib/auth/adminPortalPaths";
import { validateLoginAccess } from "@/lib/auth/loginAccess";
import {
  isValidEmail,
  sanitizeEmail,
  EMAIL_LIMIT,
} from "@/app/weightloss-onboard/utils";
import {
  LOGIN_CREDENTIALS_ERROR,
  loginFieldErrors,
  loginFieldsValid,
} from "@/lib/auth/loginFieldValidation";
import {
  clearHandoffCooldown,
  redirectAfterAuth,
  isHandoffCooldownActive,
  resetRedirectAfterAuthLock,
} from "@/lib/auth/redirectAfterAuth";
import {
  clearSignedOutSession,
  isSignedOutSession,
} from "@/lib/auth/signOut";
import {
  bootstrapGooglePatient,
  needsGoogleHipaaConsent,
} from "@/lib/auth/googlePatientBootstrap";
import { isGoogleOnlyAuthUser } from "@/lib/auth/authProviders";
import { orgPathPrefix } from "@/lib/urls/siteOrigins";
import { DEFAULT_ORG_SLUG } from "@/lib/orgs";

export { dashboardPathForRole } from "@/lib/urls/siteOrigins";

const PROFILE_WAIT_MS = 5000;

async function loadUserProfile(uid) {
  const profileRef = doc(db, "users", uid);
  try {
    const snap = await getDocFromServer(profileRef);
    return snap.exists() ? snap.data() : null;
  } catch {
    try {
      const cached = await getDoc(profileRef);
      return cached.exists() ? cached.data() : null;
    } catch {
      return null;
    }
  }
}

async function resolveProfileAfterSignIn(profileOverride, cachedProfile) {
  if (profileOverride) return profileOverride;
  if (cachedProfile) return cachedProfile;
  const uid = auth.currentUser?.uid;
  if (!uid) return null;
  return loadUserProfile(uid);
}

async function waitForProfile(uid, deadlineMs = PROFILE_WAIT_MS) {
  const deadline = Date.now() + deadlineMs;
  while (Date.now() < deadline) {
    const data = await loadUserProfile(uid);
    if (data) return data;
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  return null;
}

function applyLoginAccessFailure(access, { setError, signOutUser = true } = {}) {
  if (access.signOut && signOutUser) {
    signOut(auth).catch(() => {});
  }
  setError(access.message || "You cannot sign in on this page.");
}

export function useEmailPasswordSignIn({
  defaultNext = "/dashboard",
  // When set, only these Firestore roles may proceed after sign-in. Used
  // on /admin/admin-login so patient accounts get a clear error instead
  // of being bounced to /dashboard/admin and then /dashboard/patient.
  allowedRoles = null,
  // Optional login path users return to after resetting their password.
  // Per-portal login pages pass this so the reset email lands on the
  // portal's branded login page (e.g. /medclap1/login).
  resetReturnUrl = null,
  // When "patient" or "doctor", sends a branded reset email via the server
  // API (role + portal checks). Omit or null to disable forgot-password.
  resetRole = null,
  // When set, the login page belongs to this portal. Patient, doctor, and
  // portal-admin accounts must match; superadmins may use any admin login URL.
  loginOrgSlug = null,
  // When Firebase Auth succeeds but users/{uid} is missing, send the user here
  // (e.g. patient onboarding) instead of showing a dead-end error.
  missingProfileHref = null,
  // Patient login: Google sign-in shows a HIPAA modal and bootstraps a minimal
  // profile before redirecting to the dashboard (resume continues at s21).
  googleHipaaBootstrap = false,
} = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next");

  const { user, role, profile, loading, profileReady } = useAuthUser();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [resetSent, setResetSent] = useState(false);
  const [resetInfo, setResetInfo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const googleSignInEnabled = Boolean(googleHipaaBootstrap);
  const isDoctorLogin =
    Array.isArray(allowedRoles) &&
    allowedRoles.length === 1 &&
    allowedRoles[0] === "doctor";

  const [googleAwaitingProfile, setGoogleAwaitingProfile] = useState(false);
  const [googleIsNewUser, setGoogleIsNewUser] = useState(null);
  const [hipaaModalOpen, setHipaaModalOpen] = useState(false);
  const [hipaaSubmitting, setHipaaSubmitting] = useState(false);
  const [hipaaError, setHipaaError] = useState("");
const AUTO_REDIRECT_SESSION_KEY = "ongocare:auto-auth-redirect";

  const wrongRoleHandledRef = useRef(false);
  const autoRedirectRef = useRef(false);
  const explicitSignInRef = useRef(false);
  const blockingAutoRedirectRef = useRef(false);

  // Stable key — inline arrays like `allowedRoles={["patient"]}` are a new
  // reference every render and must not retrigger the auth redirect effect.
  const allowedRolesKey = useMemo(
    () => (Array.isArray(allowedRoles) ? allowedRoles.join("\0") : ""),
    [allowedRoles],
  );

  useEffect(() => {
    if (!user) {
      wrongRoleHandledRef.current = false;
      autoRedirectRef.current = false;
      if (!isSignedOutSession()) {
        explicitSignInRef.current = false;
      }
      try {
        sessionStorage.removeItem(AUTO_REDIRECT_SESSION_KEY);
      } catch {
        // ignore
      }
      setGoogleIsNewUser(null);
    }
  }, [user]);

  // After sign-out, drop any stale Firebase user on the login page so we do not
  // auto-handoff until the user clicks Sign In again.
  useEffect(() => {
    if (!isSignedOutSession() || loading || !user) return;
    signOut(auth).catch(() => {});
  }, [user, loading]);

  const onEmailChange = (value) => {
    setEmail(sanitizeEmail(value));
    setResetInfo("");
    setFieldErrors((prev) => {
      if (!prev.email) return prev;
      const next = { ...prev };
      delete next.email;
      return next;
    });
    setError("");
  };

  const onPasswordChange = (value) => {
    setPassword(value);
    setFieldErrors((prev) => {
      if (!prev.password) return prev;
      const next = { ...prev };
      delete next.password;
      return next;
    });
    setError("");
  };

  const canSubmit = !submitting && !hipaaSubmitting;

  function prepareExplicitSignIn() {
    clearSignedOutSession();
    resetRedirectAfterAuthLock();
    clearHandoffCooldown();
    explicitSignInRef.current = true;
    blockingAutoRedirectRef.current = true;
    autoRedirectRef.current = false;
    try {
      sessionStorage.removeItem(AUTO_REDIRECT_SESSION_KEY);
    } catch {
      // ignore
    }
  }

  async function completeExplicitSignInRedirect(profileOverride = null) {
    const activeProfile = await resolveProfileAfterSignIn(profileOverride, profile);
    const access = validateLoginAccess({
      profile: activeProfile,
      allowedRoles,
      loginOrgSlug,
    });

    if (!access.ok) {
      blockingAutoRedirectRef.current = false;
      explicitSignInRef.current = false;
      applyLoginAccessFailure(access, { setError });
      return false;
    }

    const activeRole = access.role;
    autoRedirectRef.current = true;
    const adminHome =
      activeRole === "superadmin"
        ? adminDashboardPath(DEFAULT_ORG_SLUG)
        : adminDashboardPath(activeProfile?.orgSlug);

    const resolvedNext =
      nextParam ||
      (defaultNext && defaultNext !== "/dashboard" ? defaultNext : null) ||
      (loginOrgSlug != null && (activeRole === "admin" || activeRole === "superadmin")
        ? adminHome
        : null);

    const ok = await redirectAfterAuth({
      router,
      nextParam: resolvedNext || nextParam,
      role: activeRole,
      orgSlug: activeProfile?.orgSlug || loginOrgSlug,
      defaultNext: resolvedNext || defaultNext,
    });

    if (!ok) {
      autoRedirectRef.current = false;
      blockingAutoRedirectRef.current = false;
      explicitSignInRef.current = false;
      try {
        sessionStorage.removeItem(AUTO_REDIRECT_SESSION_KEY);
      } catch {
        // ignore
      }
    }
    return ok;
  }

  // Redirect once Firebase Auth + Firestore profile have both resolved.
  //
  // Priority:
  //   1. ?next=<path> in the URL (deep-link return target) — always wins.
  //   2. Caller-supplied `defaultNext` IFF it's anything other than the
  //      generic "/dashboard" placeholder (so /doctor/doctor-login keeps
  //      its explicit "/dashboard/doctor" target).
  //   3. Otherwise auto-route by the user's role — this is what makes the
  //      single shared /login page work for every portal.
  useEffect(() => {
    if (loading || !user || autoRedirectRef.current) return;

    if (isSignedOutSession()) return;
    if (blockingAutoRedirectRef.current) return;

    try {
      if (sessionStorage.getItem(AUTO_REDIRECT_SESSION_KEY) === "1") return;
      if (isHandoffCooldownActive() && !explicitSignInRef.current) return;
      // Deep-link return (/login?next=…): wait for an explicit Sign In click.
      if (nextParam && !explicitSignInRef.current) return;
    } catch {
      // ignore
    }
    // Wait until we've tried to load users/{uid} (server, cache, or timeout).
    if (!profileReady) return;
    if (googleSignInEnabled && (hipaaModalOpen || googleAwaitingProfile)) return;

    if (
      isDoctorLogin &&
      isGoogleOnlyAuthUser({ providerData: user.providerData || [] })
    ) {
      signOut(auth);
      setError(
        "Doctor accounts must sign in with email and password. Google sign-in is not available for clinicians.",
      );
      return;
    }

    if (!profile) {
      if (
        googleSignInEnabled &&
        isGoogleOnlyAuthUser({ providerData: user.providerData || [] })
      ) {
        if (googleAwaitingProfile || hipaaModalOpen) return;
        if (googleIsNewUser === true) return;
        // Wait for profile before bridging — wrong-role Google accounts must not pass.
        (async () => {
          const loaded = await waitForProfile(user.uid);
          const access = validateLoginAccess({
            profile: loaded,
            allowedRoles,
            loginOrgSlug,
          });
          if (!access.ok) {
            applyLoginAccessFailure(access, { setError });
            return;
          }
          autoRedirectRef.current = true;
          try {
            sessionStorage.setItem(AUTO_REDIRECT_SESSION_KEY, "1");
          } catch {
            // ignore
          }
          redirectAfterAuth({
            router,
            nextParam: nextParam || undefined,
            role: access.role,
            orgSlug: loaded?.orgSlug || loginOrgSlug,
            defaultNext: defaultNext || "/dashboard/patient",
          }).then((ok) => {
            if (!ok) {
              autoRedirectRef.current = false;
              try {
                sessionStorage.removeItem(AUTO_REDIRECT_SESSION_KEY);
              } catch {
                // ignore
              }
            }
          });
        })();
        return;
      }
      if (googleSignInEnabled) return;
      if (missingProfileHref) {
        router.replace(missingProfileHref);
        return;
      }
      setError(
        "Signed in, but your account profile could not be loaded. " +
          "This often happens when Firebase daily limits are exceeded, or when " +
          "no user record exists in the database for this email. Try again later " +
          "or contact support.",
      );
      return;
    }

    const access = validateLoginAccess({
      profile,
      allowedRoles,
      loginOrgSlug,
    });

    if (!access.ok) {
      if (access.code === "wrong-role" && !wrongRoleHandledRef.current) {
        wrongRoleHandledRef.current = true;
        applyLoginAccessFailure(access, { setError });
      } else if (access.code === "wrong-portal") {
        applyLoginAccessFailure(access, { setError });
      } else if (access.code === "profile-missing") {
        setError(access.message);
      }
      return;
    }

    const adminHome =
      role === "superadmin"
        ? adminDashboardPath(DEFAULT_ORG_SLUG)
        : adminDashboardPath(profile.orgSlug);

    const resolvedNext =
      nextParam ||
      (defaultNext && defaultNext !== "/dashboard" ? defaultNext : null) ||
      (loginOrgSlug != null && (role === "admin" || role === "superadmin")
        ? adminHome
        : null);

    autoRedirectRef.current = true;
    try {
      sessionStorage.setItem(AUTO_REDIRECT_SESSION_KEY, "1");
    } catch {
      // ignore
    }
    redirectAfterAuth({
      router,
      nextParam: resolvedNext || nextParam,
      role,
      orgSlug: profile.orgSlug,
      defaultNext: resolvedNext || defaultNext,
    }).then((ok) => {
      if (!ok) {
        autoRedirectRef.current = false;
        try {
          sessionStorage.removeItem(AUTO_REDIRECT_SESSION_KEY);
        } catch {
          // ignore
        }
      }
    });
  }, [
    loading,
    profileReady,
    user,
    role,
    profile,
    nextParam,
    defaultNext,
    loginOrgSlug,
    allowedRolesKey,
    missingProfileHref,
    googleSignInEnabled,
    isDoctorLogin,
    hipaaModalOpen,
    googleAwaitingProfile,
    googleIsNewUser,
    router,
  ]);

  useEffect(() => {
    if (!googleSignInEnabled || !googleAwaitingProfile) return;
    if (loading || !user || !profileReady) return;

    if (needsGoogleHipaaConsent(profile, { isNewGoogleUser: googleIsNewUser })) {
      setHipaaModalOpen(true);
    } else {
      setHipaaModalOpen(false);
    }
    setGoogleAwaitingProfile(false);
  }, [
    googleSignInEnabled,
    googleAwaitingProfile,
    loading,
    user,
    profileReady,
    profile,
    googleIsNewUser,
  ]);

  const signIn = async (e) => {
    e?.preventDefault?.();
    const nextFieldErrors = loginFieldErrors(email, password);
    setFieldErrors(nextFieldErrors);
    if (!loginFieldsValid(nextFieldErrors)) return;

    setError("");
    setResetSent(false);
    setSubmitting(true);
    prepareExplicitSignIn();
    try {
      const credential = await signInWithEmailAndPassword(
        auth,
        email.trim().toLowerCase(),
        password,
      );
      const loadedProfile = await waitForProfile(credential.user.uid);
      const access = validateLoginAccess({
        profile: loadedProfile,
        allowedRoles,
        loginOrgSlug,
      });
      if (!access.ok) {
        explicitSignInRef.current = false;
        blockingAutoRedirectRef.current = false;
        applyLoginAccessFailure(access, { setError });
        return;
      }
      const redirected = await completeExplicitSignInRedirect(loadedProfile);
      if (!redirected) {
        setError("Could not open your dashboard. Please try again.");
        toastApiError("Could not open your dashboard. Please try again.");
      }
    } catch (err) {
      explicitSignInRef.current = false;
      blockingAutoRedirectRef.current = false;
      const message = userErrorMessage(mapSignInError(err), "auth");
      setError(message);
      toastApiError(message);
      if (message === LOGIN_CREDENTIALS_ERROR) {
        setFieldErrors({
          email: LOGIN_CREDENTIALS_ERROR,
          password: LOGIN_CREDENTIALS_ERROR,
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const sendResetEmail = async () => {
    if (!resetRole) return;
    if (!isValidEmail(email)) {
      setError("Enter your email above first.");
      return;
    }
    setError("");
    setResetSent(false);
    setResetInfo("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          role: resetRole,
          orgSlug: loginOrgSlug,
          resetReturnUrl,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (
        data.code === "google-sign-in-only" ||
        data.code === "email-password-only"
      ) {
        setResetInfo(data.message || "This account cannot reset a password here.");
        return;
      }
      if (!res.ok || !data.success) {
        const message = userErrorMessage(data.message || data, "send");
        setError(message);
        toastApiError(message);
        return;
      }
      setResetSent(true);
      toastSuccess("Password reset email sent", "Check your inbox for the link.");
    } catch {
      const message = userErrorMessage(
        "Could not send the reset email. Check your connection and try again.",
        "send",
      );
      setError(message);
      toastApiError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const signInWithGoogleAccount = async () => {
    if (!googleSignInEnabled) return;
    const { mapGoogleSignInError, signInWithGoogle } = await import(
      "@/lib/auth/googleSignIn"
    );
    setError("");
    setResetSent(false);
    setFieldErrors({});
    setSubmitting(true);
    prepareExplicitSignIn();
    try {
      const { email: googleEmail, isNew } = await signInWithGoogle();
      if (googleEmail) setEmail(googleEmail);
      setGoogleIsNewUser(isNew);
      setGoogleAwaitingProfile(true);
      blockingAutoRedirectRef.current = false;
    } catch (err) {
      explicitSignInRef.current = false;
      blockingAutoRedirectRef.current = false;
      setError(mapGoogleSignInError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const cancelGoogleHipaa = async () => {
    if (!googleSignInEnabled) return;
    setHipaaModalOpen(false);
    setHipaaError("");
    setGoogleAwaitingProfile(false);
    setGoogleIsNewUser(null);
    explicitSignInRef.current = false;
    blockingAutoRedirectRef.current = false;
    await signOut(auth);
  };

  const confirmGoogleHipaa = async () => {
    if (!googleSignInEnabled) return;
    setHipaaSubmitting(true);
    setHipaaError("");
    try {
      const bootstrap = await bootstrapGooglePatient({
        orgSlug: loginOrgSlug,
        email: email.trim().toLowerCase() || user?.email,
      });
      setHipaaModalOpen(false);
      setGoogleIsNewUser(null);

      const orgSlug = bootstrap.orgSlug || loginOrgSlug;
      if (bootstrap.onboarded) {
        prepareExplicitSignIn();
        await completeExplicitSignInRedirect({
          role: "patient",
          orgSlug,
        });
        return;
      }

      const prefix = orgPathPrefix(orgSlug);
      const step = bootstrap.resumeStep || "s21";
      router.replace(`${prefix}/weightloss-onboard?step=${encodeURIComponent(step)}`);
    } catch (err) {
      setHipaaError(err?.message || "Could not save your consent.");
    } finally {
      setHipaaSubmitting(false);
    }
  };

  return {
    email,
    setEmail: onEmailChange,
    password,
    setPassword: onPasswordChange,
    error,
    fieldErrors,
    resetSent,
    resetInfo,
    submitting: submitting || (googleSignInEnabled ? hipaaSubmitting : false),
    canSubmit,
    signIn,
    sendResetEmail,
    emailMaxLength: EMAIL_LIMIT,
    ...(googleSignInEnabled
      ? {
          signInWithGoogleAccount,
          hipaaModalOpen,
          hipaaSubmitting,
          hipaaError,
          confirmGoogleHipaa,
          cancelGoogleHipaa,
        }
      : {}),
  };
}

function mapSignInError(err) {
  const code = err?.code || "";
  if (
    code === "auth/invalid-credential" ||
    code === "auth/user-not-found" ||
    code === "auth/wrong-password" ||
    code === "auth/invalid-login-credentials"
  ) {
    return LOGIN_CREDENTIALS_ERROR;
  }
  if (code === "auth/too-many-requests") {
    return "Too many attempts. Wait a minute and try again.";
  }
  if (
    code === "auth/network-request-failed" ||
    String(err?.message || "").toLowerCase().includes("quota")
  ) {
    return "Firebase is temporarily unavailable (daily limit or network). Try again later.";
  }
  return err?.message || "Could not sign in. Please try again.";
}
