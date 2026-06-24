// lib/auth/loginAccess.js
//
// Role + portal checks for login pages (patient / doctor / admin, per slug).

import { portalMismatchMessage, portalsMatch } from "@/lib/auth/adminPortalPaths";
import { doctorBelongsToPortal } from "@/lib/orgs/doctorPortals";

/**
 * @param {{
 *   profile: object | null | undefined,
 *   allowedRoles: string[] | null,
 *   loginOrgSlug: string | null,
 * }} options
 * @returns {{
 *   ok: boolean,
 *   role?: string,
 *   code?: "profile-missing" | "wrong-role" | "wrong-portal",
 *   message?: string,
 *   signOut?: boolean,
 * }}
 */
export function validateLoginAccess({ profile, allowedRoles, loginOrgSlug }) {
  const role = profile?.role;

  if (!profile || !role) {
    return {
      ok: false,
      code: "profile-missing",
      message:
        "Signed in, but your account profile could not be loaded. " +
        "This often happens when Firebase daily limits are exceeded, or when " +
        "no user record exists in the database for this email. Try again later " +
        "or contact support.",
      signOut: false,
    };
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return {
      ok: false,
      code: "wrong-role",
      message:
        `This sign-in page is for ${allowedRoles.join(" / ")} accounts only. ` +
        `Your account is registered as "${role}". Use the correct login page for your role.`,
      signOut: true,
    };
  }

  const portalAllowed =
    loginOrgSlug == null ||
    (role === "doctor"
      ? doctorBelongsToPortal(profile, loginOrgSlug)
      : portalsMatch(profile.orgSlug, loginOrgSlug)) ||
    (role === "superadmin" && allowedRoles?.includes("superadmin"));

  if (!portalAllowed) {
    return {
      ok: false,
      code: "wrong-portal",
      message:
        role === "doctor"
          ? "Your account is not assigned to this portal. Sign in using one of your assigned portal login pages."
          : portalMismatchMessage(profile.orgSlug, role),
      signOut: true,
    };
  }

  return { ok: true, role };
}
