// services/emails/templates/patient-appointments/appointment-booked.js

import {
  buildBrandedEmailFromTemplate,
  buildBrandingVars,
  buildPatientNameVars,
} from "@/services/emails/brandedEmail";

export const templateMeta = {
  id: "appointment-booked",
  category: "patient-appointments",
  title: "Appointment confirmed",
};

export const APPOINTMENT_BOOKED_DEFAULTS = {
  subject: "Your appointment is confirmed — {{shortName}}",
  body: [
    "Hi {{firstName}},",
    "",
    "Your {{appointmentType}} with {{doctorName}} is confirmed.",
    "",
    "Date: {{appointmentDate}}",
    "Time: {{appointmentTime}}",
    "",
    "Please join on time from your patient portal:",
    "{{portalLink}}",
    "",
    "Questions? Contact us at {{contactEmail}}.",
    "",
    "— {{copyrightName}}",
    "{{footerTagline}}",
  ].join("\n"),
};

export const APPOINTMENT_BOOKED_PLACEHOLDERS = [
  "{{firstName}}",
  "{{lastName}}",
  "{{recipientName}}",
  "{{email}}",
  "{{doctorName}}",
  "{{appointmentType}}",
  "{{appointmentDate}}",
  "{{appointmentTime}}",
  "{{orgName}}",
  "{{shortName}}",
  "{{portalLink}}",
  "{{contactEmail}}",
  "{{copyrightName}}",
  "{{footerTagline}}",
];

export function buildAppointmentBookedTemplateVars({
  profile = {},
  branding,
  portalLink,
  fallbackEmail = "",
  doctorName = "",
  appointmentType = "",
  appointmentDate = "",
  appointmentTime = "",
}) {
  return {
    ...buildPatientNameVars(profile, fallbackEmail),
    ...buildBrandingVars(branding, portalLink),
    doctorName: doctorName || "your doctor",
    appointmentType: appointmentType || "consultation",
    appointmentDate: appointmentDate || "—",
    appointmentTime: appointmentTime || "—",
  };
}

export function buildAppointmentBookedEmailFromTemplate(args) {
  return buildBrandedEmailFromTemplate({
    ...args,
    preheader: "Your consultation appointment is confirmed.",
    ctaLabel: "View appointment",
  });
}
