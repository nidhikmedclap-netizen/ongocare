// services/emails/templateStore.js
//
// Persist transactional email templates edited from the admin dashboard.

import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import {
  WELCOME_EMAIL_DEFAULTS,
  templateMeta as welcomeMeta,
} from "@/services/emails/templates/new-patient-signup/welcome-email";
import {
  ONBOARDING_PROCESS_DEFAULTS,
  templateMeta as onboardingProcessMeta,
} from "@/services/emails/templates/new-patient-signup/onboarding-process";
import {
  PAYMENT_SUCCESS_DEFAULTS,
  templateMeta as paymentMeta,
} from "@/services/emails/templates/patient-billing/payment-successful";
import {
  APPOINTMENT_BOOKED_DEFAULTS,
  templateMeta as appointmentMeta,
} from "@/services/emails/templates/patient-appointments/appointment-booked";
import {
  APPOINTMENT_REMINDER_DEFAULTS,
  templateMeta as appointmentReminderMeta,
} from "@/services/emails/templates/patient-appointments/appointment-reminder";

if (typeof window !== "undefined") {
  throw new Error("[email/templateStore] Server-only.");
}

const COLLECTION = "emailTemplates";

const CODE_DEFAULTS = {
  "new-patient-signup/welcome-email": WELCOME_EMAIL_DEFAULTS,
  "new-patient-signup/onboarding-process": ONBOARDING_PROCESS_DEFAULTS,
  "patient-billing/payment-successful": PAYMENT_SUCCESS_DEFAULTS,
  "patient-appointments/appointment-booked": APPOINTMENT_BOOKED_DEFAULTS,
  "patient-appointments/appointment-reminder": APPOINTMENT_REMINDER_DEFAULTS,
};

const CODE_META = {
  "new-patient-signup/welcome-email": welcomeMeta,
  "new-patient-signup/onboarding-process": onboardingProcessMeta,
  "patient-billing/payment-successful": paymentMeta,
  "patient-appointments/appointment-booked": appointmentMeta,
  "patient-appointments/appointment-reminder": appointmentReminderMeta,
};

function templateKey(category, templateId) {
  const cat = String(category || "").trim();
  const id = String(templateId || "").trim();
  if (!cat || !id) return "";
  return `${cat}/${id}`;
}

function templateDocId(category, templateId) {
  return templateKey(category, templateId).replace(/\//g, "__");
}

export function getCodeDefaults(category, templateId) {
  return CODE_DEFAULTS[templateKey(category, templateId)] || null;
}

export function getTemplateMeta(category, templateId) {
  return CODE_META[templateKey(category, templateId)] || {
    id: templateId,
    category,
    title: templateId,
  };
}

/**
 * @returns {Promise<{ category, templateId, subject, body, source: "firestore"|"code", updatedAt?, updatedBy? }>}
 */
export async function getEmailTemplate(category, templateId) {
  const key = templateKey(category, templateId);
  if (!key) return null;

  const defaults = getCodeDefaults(category, templateId);
  const snap = await adminDb
    .collection(COLLECTION)
    .doc(templateDocId(category, templateId))
    .get();

  if (!snap.exists) {
    if (!defaults) return null;
    return {
      category,
      templateId,
      subject: defaults.subject,
      body: defaults.body,
      source: "code",
    };
  }

  const data = snap.data() || {};
  return {
    category,
    templateId,
    subject: String(data.subject || defaults?.subject || "").trim(),
    body: String(data.body || defaults?.body || "").trim(),
    source: "firestore",
    updatedAt: data.updatedAt || null,
    updatedBy: data.updatedBy || null,
  };
}

/**
 * @returns {Promise<{ category, templateId, subject, body }>}
 */
export async function saveEmailTemplate({
  category,
  templateId,
  subject,
  body,
  updatedBy,
}) {
  const key = templateKey(category, templateId);
  if (!key) {
    throw new Error("Invalid template path.");
  }

  const cleanSubject = String(subject || "").trim();
  const cleanBody = String(body || "").trim();
  if (!cleanSubject) throw new Error("Subject is required.");
  if (!cleanBody) throw new Error("Email body is required.");

  const ref = adminDb.collection(COLLECTION).doc(templateDocId(category, templateId));
  await ref.set(
    {
      category,
      templateId,
      templateKey: key,
      subject: cleanSubject.slice(0, 500),
      body: cleanBody.slice(0, 50_000),
      updatedBy: String(updatedBy || "").slice(0, 128),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  return { category, templateId, subject: cleanSubject, body: cleanBody };
}
