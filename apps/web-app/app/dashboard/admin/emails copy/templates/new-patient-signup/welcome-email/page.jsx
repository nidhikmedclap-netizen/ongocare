const PRIMARY = "#347e5d";
const BG = "#f6faf8";

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export const meta = {
  id: "welcome-email",
  title: "Welcome Email",
  category: "New Patient Signup",
};

export function buildWelcomeEmail({
  recipientName,
  branding,
  logoUrl,
}) {
  const orgName = branding.orgName;
  const contactEmail =
    branding.contactEmail || branding.supportEmail;

  const greeting = recipientName
    ? `Hi ${recipientName},`
    : "Hi there,";

  const subject = `Welcome to ${orgName}`;

  const text = [
    greeting,
    "",
    `Welcome to ${orgName}!`,
    "",
    "Thank you for creating your account.",
    "",
    "You can now access your patient portal and manage your healthcare journey.",
    "",
    `Questions? Contact us at ${contactEmail}`,
    "",
    `— ${branding.copyrightName}`,
    branding.footerTagline,
  ].join("\n");

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(subject)}</title>
</head>

<body
  style="
    margin:0;
    padding:0;
    background:${BG};
    font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
  "
>
  <table
    role="presentation"
    width="100%"
    cellspacing="0"
    cellpadding="0"
    style="background:${BG};padding:32px 16px;"
  >
    <tr>
      <td align="center">
        <table
          role="presentation"
          width="100%"
          cellspacing="0"
          cellpadding="0"
          style="
            max-width:560px;
            background:#ffffff;
            border-radius:16px;
            overflow:hidden;
            box-shadow:0 4px 24px rgba(52,126,93,0.08);
          "
        >
          <tr>
            <td
              style="
                padding:28px 32px;
                text-align:center;
                background:#fffbf5;
                border-bottom:1px solid #e5e0d8;
              "
            >
              <img
                src="${escapeHtml(logoUrl)}"
                alt="${escapeHtml(
                  branding.emailLogoAlt ||
                    branding.logoAlt
                )}"
                width="220"
                style="
                  display:block;
                  margin:0 auto;
                  max-width:220px;
                  height:auto;
                "
              />
            </td>
          </tr>

          <tr>
            <td style="padding:32px;">
              <h1
                style="
                  margin:0 0 20px;
                  font-size:28px;
                  color:${PRIMARY};
                "
              >
                Welcome!
              </h1>

              <p
                style="
                  margin:0 0 16px;
                  font-size:16px;
                  line-height:1.6;
                "
              >
                ${escapeHtml(greeting)}
              </p>

              <p
                style="
                  margin:0 0 20px;
                  font-size:15px;
                  line-height:1.6;
                  color:#3d5248;
                "
              >
                Thank you for signing up with
                <strong>${escapeHtml(orgName)}</strong>.
              </p>

              <p
                style="
                  margin:0 0 24px;
                  font-size:15px;
                  line-height:1.6;
                  color:#3d5248;
                "
              >
                Your account has been created successfully.
                You can now access your patient portal,
                view appointments, and manage your care.
              </p>

              <table
                role="presentation"
                cellspacing="0"
                cellpadding="0"
              >
                <tr>
                  <td
                    style="
                      border-radius:10px;
                      background:${PRIMARY};
                    "
                  >
                    <a
                      href="#"
                      style="
                        display:inline-block;
                        padding:14px 28px;
                        color:#ffffff;
                        text-decoration:none;
                        font-weight:600;
                      "
                    >
                      Access Portal
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td
              style="
                padding:20px 32px 28px;
                border-top:1px solid #e8f0ec;
                background:#fafcfb;
              "
            >
              <p
                style="
                  margin:0 0 6px;
                  font-size:12px;
                  color:#6b7f74;
                "
              >
                Questions?
                <a
                  href="mailto:${escapeHtml(
                    contactEmail
                  )}"
                  style="color:${PRIMARY};"
                >
                  ${escapeHtml(contactEmail)}
                </a>
              </p>

              <p
                style="
                  margin:0;
                  font-size:11px;
                  color:#9aada3;
                "
              >
                &copy;
                ${escapeHtml(
                  branding.copyrightName
                )}
                &middot;
                ${escapeHtml(
                  branding.footerTagline
                )}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  return {
    subject,
    text,
    html,
  };
}