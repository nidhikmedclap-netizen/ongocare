// services/auth/forgotPassword.js
//
// Server-side forgot-password flow: role + portal checks, Firebase reset
// link generation, and branded email delivery.

import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { resolveOrgEmailBranding } from "@/lib/branding/orgBranding";
import { portalsMatch } from "@/lib/auth/adminPortalPaths";
import { doctorBelongsToPortal } from "@/lib/orgs/doctorPortals";
import { DEFAULT_ORG_SLUG } from "@/lib/orgs";
import { normalizeOrgSlug } from "@/services/firebase/users";
import {
  getDashboardOrigin,
  getMarketingOrigin,
  hostFromOrigin,
  marketingUrl,
} from "@/lib/urls/siteOrigins";
import { buildPasswordResetEmail } from "@/services/emails/passwordResetTemplate";
import { sendTransactionalEmail } from "@/services/emails/sendTransactionalEmail";
import {
  DOCTOR_EMAIL_PASSWORD_ONLY_CODE,
  DOCTOR_EMAIL_PASSWORD_ONLY_MESSAGE,
  GOOGLE_SIGN_IN_ONLY_CODE,
  GOOGLE_SIGN_IN_ONLY_MESSAGE,
  isGoogleOnlyAuthUser,
} from "@/lib/auth/authProviders";

export {
  DOCTOR_EMAIL_PASSWORD_ONLY_CODE,
  DOCTOR_EMAIL_PASSWORD_ONLY_MESSAGE,
  GOOGLE_SIGN_IN_ONLY_CODE,
  GOOGLE_SIGN_IN_ONLY_MESSAGE,
  isGoogleOnlyAuthUser,
} from "@/lib/auth/authProviders";

const ALLOWED_RESET_ROLES = new Set(["patient", "doctor"]);
const GENERIC_SUCCESS =
  "If an account exists for that email, we sent password reset instructions.";

function isLocalOrigin(origin) {
  if (!origin) return true;
  try {
    const host = new URL(origin).hostname.toLowerCase();
    return host === "localhost" || host === "127.0.0.1" || host === "[::1]";
  } catch {
    return true;
  }
}

/** Absolute URL for email images — must be reachable from mail clients (not localhost). */
function resolveEmailAssetUrl(assetPath, requestOrigin) {
  const pathname = assetPath.startsWith("/") ? assetPath : `/${assetPath}`;
  // Prefer the site the user is on (preview/staging/prod) so assets exist on that deploy.
  if (requestOrigin && !isLocalOrigin(requestOrigin)) {
    return `${requestOrigin.replace(/\/$/, "")}${pathname}`;
  }
  const marketing = getMarketingOrigin();
  if (marketing && !isLocalOrigin(marketing)) {
    return `${marketing}${pathname}`;
  }
  // Dev: mail clients cannot fetch localhost — use public marketing host.
  const publicMarketing = stripTrailingSlash(
    process.env.EMAIL_ASSET_ORIGIN || "https://web.ongoweightloss.com",
  );
  if (publicMarketing && !isLocalOrigin(publicMarketing)) {
    return `${publicMarketing}${pathname}`;
  }
  return marketingUrl(assetPath);
}

