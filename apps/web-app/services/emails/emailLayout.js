// services/emails/emailLayout.js
//
// Shared HTML email layout — emerald frame theme (design-only).

export const EMAIL_THEME = {
  page: "#145A42",
  pageGlow: "#1D7A5A",
  frame: "#3DAA7A",
  frameSoft: "#74C69D",
  card: "#FEFFFC",
  cardWarm: "#F3FAF6",
  ink: "#0C2E22",
  inkSoft: "#2F5445",
  inkMuted: "#4F7263",
  onGreen: "#FFFFFF",
  onGreenSoft: "#C8E6D5",
  highlight: "#D8F3DC",
  line: "#A8D5BA",
};

export function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderTopBar(orgLabel) {
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
      <tr>
        <td style="background:${EMAIL_THEME.page};padding:14px 24px;text-align:center;">
          <span style="font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:${EMAIL_THEME.onGreenSoft};">
            ${orgLabel}
          </span>
        </td>
      </tr>
    </table>`;
}

export function renderPrimaryButton(label, href) {
  if (!href) return "";
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" width="100%" style="margin:30px 0 8px;">
      <tr>
        <td align="center" style="border-radius:14px;background:${EMAIL_THEME.page};">
          <a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer"
             style="display:block;padding:17px 24px;font-size:15px;font-weight:700;letter-spacing:0.03em;color:${EMAIL_THEME.onGreen};text-decoration:none;border-radius:14px;text-align:center;">
            ${escapeHtml(label)} &rarr;
          </a>
        </td>
      </tr>
    </table>`;
}

function renderDetailCard(rows) {
  if (!rows.length) return "";
  const items = rows
    .map(
      ({ label, value }, index) => `
        <tr>
          <td colspan="2" style="padding:${index === 0 ? "0" : "14px"} 0 0 0;font-size:0;line-height:0;">&nbsp;</td>
        </tr>
        <tr>
          <td colspan="2" style="padding:14px 18px;background:${EMAIL_THEME.cardWarm};border-radius:12px;border:1px solid ${EMAIL_THEME.line};">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
              <tr>
                <td style="font-size:10px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:${EMAIL_THEME.frame};padding-bottom:4px;">
                  ${escapeHtml(label)}
                </td>
              </tr>
              <tr>
                <td style="font-size:17px;font-weight:700;color:${EMAIL_THEME.ink};line-height:1.4;">
                  ${escapeHtml(value)}
                </td>
              </tr>
            </table>
          </td>
        </tr>`,
    )
    .join("");
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:8px 0 24px;">
      ${items}
    </table>`;
}

function linkifyLine(line) {
  return escapeHtml(line).replace(
    /(https?:\/\/[^\s<]+)/g,
    `<a href="$1" style="color:${EMAIL_THEME.pageGlow};font-weight:600;text-decoration:underline;">$1</a>`,
  );
}

function isDetailLine(line) {
  return /^[A-Za-z][A-Za-z\s/&]+:\s*.+/.test(line.trim());
}

function parseDetailLine(line) {
  const idx = line.indexOf(":");
  if (idx <= 0) return null;
  return {
    label: line.slice(0, idx).trim(),
    value: line.slice(idx + 1).trim(),
  };
}

function renderGreeting(line) {
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 20px;">
      <tr>
        <td width="44" valign="top" style="padding-top:4px;">
          <table role="presentation" cellspacing="0" cellpadding="0">
            <tr>
              <td style="width:36px;height:36px;border-radius:18px;background:${EMAIL_THEME.highlight};text-align:center;font-size:18px;line-height:36px;color:${EMAIL_THEME.page};">
                &#10003;
              </td>
            </tr>
          </table>
        </td>
        <td valign="top">
          <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:28px;line-height:1.25;font-weight:700;color:${EMAIL_THEME.ink};">
            ${linkifyLine(line)}
          </p>
        </td>
      </tr>
    </table>`;
}

export function plainTextBlocksToHtml(text) {
  const blocks = String(text || "")
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  if (!blocks.length) return "";

  return blocks
    .map((block, blockIndex) => {
      const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
      const detailLines = lines.filter(isDetailLine);

      if (detailLines.length >= 2 && detailLines.length === lines.length) {
        return renderDetailCard(detailLines.map(parseDetailLine).filter(Boolean));
      }

      if (blockIndex === 0 && /^hi\b/i.test(lines[0] || "")) {
        const rest =
          lines.length > 1
            ? `<p style="margin:0 0 16px;font-size:16px;line-height:1.75;color:${EMAIL_THEME.inkMuted};">${lines
                .slice(1)
                .map(linkifyLine)
                .join("<br />")}</p>`
            : "";
        return `${renderGreeting(lines[0])}${rest}`;
      }

      const body = lines.map(linkifyLine).join("<br />");
      return `<p style="margin:0 0 16px;font-size:16px;line-height:1.75;color:${EMAIL_THEME.inkMuted};">${body}</p>`;
    })
    .join("");
}

