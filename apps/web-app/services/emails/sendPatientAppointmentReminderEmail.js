// services/emails/sendPatientAppointmentReminderEmail.js

import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { resolveOrgEmailBranding } from "@/lib/branding/orgBranding";
import { DEFAULT_ORG_SLUG } from "@/lib/orgs";
import { formatAppointmentEmailWhen } from "@/services/emails/formatAppointmentEmailWhen";
import { normalizeOrgSlug } from "@/services/firebase/users";
import { resolveEmailAssetUrl, resolvePatientPortalLink } from "@/services/emails/emailAssets";
import {
  buildAppointmentReminderEmailFromTemplate,
  buildAppointmentReminderTemplateVars,
} from "@/services/emails/templates/patient-appointments/appointment-reminder";
import { getEmailTemplate } from "@/services/emails/templateStore";
import { sendTransactionalEmail } from "@/services/emails/sendTransactionalEmail";

if (typeof window !== "undefined") {
  throw new Error("[email/sendPatientAppointmentReminderEmail] Server-only.");
}

const TEMPLATE_CATEGORY = "patient-appointments";
const TEMPLATE_ID = "appointment-reminder";

/**
 * @param {object} params
 * @param {string} params.uid — patient uid
 * @param {object} params.appointment — appointments doc fields (must include id)
 */
export async function sendPatientAppointmentReminderEmail({ uid, appointment }) {
  if (!uid || !appointment?.id) {
    return { ok: false, skipped: true, reason: "missing-appointment" };
  }

  if (appointment.status && appointment.status !== "scheduled") {
    return { ok: false, skipped: true, reason: "not-scheduled" };
  }

  const apptRef = adminDb.collection("appointments").doc(appointment.id);
  const apptSnap = await apptRef.get();
  const storedAppt = apptSnap.exists ? apptSnap.data() || {} : appointment;

  if (storedAppt.status && storedAppt.status !== "scheduled") {
    return { ok: false, skipped: true, reason: "not-scheduled" };
  }

  if (storedAppt.appointmentReminderEmailSentAt) {
    return { ok: false, skipped: true, reason: "already-sent" };
  }

  const ref = adminDb.collection("users").doc(uid);
  const snap = await ref.get();
  const profile = snap.exists ? snap.data() || {} : {};

  const toEmail = String(
    appointment.patientEmail || storedAppt.patientEmail || profile.email || "",
  )
    .trim()
    .toLowerCase();
  if (!toEmail || !toEmail.includes("@")) {
    return { ok: false, skipped: true, reason: "missing-email" };
  }

  const mergedAppt = { ...storedAppt, ...appointment, id: appointment.id };
  const brandingOrgSlug = normalizeOrgSlug(
    mergedAppt.orgSlug || profile.orgSlug || DEFAULT_ORG_SLUG,
  );
  const branding = await resolveOrgEmailBranding(brandingOrgSlug);
  const logoUrl = resolveEmailAssetUrl(branding.emailLogoSrc);
  const portalLink = resolvePatientPortalLink(brandingOrgSlug);

  const stored = await getEmailTemplate(TEMPLATE_CATEGORY, TEMPLATE_ID);
  if (!stored) {
    return { ok: false, skipped: true, reason: "template-not-found" };
  }

  const { appointmentDate, appointmentTime } = formatAppointmentEmailWhen(
    mergedAppt,
    profile,
  );
  const mergedProfile = {
    ...profile,
    email: toEmail,
    displayName: mergedAppt.patientName || profile.displayName,
  };

  const vars = buildAppointmentReminderTemplateVars({
    profile: mergedProfile,
    branding,
    portalLink,
    fallbackEmail: toEmail,
    doctorName: mergedAppt.doctorName,
    appointmentType: mergedAppt.type,
    appointmentDate,
    appointmentTime,
  });

  const { subject, text, html } = buildAppointmentReminderEmailFromTemplate({
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
    category: "patient_appointment_reminder",
    meta: {
      uid,
      appointmentId: appointment.id,
      orgSlug: brandingOrgSlug,
      template: `${TEMPLATE_CATEGORY}/${TEMPLATE_ID}`,
      templateSource: stored.source,
      trigger: "cron",
    },
  });

  if (!delivery.ok) {
    if (delivery.reason === "smtp-not-configured") {
      // eslint-disable-next-line no-console
      console.warn(
        "[appointment-reminder-email] SMTP not configured — email not sent.",
        { uid, appointmentId: appointment.id },
      );
    }
    return { ok: false, skipped: false, reason: delivery.reason || "send-failed" };
  }

  await apptRef.set(
    {
      appointmentReminderEmailSentAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  return { ok: true, skipped: false };
}
