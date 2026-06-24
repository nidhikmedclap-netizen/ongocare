// services/emails/templates/new-patient-signup/welcome-email.js
//
// Welcome email defaults, placeholder rendering, and branded HTML shell.

import {
  applyTemplatePlaceholders,
  buildBrandedEmailFromTemplate,
  buildBrandingVars,
  buildPatientNameVars,
  deriveNameFromEmail,
} from "@/services/emails/brandedEmail";

export { applyTemplatePlaceholders, deriveNameFromEmail };

export const templateMeta = {
  id: "welcome-email",
  category: "new-patient-signup",
  title: "Welcome email",
};

/** @deprecated use templateMeta */
export const meta = templateMeta;

export const WELCOME_EMAIL_DEFAULTS = {
  subject: "Welcome to {{shortName}}",
  body: [
    "Hi {{firstName}},",
    "",
    "Welcome to {{orgName}}!",
    "",
    "Thank you for signing up. Your patient portal account has been successfully created.",
    "",
    "You can continue your registration anytime and access your portal here:",
    "{{portalLink}}",
    "",
    "If you have any questions, contact us at {{contactEmail}}.",
    "",
    "— {{copyrightName}}",
    "{{footerTagline}}",
  ].join("\n"),
};

export const WELCOME_PLACEHOLDERS = [
  "{{firstName}}",
  "{{lastName}}",
  "{{recipientName}}",
  "{{email}}",
  "{{orgName}}",
  "{{shortName}}",
  "{{portalLink}}",
  "{{contactEmail}}",
  "{{copyrightName}}",
  "{{footerTagline}}",
];

export function buildWelcomeEmailFromTemplate(args) {
  return buildBrandedEmailFromTemplate({
    ...args,
    preheader: "Your patient portal account is ready.",
    ctaLabel: "Continue registration",
  });
}

export function buildWelcomeEmail({
  recipientName,
  branding,
  logoUrl,
  portalLink,
}) {
  const firstName =
    recipientName?.split(/\s+/)[0] ||
    (recipientName ? recipientName : "");
  const vars = {
    firstName: firstName || "there",
    lastName: "",
    recipientName: recipientName || "",
    email: "",
    ...buildBrandingVars(branding, portalLink),
  };
  return buildWelcomeEmailFromTemplate({
    subjectTemplate: WELCOME_EMAIL_DEFAULTS.subject,
    bodyTemplate: WELCOME_EMAIL_DEFAULTS.body,
    branding,
    logoUrl,
    portalLink,
    vars,
  });
}

export function buildWelcomeTemplateVars({
  profile = {},
  branding,
  portalLink,
  fallbackEmail = "",
}) {
  return {
    ...buildPatientNameVars(profile, fallbackEmail),
    ...buildBrandingVars(branding, portalLink),
  };
}
