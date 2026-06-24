// services/emails/brandedEmail.js
//
// Shared branded transactional email rendering (HTML shell + placeholders).

import {
  EMAIL_THEME,
  escapeHtml,
  plainTextBlocksToHtml,
  wrapBrandedEmailDocument,
} from "@/services/emails/emailLayout";

export { escapeHtml };

export function applyTemplatePlaceholders(template, vars = {}) {
  return String(template || "").replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = vars[key];
    return value !== undefined && value !== null ? String(value) : match;
  });
}

export function buildBrandedEmailFromTemplate({
  subjectTemplate,
  bodyTemplate,
  branding,
  logoUrl,
  portalLink,
  vars,
  preheader,
  ctaLabel,
}) {
  const subject = applyTemplatePlaceholders(subjectTemplate, vars);
  const text = applyTemplatePlaceholders(bodyTemplate, vars);
  const innerHtml = plainTextBlocksToHtml(text);
  const html = wrapBrandedEmailDocument({
    subject,
    preheader: preheader || subject,
    innerHtml,
    branding,
    logoUrl,
    portalLink,
    ctaLabel: ctaLabel || "Access Portal",
  });
  return { subject, text, html };
}

function capitalizeNamePart(part) {
  const cleaned = String(part || "")
    .replace(/\d+/g, "")
    .trim();
  if (!cleaned) return "";
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
}

/** Split email local part on `.` `_` `-` `+` for first/last name. */
export function deriveNameFromEmail(email) {
  const normalized = String(email || "").trim().toLowerCase();
  const local = normalized.split("@")[0] || "";
  const parts = local
    .split(/[._+-]+/)
    .map(capitalizeNamePart)
    .filter(Boolean);

  if (parts.length >= 2) {
    return {
      firstName: parts[0],
      lastName: parts.slice(1).join(" "),
    };
  }
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "" };
  }
  return { firstName: "", lastName: "" };
}

export function buildPatientNameVars(profile = {}, fallbackEmail = "") {
  const onb =
    profile.onboarding && typeof profile.onboarding === "object"
      ? profile.onboarding
      : {};
  let firstNameRaw = profile.firstName || onb.firstName || "";
  let lastNameRaw = profile.lastName || onb.lastName || "";
  const email = String(profile.email || fallbackEmail || "")
    .trim()
    .toLowerCase();

  if (!firstNameRaw && email) {
    const derived = deriveNameFromEmail(email);
    firstNameRaw = derived.firstName;
    if (!lastNameRaw) lastNameRaw = derived.lastName;
  }

  const recipientName =
    profile.displayName ||
    [firstNameRaw, lastNameRaw].filter(Boolean).join(" ").trim() ||
    "";
  const firstName =
    firstNameRaw ||
    recipientName.split(/\s+/)[0] ||
    "";

  return {
    firstName: firstName || "there",
    lastName: lastNameRaw || "",
    recipientName,
    email,
  };
}

export function buildBrandingVars(branding, portalLink) {
  return {
    orgName: branding.orgName,
    shortName: branding.shortName,
    portalLink: portalLink || "",
    contactEmail: branding.contactEmail || branding.supportEmail,
    copyrightName: branding.copyrightName,
    footerTagline: branding.footerTagline,
  };
}

/** @deprecated internal — kept for tests referencing theme */
export const PRIMARY = EMAIL_THEME.primary;
