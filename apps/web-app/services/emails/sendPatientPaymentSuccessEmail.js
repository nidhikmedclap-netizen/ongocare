// services/emails/sendPatientPaymentSuccessEmail.js

import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { resolveOrgEmailBranding } from "@/lib/branding/orgBranding";
import { DEFAULT_ORG_SLUG } from "@/li
b/orgs";
import { PLAN_LABELS, formatMoney } from "@/lib/billing/money";
import { hasPlanCheckout } from "@/lib/billing/patientPayment";
import { normalizeOrgSlug } from "@/services/firebase/users";
import { resolveEmailAssetUrl, resolvePatientPortalLink } from "@/services/emails/emailAssets";
import {
  buildPaymentSuccessEmailFromTemplate,
  buildPaymentSuccessTemplateVars,
} from "@/services/emails/templates/patient-billing/payment-successful";
import { getEmailTemplate } from "@/services/emails/templateStore";
import { sendTransactionalEmail } from "@/services/emails/sendTransactionalEmail";

if (typeof window !== "undefined") {
  throw new Error("[email/sendPatientPaymentSuccessEmail] Server-only.");
}

const TEMPLATE_CATEGORY = "patient-billing";
const TEMPLATE_ID = "payment-successful";

function resolvePlanLabel(planId) {
  const key = String(planId || "").trim();
  return PLAN_LABELS[key] || key || "your plan";
}

function formatCardBrand(brand) {
  const raw = String(brand || "").trim();
  if (!raw) return "Card";
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
}

/**
 * @param {object} params
 * @param {string} params.uid
 * @param {object} params.paymentRow — planPayments row from upsertPlanPayment
 */
export async function sendPatientPaymentSuccessEmail({ uid, paymentRow }) {
  if (!uid || !paymentRow) {
    return { ok: false, skipped: true, reason: "missing-data" };
  }
  if (
    !hasPlanCheckout({
      paymentStatus: paymentRow.paymentStatus,
      paid: paymentRow.captured,
    })
  ) {
    return { ok: false, skipped: true, reason: "checkout-incomplete" };
  }

  const ref = adminDb.collection("users").doc(uid);
  const snap = await ref.get();
  if (!snap.exists) {
    return { ok: false, skipped: true, reason: "no-profile" };
  }

  const profile = snap.data() || {};
  if (profile.role && profile.role !== "patient") {
    return { ok: false, skipped: true, reason: "not-patient" };
  }

  const paymentIntentId = String(paymentRow.stripePaymentIntentId || paymentRow.id || "");
  if (
    profile.paymentSuccessEmailIntentId &&
    profile.paymentSuccessEmailIntentId === paymentIntentId
  ) {
    return { ok: false, skipped: true, reason: "already-sent" };
  }

  const toEmail = String(profile.email || "").trim().toLowerCase();
  if (!toEmail || !toEmail.includes("@")) {
    return { ok: false, skipped: true, reason: "missing-email" };
  }

  const brandingOrgSlug = normalizeOrgSlug(
    paymentRow.orgSlug || profile.orgSlug || DEFAULT_ORG_SLUG,
  );
  const branding = await resolveOrgEmailBranding(brandingOrgSlug);
  const logoUrl = resolveEmailAssetUrl(branding.emailLogoSrc);
  const portalLink = resolvePatientPortalLink(brandingOrgSlug);

  const stored = await getEmailTemplate(TEMPLATE_CATEGORY, TEMPLATE_ID);
  if (!stored) {
    return { ok: false, skipped: true, reason: "template-not-found" };
  }

  const vars = buildPaymentSuccessTemplateVars({
    profile,
    branding,
    portalLink,
    fallbackEmail: toEmail,
    planName: resolvePlanLabel(paymentRow.plan),
    amountPaid: formatMoney(paymentRow.amountCents, paymentRow.currency),
    paymentBrand: formatCardBrand(paymentRow.cardBrand),
    paymentLast4: paymentRow.cardLast4 || "****",
  });

  const { subject, text, html } = buildPaymentSuccessEmailFromTemplate({
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
    category: "patient_payment_success",
    meta: {
      uid,
      orgSlug: brandingOrgSlug,
      paymentIntentId,
      template: `${TEMPLATE_CATEGORY}/${TEMPLATE_ID}`,
      templateSource: stored.source,
    },
  });

  if (!delivery.ok) {
    if (delivery.reason === "smtp-not-configured") {
      // eslint-disable-next-line no-console
      console.warn(
        "[payment-success-email] SMTP not configured — email not sent.",
        { uid, paymentIntentId },
      );
    }
    return { ok: false, skipped: false, reason: delivery.reason || "send-failed" };
  }

  await ref.update({
    paymentSuccessEmailIntentId: paymentIntentId,
    paymentSuccessEmailSentAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return { ok: true, skipped: false };
}
