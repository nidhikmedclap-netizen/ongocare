// lib/auth/googlePatientBootstrap.js
//
// Client helper: record HIPAA consent and bootstrap a minimal patient profile
// after Google sign-in (login or onboarding).

"use client";

import { auth } from "@/lib/firebase/auth";
import { throwIfApiFailed } from "@/lib/ui/userErrorMessage";

/** True when HIPAA consent is already recorded on the Firestore profile. */
export function hasGoogleHipaaConsent(profile) {
  if (!profile) return false;
  if (profile.consentHIPAA) return true;
  const onb = profile.onboarding || profile.formSnapshot || {};
  return !!onb.consentH;
}

/**
 * Whether to show the HIPAA modal after Google sign-in.
 *
 * @param {object|null|undefined} profile — client Firestore profile, if loaded
 * @param {{ isNewGoogleUser?: boolean|null }} [options]
 *   - isNewGoogleUser === true  → always prompt (brand-new Firebase Google account)
 *   - isNewGoogleUser === false → returning account; never prompt solely because profile is null
 */
export function needsGoogleHipaaConsent(profile, { isNewGoogleUser } = {}) {
  if (hasGoogleHipaaConsent(profile)) return false;
  if (isNewGoogleUser === true) return true;
  if (isNewGoogleUser === false) return false;
  // Persisted session before Google button click — wait for profile load.
  if (!profile) return false;
  return true;
}

/**
 * Create or update users/{uid} for a Google patient after HIPAA confirm.
 * @returns {Promise<void>}
 */
export async function bootstrapGooglePatient({ orgSlug, email } = {}) {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Not signed in. Please try again.");
  }

  let idToken;
  try {
    idToken = await user.getIdToken();
  } catch {
    throw new Error("Could not verify your session. Please try again.");
  }

  const res = await fetch("/api/auth/google-patient-bootstrap", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({
      orgSlug,
      consentHIPAA: true,
      email: email || user.email?.trim().toLowerCase() || undefined,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    throwIfApiFailed(data, "Could not save your consent. Please try again.");
  }

  return {
    onboarded: !!data.onboarded,
    resumeStep: typeof data.resumeStep === "string" ? data.resumeStep : "s21",
    orgSlug: typeof data.orgSlug === "string" ? data.orgSlug : undefined,
  };
}
