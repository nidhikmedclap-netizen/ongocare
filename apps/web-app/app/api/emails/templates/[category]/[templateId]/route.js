// app/api/emails/templates/[category]/[templateId]/route.js
//
// GET / PUT email templates managed from the admin dashboard.

import { fail, ok, withAuth } from "@/lib/api";
import {
  getEmailTemplate,
  getTemplateMeta,
  saveEmailTemplate,
} from "@/services/emails/templateStore";
import {
  buildWelcomeEmailFromTemplate,
  buildWelcomeTemplateVars,
  WELCOME_PLACEHOLDERS,
} from "@/services/emails/templates/new-patient-signup/welcome-email";
import {
  buildOnboardingProcessEmailFromTemplate,
  buildOnboardingProcessTemplateVars,
  ONBOARDING_PROCESS_PLACEHOLDERS,
} from "@/services/emails/templates/new-patient-signup/onboarding-process";
import {
  buildPaymentSuccessEmailFromTemplate,
  buildPaymentSuccessTemplateVars,
  PAYMENT_SUCCESS_PLACEHOLDERS,
} from "@/services/emails/templates/patient-billing/payment-successful";
import {
  buildAppointmentBookedEmailFromTemplate,
  buildAppointmentBookedTemplateVars,
  APPOINTMENT_BOOKED_PLACEHOLDERS,
} from "@/services/emails/templates/patient-appointments/appointment-booked";
import {
  buildAppointmentReminderEmailFromTemplate,
  buildAppointmentReminderTemplateVars,
  APPOINTMENT_REMINDER_PLACEHOLDERS,
} from "@/services/emails/templates/patient-appointments/appointment-reminder";
import { resolveOrgEmailBranding } from "@/lib/branding/orgBranding";
import { EMAIL_LOGO } from "@/lib/branding/defaults";
import { DEFAULT_ORG_SLUG } from "@/lib/orgs";
import {
  getDashboardOrigin,
  getMarketingOrigin,
} from "@/lib/urls/siteOrigins";
import { dashboardPathForRole } from "@/lib/urls/dashboardPaths";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TEMPLATE_HANDLERS = {
  "new-patient-signup/welcome-email": {
    placeholders: WELCOME_PLACEHOLDERS,
    buildPreview: async ({ subject, body, branding, logoUrl, portalLink }) => {
      const vars = buildWelcomeTemplateVars({
        profile: { firstName: "Jane", lastName: "Doe", email: "jane.smith@example.com" },
        branding,
        portalLink,
        fallbackEmail: "jane.smith@example.com",
      });
      return buildWelcomeEmailFromTemplate({
        subjectTemplate: subject,
        bodyTemplate: body,
        branding,
        logoUrl,
        portalLink,
        vars,
      });
    },
  },
  "new-patient-signup/onboarding-process": {
    placeholders: ONBOARDING_PROCESS_PLACEHOLDERS,
    buildPreview: async ({ subject, body, branding, logoUrl, portalLink }) => {
      const onboardingLink = `${portalLink.replace(/\/dashboard\/patient\/?$/, "")}/weightloss-onboard?step=s21`;
      const vars = buildOnboardingProcessTemplateVars({
        profile: { firstName: "Jane", lastName: "Doe", email: "jane.smith@example.com" },
        branding,
        portalLink,
        onboardingLink,
        fallbackEmail: "jane.smith@example.com",
      });
      return buildOnboardingProcessEmailFromTemplate({
        subjectTemplate: subject,
        bodyTemplate: body,
        branding,
        logoUrl,
        portalLink: onboardingLink,
        vars,
      });
    },
  },
  "patient-billing/payment-successful": {
    placeholders: PAYMENT_SUCCESS_PLACEHOLDERS,
    buildPreview: async ({ subject, body, branding, logoUrl, portalLink }) => {
      const vars = buildPaymentSuccessTemplateVars({
        profile: { firstName: "Jane", lastName: "Doe", email: "jane.smith@example.com" },
        branding,
        portalLink,
        fallbackEmail: "jane.smith@example.com",
        planName: "3-month program",
        amountPaid: "$299.00",
        paymentBrand: "Visa",
        paymentLast4: "4242",
      });
      return buildPaymentSuccessEmailFromTemplate({
        subjectTemplate: subject,
        bodyTemplate: body,
        branding,
        logoUrl,
        portalLink,
        vars,
      });
    },
  },
  "patient-appointments/appointment-booked": {
    placeholders: APPOINTMENT_BOOKED_PLACEHOLDERS,
    buildPreview: async ({ subject, body, branding, logoUrl, portalLink }) => {
      const vars = buildAppointmentBookedTemplateVars({
        profile: { firstName: "Jane", lastName: "Doe", email: "jane.smith@example.com" },
        branding,
        portalLink,
        fallbackEmail: "jane.smith@example.com",
        doctorName: "Dr. Sarah Johnson",
        appointmentType: "Initial consultation",
        appointmentDate: "Monday, June 23, 2026",
        appointmentTime: "10:00 AM EST",
      });
      return buildAppointmentBookedEmailFromTemplate({
        subjectTemplate: subject,
        bodyTemplate: body,
        branding,
        logoUrl,
        portalLink,
        vars,
      });
    },
  },
  "patient-appointments/appointment-reminder": {
    placeholders: APPOINTMENT_REMINDER_PLACEHOLDERS,
    buildPreview: async ({ subject, body, branding, logoUrl, portalLink }) => {
      const vars = buildAppointmentReminderTemplateVars({
        profile: { firstName: "Jane", lastName: "Doe", email: "jane.smith@example.com" },
        branding,
        portalLink,
        fallbackEmail: "jane.smith@example.com",
        doctorName: "Dr. Sarah Johnson",
        appointmentType: "Initial consultation",
        appointmentDate: "Monday, June 23, 2026",
        appointmentTime: "10:00 AM EST",
      });
      return buildAppointmentReminderEmailFromTemplate({
        subjectTemplate: subject,
        bodyTemplate: body,
        branding,
        logoUrl,
        portalLink,
        vars,
      });
    },
  },
};