export function wrapBrandedEmailDocument({
  subject,
  preheader = "",
  innerHtml,
  branding,
  logoUrl,
  portalLink,
  ctaLabel = "Access Portal",
}) {
  const contactEmail = branding.contactEmail || branding.supportEmail;
  const showPortalCta =
    portalLink && !String(innerHtml || "").includes(escapeHtml(portalLink));
  const portalButton = showPortalCta ? renderPrimaryButton(ctaLabel, portalLink) : "";
  const orgLabel = escapeHtml(branding.shortName || branding.orgName);

  const hiddenPreheader = preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all;">${escapeHtml(preheader)}</div>`
    : "";

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:${EMAIL_THEME.page};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:${EMAIL_THEME.ink};-webkit-font-smoothing:antialiased;">
  ${hiddenPreheader}
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${EMAIL_THEME.page};padding:0;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;">
          ${renderTopBar(orgLabel)}
          <tr>
            <td style="padding:28px 20px 36px;background:${EMAIL_THEME.pageGlow};">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0"
                     style="background:${EMAIL_THEME.card};border-radius:20px;overflow:hidden;border:3px solid ${EMAIL_THEME.frame};box-shadow:0 20px 50px rgba(0,0,0,0.18);">
                <tr>
                  <td style="height:6px;background:linear-gradient(90deg,${EMAIL_THEME.page} 0%,${EMAIL_THEME.frame} 50%,${EMAIL_THEME.frameSoft} 100%);font-size:0;line-height:0;">&nbsp;</td>
                </tr>
                <tr>
                  <td style="padding:32px 34px 12px;text-align:center;background:${EMAIL_THEME.card};">
                    <img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(
                      branding.emailLogoAlt || branding.logoAlt,
                    )}" width="190" style="display:block;margin:0 auto;max-width:190px;height:auto;" />
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 34px 34px;background:${EMAIL_THEME.card};">
                    ${innerHtml}
                    ${portalButton}
                  </td>
                </tr>
                <tr>
                  <td style="padding:22px 34px;background:${EMAIL_THEME.page};">
                    <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:${EMAIL_THEME.onGreen};">
                      Need help? <a href="mailto:${escapeHtml(contactEmail)}" style="color:${EMAIL_THEME.frameSoft};font-weight:700;text-decoration:none;">${escapeHtml(contactEmail)}</a>
                    </p>
                    <p style="margin:0;font-size:12px;line-height:1.55;color:${EMAIL_THEME.onGreenSoft};">
                      &copy; ${escapeHtml(branding.copyrightName)} &middot; ${escapeHtml(branding.footerTagline)}
                    </p>
                  </td>
                </tr>
              </table>
              <p style="margin:18px 8px 0;text-align:center;font-size:11px;line-height:1.6;color:${EMAIL_THEME.onGreenSoft};">
                This email was sent to you by ${orgLabel}.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Action emails: password reset, email verification, etc. */
export function buildActionEmail({
  subject,
  preheader,
  greeting,
  paragraphs = [],
  buttonLabel,
  buttonHref,
  footnote,
  branding,
  logoUrl,
}) {
  const intro = paragraphs
    .map(
      (p) =>
        `<p style="margin:0 0 16px;font-size:16px;line-height:1.75;color:${EMAIL_THEME.inkMuted};">${escapeHtml(p)}</p>`,
    )
    .join("");

  const innerHtml = `
    ${renderGreeting(greeting)}
    ${intro}
    ${renderPrimaryButton(buttonLabel, buttonHref)}
    ${
      footnote
        ? `<p style="margin:22px 0 0;padding:14px 16px;font-size:13px;line-height:1.65;color:${EMAIL_THEME.inkSoft};background:${EMAIL_THEME.cardWarm};border-radius:12px;border-left:4px solid ${EMAIL_THEME.frame};">${escapeHtml(footnote)}</p>`
        : ""
    }`;

  const text = [
    greeting,
    "",
    ...paragraphs,
    "",
    buttonHref ? `${buttonLabel}: ${buttonHref}` : "",
    "",
    footnote || "",
    "",
    `— ${branding.copyrightName}`,
    branding.footerTagline,
  ]
    .filter((line, i, arr) => line !== "" || (i > 0 && arr[i - 1] !== ""))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");

  const html = wrapBrandedEmailDocument({
    subject,
    preheader: preheader || subject,
    innerHtml,
    branding,
    logoUrl,
    portalLink: null,
  });

  return { subject, text, html };
}
