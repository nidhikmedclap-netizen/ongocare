// services/email/smtp.js
//
// SMTP transport config for transactional emails (server-only).

if (typeof window !== "undefined") {
  throw new Error("[email/smtp] Imported from a browser context. Server-only.");
}

function parseSmtpPort(value) {
  const raw = String(value || "").trim();
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return 587;
  return parsed > 0 ? parsed : 587;
}

export function getSmtpConfig() {
  const host = (process.env.SMTP_HOST || "").trim();
  const user = (process.env.SMTP_USER || "").trim();
  const pass = (
    process.env.SMTP_PASS ||
    process.env.RESEND_API_KEY ||
    ""
  ).trim();
  const from =
    (process.env.SMTP_FROM || "").trim() || user || "no-reply@ongocare.app";
  const port = parseSmtpPort(process.env.SMTP_PORT);
  const ready = Boolean(host && user && pass && from);
  return { host, user, pass, from, port, ready };
}
