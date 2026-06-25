// Onboarding-process pending email — sent by cron only when:
//   email/password signup, status !== onboarded, signup age > 5 minutes.

import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { resolveOrgEmailBranding } from "@/lib/branding/orgBranding";
import { DEFAULT_ORG_SLUG } from "@/lib/orgs";
import { normalizeOrgSlug } from "@/services/firebase/users";
import {
  resolveEmailAssetUrl,
  resolveOnboardingResumeLink,
  resolvePatientPortalLink,
} from "@/services/emails/emailAssets";
import {
  buildOnboardingProcessEmailFromTemplate,
  buildOnboardingProcessTemplateVars,
} from "@/services/emails/templates/new-patient-signup/onboarding-process";
import { getEmailTemplate } from "@/services/emails/templateStore";
import { sendTransactionalEmail } from "@/services/emails/sendTransactionalEmail";

if (typeof window !== "undefined") {
  throw new Error(
    "[email/sendPatientOnboardingProcessEmail] Imported from a browser context. Server-only.",
  );
}

const TEMPLATE_CATEGORY = "new-patient-signup";
const TEMPLATE_ID = "onboarding-process";
export const ONBOARDING_PROCESS_REMINDER_MINUTES = 5;
const REMINDER_MS = ONBOARDING_PROCESS_REMINDER_MINUTES * 60 * 1000;
const SENT_AT_FIELD = "onboardingProcessEmailSentAt";

function createdAtMs(profile) {
  const ts = profile?.createdAt;
  return typeof ts?.toMillis === "function" ? ts.toMillis() : null;
}

function isPatientRole(profile) {
  const role = String(profile?.role || "patient").trim().toLowerCase();
  return role === "patient";
}

function alreadySentOnboardingProcessEmail(profile) {
  return Boolean(
    profile?.[SENT_AT_FIELD] || profile?.onboardingProcess74hEmailSentAt,
  );
}

/**
 * @param {object} params
 * @param {string} params.uid
 * @param {object} [params.profile] — optional preloaded Firestore doc
 */
export async function sendPatientOnboardingProcessEmail({ uid, profile = null }) {
  const ref = adminDb.collection("users").doc(uid);
  const snap = profile ? null : await ref.get();
  const mergedProfile = snap?.data() || profile || {};

  if (!profile && !snap?.exists) {
    return { ok: false, skipped: true, reason: "no-profile" };
  }

  if (!isPatientRole(mergedProfile)) {
    return { ok: false, skipped: true, reason: "not-patient" };
  }

  if (mergedProfile.status === "onboarded") {
    return { ok: false, skipped: true, reason: "already-onboarded" };
  }

  if (mergedProfile.authProvider === "google") {
    return { ok: false, skipped: true, reason: "google-signup" };
  }

  if (alreadySentOnboardingProcessEmail(mergedProfile)) {
    return { ok: false, skipped: true, reason: "already-sent" };
  }

  const signedUpMs = createdAtMs(mergedProfile);
  if (!signedUpMs || Date.now() - signedUpMs < REMINDER_MS) {
    return { ok: false, skipped: true, reason: "too-recent" };
  }

  const toEmail = String(mergedProfile.email || "")
    .trim()
    .toLowerCase();
  if (!toEmail || !toEmail.includes("@")) {
    return { ok: false, skipped: true, reason: "missing-email" };
  }

  const brandingOrgSlug = normalizeOrgSlug(
    mergedProfile.orgSlug || DEFAULT_ORG_SLUG,
  );
  const branding = await resolveOrgEmailBranding(brandingOrgSlug);
  const logoUrl = resolveEmailAssetUrl(branding.emailLogoSrc);
  const portalLink = resolvePatientPortalLink(brandingOrgSlug);
  const onboardingLink = resolveOnboardingResumeLink(mergedProfile);

  const stored = await getEmailTemplate(TEMPLATE_CATEGORY, TEMPLATE_ID);
  if (!stored) {
    return { ok: false, skipped: true, reason: "template-not-found" };
  }

  const vars = buildOnboardingProcessTemplateVars({
    profile: mergedProfile,
    branding,
    portalLink,
    onboardingLink,
    fallbackEmail: toEmail,
  });

  const { subject, text, html } = buildOnboardingProcessEmailFromTemplate({
    subjectTemplate: stored.subject,
    bodyTemplate: stored.body,
    branding,
    logoUrl,
    portalLink: onboardingLink,
    vars,
  });

  const delivery = await sendTransactionalEmail({
    toEmail,
    subject,
    text,
    html,
    category: "patient_onboarding_process",
    meta: {
      uid,
      orgSlug: brandingOrgSlug,
      template: `${TEMPLATE_CATEGORY}/${TEMPLATE_ID}`,
      templateSource: stored.source,
      trigger: "cron",
    },
  });

  if (!delivery.ok) {
    if (delivery.reason === "smtp-not-configured") {
      // eslint-disable-next-line no-console
      console.warn(
        "[onboarding-process-email] SMTP not configured — email not sent.",
        { uid },
      );
    }
    return { ok: false, skipped: false, reason: delivery.reason || "send-failed" };
  }

  await ref.update({
    [SENT_AT_FIELD]: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return { ok: true, skipped: false };
}