function stripTrailingSlash(origin) {
  return (origin || "").replace(/\/$/, "");
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function getTrustedContinueHosts() {
  const hosts = new Set();
  for (const origin of [getMarketingOrigin(), getDashboardOrigin()]) {
    const host = hostFromOrigin(origin);
    if (host) hosts.add(host);
  }
  for (const entry of (process.env.PASSWORD_RESET_CONTINUE_HOSTS || "").split(",")) {
    const host = entry.trim().toLowerCase();
    if (host) hosts.add(host);
  }
  return hosts;
}

function isTrustedContinueUrl(url) {
  try {
    const host = new URL(url).host.toLowerCase();
    return getTrustedContinueHosts().has(host);
  } catch {
    return false;
  }
}

function resolveAbsoluteReturnUrl(resetReturnUrl, requestOrigin) {
  if (!resetReturnUrl) return null;
  const raw = String(resetReturnUrl).trim();
  let absolute;
  if (/^https?:\/\//i.test(raw)) {
    absolute = raw;
  } else {
    const path = raw.startsWith("/") ? raw : `/${raw}`;
    // Prefer production marketing origin; only use request origin when trusted.
    const marketing = getMarketingOrigin();
    if (marketing) {
      absolute = `${marketing}${path}`;
    } else if (requestOrigin) {
      absolute = `${requestOrigin.replace(/\/$/, "")}${path}`;
    }
  }
  if (!absolute || !isTrustedContinueUrl(absolute)) return null;
  return absolute;
}

function firebaseAdminReady() {
  return Boolean(
    process.env.FIREBASE_ADMIN_PROJECT_ID &&
      process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
      process.env.FIREBASE_ADMIN_PRIVATE_KEY,
  );
}

function portalAllowedForUser(profile, loginOrgSlug) {
  if (!loginOrgSlug) return true;
  const role = profile?.role;
  if (role === "doctor") {
    return doctorBelongsToPortal(profile, loginOrgSlug);
  }
  return portalsMatch(profile?.orgSlug, loginOrgSlug);
}

/**
 * Firebase rejects continue URLs whose domain is not listed under
 * Authentication → Settings → Authorized domains. Retry without a
 * continue URL so reset still works (user lands on Firebase's default page).
 */
async function generateResetLink(email, continueUrl) {
  if (continueUrl) {
    try {
      return await adminAuth.generatePasswordResetLink(email, {
        url: continueUrl,
        handleCodeInApp: false,
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn(
        "[forgot-password] continue URL failed:",
        error?.code || error?.message,
        continueUrl,
      );
    }
  }
  return adminAuth.generatePasswordResetLink(email);
}

async function findUserProfileByEmail(email) {
  const snap = await adminDb
    .collection("users")
    .where("email", "==", email)
    .limit(1)
    .get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { uid: doc.id, data: doc.data() };
}

/**
 * Process a forgot-password request for patient or doctor accounts only.
 * Always returns a generic success message when the request is well-formed,
 * even when no email is sent (prevents account enumeration).
 */
export async function processForgotPassword({
  email,
  role,
  orgSlug = null,
  resetReturnUrl = null,
  requestOrigin = null,
}) {
  if (!firebaseAdminReady()) {
    // eslint-disable-next-line no-console
    console.error(
      "[forgot-password] Firebase Admin env vars missing on server.",
    );
    return {
      ok: false,
      message:
        "Password reset is temporarily unavailable (server configuration). Contact support.",
    };
  }

  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || !normalizedEmail.includes("@")) {
    return { ok: false, message: "Enter a valid email address." };
  }
  if (!ALLOWED_RESET_ROLES.has(role)) {
    return { ok: false, message: "Password reset is not available for this account type." };
  }

  const loginOrgSlug = orgSlug ? normalizeOrgSlug(orgSlug) : null;

  let authUser = null;
  try {
    authUser = await adminAuth.getUserByEmail(normalizedEmail);
  } catch {
    return { ok: true, message: GENERIC_SUCCESS };
  }

  const profileHit = await findUserProfileByEmail(normalizedEmail);
  const profile = profileHit?.data;
  if (!profile || profileHit.uid !== authUser.uid) {
    return { ok: true, message: GENERIC_SUCCESS };
  }

  if (profile.role !== role) {
    return { ok: true, message: GENERIC_SUCCESS };
  }

  if (!portalAllowedForUser(profile, loginOrgSlug)) {
    return { ok: true, message: GENERIC_SUCCESS };
  }

  if (isGoogleOnlyAuthUser(authUser)) {
    if (role === "doctor") {
      return {
        ok: false,
        code: DOCTOR_EMAIL_PASSWORD_ONLY_CODE,
        message: DOCTOR_EMAIL_PASSWORD_ONLY_MESSAGE,
      };
    }
    return {
      ok: false,
      code: GOOGLE_SIGN_IN_ONLY_CODE,
      message: GOOGLE_SIGN_IN_ONLY_MESSAGE,
    };
  }

  const brandingOrgSlug = loginOrgSlug || profile.orgSlug || DEFAULT_ORG_SLUG;
  const branding = await resolveOrgEmailBranding(brandingOrgSlug);
  const logoUrl = resolveEmailAssetUrl(branding.emailLogoSrc, requestOrigin);

  const continueUrl = resolveAbsoluteReturnUrl(resetReturnUrl, requestOrigin);
  let resetLink;
  try {
    resetLink = await generateResetLink(normalizedEmail, continueUrl);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(
      "[forgot-password] generatePasswordResetLink failed:",
      error?.code,
      error?.message,
    );
    return {
      ok: false,
      message: "Could not generate a reset link. Try again in a few minutes.",
    };
  }

  const recipientName =
    profile.displayName ||
    [profile.firstName, profile.lastName].filter(Boolean).join(" ").trim() ||
    "";

  const { subject, text, html } = buildPasswordResetEmail({
    resetLink,
    recipientName,
    role,
    branding,
    logoUrl,
  });

  const delivery = await sendTransactionalEmail({
    toEmail: normalizedEmail,
    subject,
    text,
    html,
    category: "password_reset",
    meta: {
      uid: authUser.uid,
      role,
      orgSlug: brandingOrgSlug,
    },
  });

  if (!delivery.ok) {
    if (delivery.reason === "smtp-not-configured") {
      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.warn(
          "[forgot-password] SMTP not configured — reset link omitted from logs.",
        );
      }
      return { ok: true, message: GENERIC_SUCCESS };
    }
    return {
      ok: false,
      message: "Could not send the reset email. Try again in a few minutes.",
    };
  }

  return { ok: true, message: GENERIC_SUCCESS };
}
