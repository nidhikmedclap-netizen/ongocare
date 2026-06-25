// services/emails/templates/new-patient-signup/onboarding-process.js
//
// Reminder to finish onboarding — sent after email/password signup via save-progress.

import {
  buildBrandedEmailFromTemplate,
  buildBrandingVars,
  buildPatientNameVars,
} from "@/services/emails/brandedEmail";

export const templateMeta = {
  id: "onboarding-process",
  category: "new-patient-signup",
  title: "Onboarding process",
};

export const ONBOARDING_PROCESS_DEFAULTS = {
  subject: "Finish your registration — {{shortName}}",
  body: [
    "Hi {{firstName}},",
    "",
    "You started signing up with {{orgName}}, but your registration is not complete yet.",
    "",
    "Pick up where you left off — it only takes a few minutes to finish your health questionnaire and continue your weight-loss journey.",
    "",
    "Continue your registration here:",
    "{{onboardingLink}}",
    "",
    "You can also sign in to your patient portal anytime:",
    "{{portalLink}}",
    "",
    "If you have questions or need help, contact us at {{contactEmail}}.",
    "",
    "— {{copyrightName}}",
    "{{footerTagline}}",
  ].join("\n"),
};

export const ONBOARDING_PROCESS_PLACEHOLDERS = [
  "{{firstName}}",
  "{{lastName}}",
  "{{recipientName}}",
  "{{email}}",
  "{{onboardingLink}}",
  "{{orgName}}",
  "{{shortName}}",
  "{{portalLink}}",
  "{{contactEmail}}",
  "{{copyrightName}}",
  "{{footerTagline}}",
];

export function buildOnboardingProcessEmailFromTemplate(args) {
  return buildBrandedEmailFromTemplate({
    ...args,
    preheader: "Your registration is almost complete — continue where you left off.",
    ctaLabel: "Continue registration",
  });
}

export function buildOnboardingProcessTemplateVars({
  profile = {},
  branding,
  portalLink,
  onboardingLink,
  fallbackEmail = "",
}) {
  return {
    ...buildPatientNameVars(profile, fallbackEmail),
    ...buildBrandingVars(branding, portalLink),
    onboardingLink: onboardingLink || portalLink || "",
  };
}
