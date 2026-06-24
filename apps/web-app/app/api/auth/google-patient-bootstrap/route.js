// app/api/auth/google-patient-bootstrap/route.js
//
// POST: after Google sign-in + HIPAA confirm, create or update a minimal
// patient profile so the user can reach the dashboard and resume at s21.

import {
  DEFAULT_ORG_SLUG,
  normalizeOrgSlug,
  upsertUser,
} from "@/services/firebase/users";
import { adminDb } from "@/lib/firebase/admin";
import { fail, ok, withAuth } from "@/lib/api";
import { ONBOARDING_SUCCESS_STEPS } from "@/lib/onboarding/resumePath";

function isPatientOnboarded(data) {
  if (!data) return false;
  if (data.currentStep === "iThanks" || data.currentStep === "dHard") {
    return false;
  }
  if (data.status === "onboarded") return true;
  return ONBOARDING_SUCCESS_STEPS.has(data.currentStep);
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = withAuth(async (request, _ctx, { decoded }) => {
  try {
    const body = await request.json().catch(() => ({}));
    if (body.consentHIPAA !== true) {
      return fail("HIPAA consent is required to continue.", 400);
    }

    const email =
      (typeof body.email === "string" && body.email.trim().toLowerCase()) ||
      decoded.email?.trim().toLowerCase() ||
      "";
    if (!email) {
      return fail("No email address on this account.", 400);
    }

    const existing = await adminDb.collection("users").doc(decoded.uid).get();
    if (existing.exists) {
      const role = existing.data()?.role;
      if (role && role !== "patient") {
        return fail(
          "This Google account is registered for a different role. Use the correct login page.",
          403,
        );
      }
    }

    const orgSlug = normalizeOrgSlug(body.orgSlug || DEFAULT_ORG_SLUG);
    const existingData = existing.exists ? existing.data() : null;
    const onboarded = isPatientOnboarded(existingData);

    const existingStep = existingData?.currentStep;
    const resumeStep =
      typeof existingStep === "string" &&
      existingStep &&
      existingStep !== "s20"
        ? existingStep
        : "s21";

    const fields = {
      email,
      consentHIPAA: true,
      authProvider: "google",
      emailVerified: !!decoded.email_verified,
    };

    const resolvedOrgSlug = existingData?.orgSlug || orgSlug;

    // Never downgrade an onboarded patient back to incomplete.
    if (!existing.exists) {
      fields.orgSlug = orgSlug;
      fields.currentStep = "s21";
      fields.status = "incomplete";
      fields.formSnapshot = { email, consentH: true };
    } else if (!onboarded) {
      fields.currentStep = resumeStep;
      if (existingData?.status) {
        fields.status = existingData.status;
      } else {
        fields.status = "incomplete";
      }
      fields.formSnapshot = {
        ...(existingData?.onboarding || {}),
        email,
        consentH: true,
      };
    }

    await upsertUser(decoded.uid, fields);

    return ok({
      onboarded,
      resumeStep: onboarded ? "" : resumeStep,
      orgSlug: resolvedOrgSlug,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[google-patient-bootstrap] error:", err);
    return fail("Could not complete Google sign-in setup.", 500);
  }
});
