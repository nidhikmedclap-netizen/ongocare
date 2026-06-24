// services/emails/sendPatientAppointmentEmail.js

import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { resolveOrgEmailBranding } from "@/lib/branding/orgBranding";
import { DEFAULT_ORG_SLUG } from "@/lib/orgs";
import { formatDoctorAppointmentWhen } from "@/lib/time/timezone";
import { normalizeOrgSlug } from "@/services/firebase/users";
import { resolveEmailAssetUrl, resolvePatientPortalLink } from "@/services/emails/emailAssets";
import {
  buildAppointmentBookedEmailFromTemplate,
  buildAppointmentBookedTemplateVars,
} from "@/services/emails/templates/patient-appointments/appointment-booked";
import { hasPlanCheckout, mergePaymentIntoOnboarding } from "@/lib/billing/patientPayment";
import { getPlanPaymentForPatient } from "@/services/firebase/planPayments";
import { sendPatientPaymentSuccessEmail } from "@/services/emails/sendPatientPaymentSuccessEmail";
import { getEmailTemplate } from "@/services/emails/templateStore";
import { sendTransactionalEmail } from "@/services/emails/sendTransactionalEmail";

if (typeof window !== "undefined") {
  throw new Error("[email/sendPatientAppointmentEmail] Server-only.");
}

const TEMPLATE_CATEGORY = "patient-appointments";
const TEMPLATE_ID = "appointment-booked";

/** Appointment confirmation sends only after the payment-success email. */
async function ensurePaymentSuccessEmailSent(uid, profile) {
  const merged = mergePaymentIntoOnboarding(profile);
  if (!hasPlanCheckout(merged)) return true;

  const paymentIntentId = String(
    merged.paymentIntentId || profile.planPaymentId || "",
  ).trim();
  if (!paymentIntentId) return false;

  if (profile.paymentSuccessEmailIntentId === paymentIntentId) {
    return true;
  }

  const paymentRow = await getPlanPaymentForPatient(uid);
  if (!paymentRow) return false;

  const paymentEmail = await sendPatientPaymentSuccessEmail({
    uid,
    paymentRow,
  });
  return paymentEmail.ok || paymentEmail.reason === "already-sent";
}

function formatAppointmentLabels(appointment) {
  const when = formatDoctorAppointmentWhen(appointment);
  if (!when) {
    return {
      appointmentDate: appointment?.date || "—",
      appointmentTime: appointment?.time || "—",
    };
  }
  return {
    appointmentDate: when.dayLabel || appointment?.date || "—",
    appointmentTime: `${when.timeLabel || appointment?.time || ""} ${when.abbr || ""}`.trim(),
  };
}

/**
 * @param {object} params
 * @param {string} params.uid — patient uid
 * @param {object} params.appointment — appointments doc fields
 */
export async function sendPatientAppointmentEmail({ uid, appointment }) {
  if (!uid || !appointment?.id) {
    return { ok: false, skipped: true, reason: "missing-appointment" };
  }

  const ref = adminDb.collection("users").doc(uid);
  const snap = await ref.get();
  const profile = snap.exists ? snap.data() || {} : {};

  if (!(await ensurePaymentSuccessEmailSent(uid, profile))) {
    return { ok: false, skipped: true, reason: "payment-email-first" };
  }

  const toEmail = String(
    appointment.patientEmail || profile.email || "",
  )
    .trim()
    .toLowerCase();
  if (!toEmail || !toEmail.includes("@")) {
    return { ok: false, skipped: true, reason: "missing-email" };
  }

  const apptRef = adminDb.collection("appointments").doc(appointment.id);
  const apptSnap = await apptRef.get();
  if (apptSnap.exists && apptSnap.data()?.appointmentEmailSentAt) {
    return { ok: false, skipped: true, reason: "already-sent" };
  }

  const brandingOrgSlug = normalizeOrgSlug(
    appointment.orgSlug || profile.orgSlug || DEFAULT_ORG_SLUG,
  );
  const branding = await resolveOrgEmailBranding(brandingOrgSlug);
  const logoUrl = resolveEmailAssetUrl(branding.emailLogoSrc);
  const portalLink = resolvePatientPortalLink(brandingOrgSlug);

  const stored = await getEmailTemplate(TEMPLATE_CATEGORY, TEMPLATE_ID);
  if (!stored) {
    return { ok: false, skipped: true, reason: "template-not-found" };
  }

  const { appointmentDate, appointmentTime } = formatAppointmentLabels(appointment);
  const mergedProfile = {
    ...profile,
    firstName: profile.firstName,
    lastName: profile.lastName,
    email: toEmail,
    displayName: appointment.patientName || profile.displayName,
  };

  const vars = buildAppointmentBookedTemplateVars({
    profile: mergedProfile,
    branding,
    portalLink,
    fallbackEmail: toEmail,
    doctorName: appointment.doctorName,
    appointmentType: appointment.type,
    appointmentDate,
    appointmentTime,
  });

  const { subject, text, html } = buildAppointmentBookedEmailFromTemplate({
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
    category: "patient_appointment_booked",
    meta: {
      uid,
      appointmentId: appointment.id,
      orgSlug: brandingOrgSlug,
      template: `${TEMPLATE_CATEGORY}/${TEMPLATE_ID}`,
      templateSource: stored.source,
    },
  });

  if (!delivery.ok) {
    if (delivery.reason === "smtp-not-configured") {
      // eslint-disable-next-line no-console
      console.warn(
        "[appointment-email] SMTP not configured — email not sent.",
        { uid, appointmentId: appointment.id },
      );
    }
    return { ok: false, skipped: false, reason: delivery.reason || "send-failed" };
  }

  await apptRef.set(
    {
      appointmentEmailSentAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  return { ok: true, skipped: false };
}
