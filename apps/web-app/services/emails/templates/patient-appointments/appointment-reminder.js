// services/emails/templates/patient-appointments/appointment-reminder.js

import {
  buildBrandedEmailFromTemplate,
  buildBrandingVars,
  buildPatientNameVars,
} from "@/services/emails/brandedEmail";

export const templateMeta = {
  id: "appointment-reminder",
  category: "patient-appointments",
  title: "Appointment reminder",
};

export const APPOINTMENT_REMINDER_DEFAULTS = {
  subject: "Reminder: your appointment is in 2 minutes — {{shortName}}",
  body: [
    "Hi {{firstName}},",
    "",
    "This is a reminder that your {{appointmentType}} with {{doctorName}} will begin soon.",
    "",
    "Date: {{appointmentDate}}",
    "Time: {{appointmentTime}}",
    "",
    "Please be ready to join from your patient portal:",
    "{{portalLink}}",
    "",
    "If you need help, contact us at {{contactEmail}}.",
    "",
    "— {{copyrightName}}",
    "{{footerTagline}}",
  ].join("\n"),
};

export const APPOINTMENT_REMINDER_PLACEHOLDERS = [
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

export function buildAppointmentReminderTemplateVars({
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

export function buildAppointmentReminderEmailFromTemplate(args) {
  return buildBrandedEmailFromTemplate({
    ...args,
    preheader: "Your appointment with your doctor is starting soon.",
    ctaLabel: "Open patient portal",
  });
}
