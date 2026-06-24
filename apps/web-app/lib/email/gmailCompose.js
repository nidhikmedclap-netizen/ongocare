// lib/email/gmailCompose.js
//
// Opens Gmail compose in the browser instead of the OS default mail client
// (e.g. Outlook on Windows when mailto: is used).

export function formatGmailComposeHref(email) {
  const trimmed = String(email || "").trim();
  if (!trimmed || !trimmed.includes("@")) return "";
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(trimmed)}`;
}
