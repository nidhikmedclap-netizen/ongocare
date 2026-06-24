// services/email/sendTransactionalEmail.js
//
// Send branded transactional emails via SMTP (server-only).

import nodemailer from "nodemailer";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { getSmtpConfig } from "@/services/emails/smtp";

if (typeof window !== "undefined") {
  throw new Error(
    "[email/sendTransactionalEmail] Imported from a browser context. Server-only.",
  );
}

/**
 * @param {object} params
 * @param {string} params.toEmail
 * @param {string} params.subject
 * @param {string} params.text
 * @param {string} [params.html]
 * @param {string} params.category
 * @param {object} [params.meta]
 */
export async function sendTransactionalEmail({
  toEmail,
  subject,
  text,
  html,
  category,
  meta = {},
}) {
  const to = String(toEmail || "").trim().toLowerCase();
  if (!to) {
    return { ok: false, queued: false, reason: "missing-to-email" };
  }

  const cfg = getSmtpConfig();
  const logRef = adminDb.collection("notificationEmailLogs").doc();
  const baseLog = {
    category: String(category || "general"),
    toEmail: to,
    subject: String(subject || ""),
    meta,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (!cfg.ready) {
    await logRef.set({
      ...baseLog,
      status: "queued",
      deliveryMessage:
        "SMTP not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS, and SMTP_FROM.",
    });
    return { ok: false, queued: true, reason: "smtp-not-configured" };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.port === 465,
      auth: { user: cfg.user, pass: cfg.pass },
    });

    const info = await transporter.sendMail({
      from: cfg.from,
      to,
      subject,
      text,
      html,
    });

    await logRef.set({
      ...baseLog,
      status: "sent",
      providerResponse: String(info?.response || info?.messageId || ""),
      deliveryMessage: "Delivered via SMTP transport.",
    });
    return { ok: true, queued: false };
  } catch (error) {
    await logRef.set({
      ...baseLog,
      status: "failed",
      deliveryMessage: String(error?.message || "unknown-send-error"),
    });
    return { ok: false, queued: false, reason: "send-failed" };
  }
}
