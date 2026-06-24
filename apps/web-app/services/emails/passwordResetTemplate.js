// services/emails/passwordResetTemplate.js
//
// Branded HTML + plain-text templates for password reset emails.

import { buildActionEmail } from "@/services/emails/emailLayout";

/**
 * @param {object} params
 * @param {string} params.resetLink
 * @param {string} params.recipientName
 * @param {"patient"|"doctor"} params.role
 * @param {object} params.branding — from resolveOrgEmailBranding()
 * @param {string} params.logoUrl — absolute URL for logo image
 */
export function buildPasswordResetEmail({ resetLink, recipientName, role, branding, logoUrl }) {
  const orgName = branding.orgName;
  const shortName = branding.shortName;
  const greeting = recipientName ? `Hi ${recipientName},` : "Hi there,";
  const portalLabel = role === "doctor" ? "clinician portal" : "patient portal";
  const subject = `Reset your ${shortName} password`;

  return buildActionEmail({
    subject,
    preheader: `Secure link to reset your ${shortName} password.`,
    greeting,
    paragraphs: [
      `We received a request to reset the password for your ${orgName} ${portalLabel} account.`,
      "Tap the button below to choose a new password. This link expires in one hour.",
    ],
    buttonLabel: "Reset password",
    buttonHref: resetLink,
    footnote:
      "If you did not request a password reset, you can safely ignore this email. Your password will not change.",
    branding,
    logoUrl,
  });
}
