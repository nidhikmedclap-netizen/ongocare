// services/emails/templates/patient-billing/payment-successful.js

import {
  buildBrandedEmailFromTemplate,
  buildBrandingVars,
  buildPatientNameVars,
} from "@/services/emails/brandedEmail";

export const templateMeta = {
  id: "payment-successful",
  category: "patient-billing",
  title: "Payment successful",
};

export const PAYMENT_SUCCESS_DEFAULTS = {
  subject: "Payment received — {{shortName}}",
  body: [
    "Hi {{firstName}},",
    "",
    "Thank you! Your payment for {{planName}} was successful.",
    "",
    "Amount: {{amountPaid}}",
    "Card: {{paymentBrand}} ending in {{paymentLast4}}",
    "",
    "You can view your patient portal anytime:",
    "{{portalLink}}",
    "",
    "If you have questions, contact us at {{contactEmail}}.",
    "",
    "— {{copyrightName}}",
    "{{footerTagline}}",
  ].join("\n"),
};

export const PAYMENT_SUCCESS_PLACEHOLDERS = [
  "{{firstName}}",
  "{{lastName}}",
  "{{recipientName}}",
  "{{email}}",
  "{{planName}}",
  "{{amountPaid}}",
  "{{paymentBrand}}",
  "{{paymentLast4}}",
  "{{orgName}}",
  "{{shortName}}",
  "{{portalLink}}",
  "{{contactEmail}}",
  "{{copyrightName}}",
  "{{footerTagline}}",
];

export function buildPaymentSuccessTemplateVars({
  profile = {},
  branding,
  portalLink,
  fallbackEmail = "",
  planName = "",
  amountPaid = "",
  paymentBrand = "",
  paymentLast4 = "",
}) {
  return {
    ...buildPatientNameVars(profile, fallbackEmail),
    ...buildBrandingVars(branding, portalLink),
    planName: planName || "your plan",
    amountPaid: amountPaid || "—",
    paymentBrand: paymentBrand || "Card",
    paymentLast4: paymentLast4 || "****",
  };
}

export function buildPaymentSuccessEmailFromTemplate(args) {
  return buildBrandedEmailFromTemplate({
    ...args,
    preheader: "Your payment was received successfully.",
    ctaLabel: "View patient portal",
  });
}
