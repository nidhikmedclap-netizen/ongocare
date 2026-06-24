// services/emails/sendPatientWelcomeEmail.js
//
// Branded welcome email after patient email/password signup.

import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { resolveOrgEmailBranding } from "@/lib/branding/orgBranding";
import { DEFAULT_ORG_SLUG } from "@/lib/orgs";
import { normalizeOrgSlug } from "@/services/firebase/users";
import { resolveEmailAssetUrl, resolvePatientPortalLink } from "@/services/emails/emailAssets";
import {
  buildWelcomeEmailFromTemplate,
  buildWelcomeTemplateVars,
} from "@/services/emails/templates/new-patient-signup/welcome-email";
import { getEmailTemplate } from "@/services/emails/templateStore";
import { sendTransactionalEmail } from "@/services/emails/sendTransactionalEmail";

if (typeof window !== "undefined") {
  throw new Error(
    "[email/sendPatientWelcomeEmail] Imported from a browser context. Server-only.",
  );
}

const TEMPLATE_CATEGORY = "new-patient-signup";
const TEMPLATE_ID = "welcome-email";

/**
 * Send the new-patient welcome email once, after email/password signup.
 *
 * @param {object} params
 * @param {string} params.uid
 * @param {string} [params.orgSlug]
 * @param {string} [params.fallbackEmail]
 * @param {object} [params.profileHints] — email (and optional name overrides)
 */
export async function sendPatientWelcomeEmail({
  uid,
  orgSlug = null,
  fallbackEmail = null,
  profileHints = null,
}) {
  const ref = adminDb.collection("users").doc(uid);
  const snap = await ref.get();
  if (!snap.exists) {
    return { ok: false, skipped: true, reason: "no-profile" };
  }

  const storedProfile = snap.data() || {};
  const hints =
    profileHints && typeof profileHints === "object" ? profileHints : {};
  const profile = {
    ...storedProfile,
    ...(hints.firstName ? { firstName: String(hints.firstName).trim() } : {}),
    ...(hints.lastName ? { lastName: String(hints.lastName).trim() } : {}),
    ...(hints.email
      ? { email: String(hints.email).trim().toLowerCase() }
      : {}),
  };
  if (profile.role && profile.role !== "patient") {
    return { ok: false, skipped: true, reason: "not-patient" };
  }
  if (profile.welcomeEmailSentAt) {
    return { ok: false, skipped: true, reason: "already-sent" };
  }

  const toEmail = String(profile.email || fallbackEmail || "")
    .trim()
    .toLowerCase();
  if (!toEmail || !toEmail.includes("@")) {
    return { ok: false, skipped: true, reason: "missing-email" };
  }

  const brandingOrgSlug = normalizeOrgSlug(
    orgSlug || profile.orgSlug || DEFAULT_ORG_SLUG,
  );
  const branding = await resolveOrgEmailBranding(brandingOrgSlug);
  const logoUrl = resolveEmailAssetUrl(branding.emailLogoSrc);
  const portalLink = resolvePatientPortalLink(brandingOrgSlug);

  const stored = await getEmailTemplate(TEMPLATE_CATEGORY, TEMPLATE_ID);
  if (!stored) {
    return { ok: false, skipped: true, reason: "template-not-found" };
  }

  const vars = buildWelcomeTemplateVars({
    profile,
    branding,
    portalLink,
    fallbackEmail: toEmail,
  });

  const { subject, text, html } = buildWelcomeEmailFromTemplate({
    subjectTemplate: stored.subject,
    bodyTemplate: stored.body,
    branding,
    logoUrl,
    portalLink,
    vars,
  });

  const delivery = await sendTransactionalEmail({
    toEmail,
    subject,
    text,
    html,
    category: "patient_welcome",
    meta: {
      uid,
      orgSlug: brandingOrgSlug,
      template: `${TEMPLATE_CATEGORY}/${TEMPLATE_ID}`,
      templateSource: stored.source,
    },
  });

  if (!delivery.ok) {
    if (delivery.reason === "smtp-not-configured") {
      // eslint-disable-next-line no-console
      console.warn(
        "[welcome-email] SMTP not configured — welcome email not sent.",
        { uid },
      );
    }
    return { ok: false, skipped: false, reason: delivery.reason || "send-failed" };
  }

  await ref.update({
    welcomeEmailSentAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return { ok: true, skipped: false };
}