function resolveLogoUrl() {
  const marketing =
    getMarketingOrigin() ||
    process.env.EMAIL_ASSET_ORIGIN ||
    "https://web.ongoweightloss.com";
  return `${marketing.replace(/\/$/, "")}${EMAIL_LOGO.logoSrc}`;
}

function resolvePortalLink() {
  const marketing =
    getMarketingOrigin() ||
    process.env.EMAIL_ASSET_ORIGIN ||
    "https://web.ongoweightloss.com";
  const dashOrigin = getDashboardOrigin() || marketing;
  return `${dashOrigin.replace(/\/$/, "")}${dashboardPathForRole("patient", DEFAULT_ORG_SLUG)}`;
}

export const GET = withAuth({ role: "admin" }, async (request, ctx, auth) => {
  const { category, templateId } = await ctx.params;
  const template = await getEmailTemplate(category, templateId);
  if (!template) {
    return fail("Template not found.", 404);
  }

  const meta = getTemplateMeta(category, templateId);
  const handler = TEMPLATE_HANDLERS[`${category}/${templateId}`];
  const url = new URL(request.url);
  const wantPreview = url.searchParams.get("preview") === "1";

  let preview = null;
  if (wantPreview && handler) {
    const branding = await resolveOrgEmailBranding(DEFAULT_ORG_SLUG);
    preview = await handler.buildPreview({
      subject: template.subject,
      body: template.body,
      branding,
      logoUrl: resolveLogoUrl(),
      portalLink: resolvePortalLink(),
    });
  }

  return ok({
    meta,
    template,
    placeholders: handler?.placeholders || [],
    preview,
    canEdit: Boolean(auth.isSuper || auth.user?.role === "admin"),
  });
});

export const PUT = withAuth({ role: "admin" }, async (request, ctx, auth) => {
  const { category, templateId } = await ctx.params;
  const meta = getTemplateMeta(category, templateId);
  if (!meta?.id) {
    return fail("Template not found.", 404);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return fail("Invalid request body.", 400);
  }

  try {
    const saved = await saveEmailTemplate({
      category,
      templateId,
      subject: body?.subject,
      body: body?.body,
      updatedBy: auth.user?.uid || auth.decoded?.sub,
    });
    return ok({ template: saved, message: "Template saved." });
  } catch (err) {
    return fail(err?.message || "Could not save template.", 400);
  }
});
