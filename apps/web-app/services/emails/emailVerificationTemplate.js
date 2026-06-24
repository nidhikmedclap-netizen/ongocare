// services/emails/emailVerificationTemplate.js
//
// Branded HTML + plain-text for email address verification.
// Use with Firebase Admin generateEmailVerificationLink + SMTP send.

import { buildActionEmail } from "@/services/emails/emailLayout";

/**
 * @param {object} params
 * @param {string} params.verifyLink
 * @param {string} params.recipientName
 * @param {object} params.branding — from resolveOrgEmailBranding()
 * @param {string} params.logoUrl — absolute URL for logo image
 */
export function buildEmailVerificationEmail({
  verifyLink,
  recipientName,
  branding,
  logoUrl,
}) {
  const orgName = branding.orgName;
  const shortName = branding.shortName;
  const greeting = recipientName ? `Hi ${recipientName},` : "Hi there,";
  const subject = `Verify your email — ${shortName}`;

  return buildActionEmail({
    subject,
    preheader: `Confirm your email to finish setting up your ${shortName} account.`,
    greeting,
    paragraphs: [
      `Thanks for creating your ${orgName} account.`,
      "Please verify your email address so we can keep your account secure and send important updates about your care.",
    ],
    buttonLabel: "Verify email address",
    buttonHref: verifyLink,
    footnote:
      "If you did not create this account, you can safely ignore this email.",
    branding,
    logoUrl,
  });
}
