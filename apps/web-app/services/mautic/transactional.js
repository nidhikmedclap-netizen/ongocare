// services/mautic/transactional.js
//
// STUB — Mautic transactional email integration is deferred.
//
// Until real Mautic credentials and a template are wired up, this just logs
// the password-reset link to the server console so we can manually test the
// flow end-to-end. When Mautic is ready, replace the body of
// `sendSetPasswordEmail` with the real API call — the call site in
// app/api/onboarding/capture-email/route.js stays the same.
//
// IMPORTANT: this MUST remain server-only. The reset link is essentially a
// signed credential — never log it to the browser or include it in any
// response that ships to a non-trusted client.

if (typeof window !== "undefined") {
  throw new Error(
    "[mautic/transactional] Imported from a browser context. Server-only.",
  );
}

/**
 * Send the "welcome — set your password" email.
 *
 * @param {string} email           recipient
 * @param {string} setPasswordLink one-time Firebase password-reset URL
 * @param {object} context         optional extras (firstName, etc.) for templates
 * @returns {Promise<{ delivered: boolean, channel: string }>}
 */
export async function sendSetPasswordEmail(email, setPasswordLink, context = {}) {
  // ── REPLACE THIS BLOCK WITH A REAL MAUTIC API CALL ────────────────────────
  // Example shape when Mautic is wired:
  //
  //   const res = await fetch(`${MAUTIC_BASE}/api/emails/${TEMPLATE_ID}/contact/${contactId}/send`, {
  //     method: "POST",
  //     headers: { Authorization: `Basic ${btoa(`${user}:${pass}`)}` },
  //   });
  //   return { delivered: res.ok, channel: "mautic" };
  //
  // For now: log it and return success so the rest of the flow proceeds.
  // eslint-disable-next-line no-console
  console.log(
    "\n========== [MAUTIC STUB] set-password email ==========\n" +
      `  To:    ${email}\n` +
      `  Link:  ${setPasswordLink}\n` +
      (Object.keys(context).length
        ? `  Ctx:   ${JSON.stringify(context)}\n`
        : "") +
      "  (Replace the stub in services/mautic/transactional.js with real Mautic call.)\n" +
      "======================================================\n",
  );

  return { delivered: true, channel: "stub" };
}
