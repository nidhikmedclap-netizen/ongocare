// lib/auth/signedOutCookie.js
//
// Cross-origin signed-out flag (marketing :3000 ↔ dashboard :3001 on localhost).

import {
  SIGNED_OUT_COOKIE_NAME,
  SIGNED_OUT_MAX_AGE_SEC,
  getClearSignedOutCookieOptions,
  getSignedOutCookieOptions,
  isProductionEnv,
} from "@/lib/auth/sessionConstants";

export { SIGNED_OUT_COOKIE_NAME } from "@/lib/auth/sessionConstants";

function sharedCookieDomain() {
  return process.env.NEXT_PUBLIC_SHARED_COOKIE_DOMAIN?.trim() || "";
}

function cookieSuffix() {
  const secure = isProductionEnv() ? "; Secure" : "";
  const domain = sharedCookieDomain();
  const domainPart = domain ? `; Domain=${domain}` : "";
  return `${secure}${domainPart}`;
}

/** Attach signed-out cookie on a server response (logout / cross-domain chain). */
export function attachSignedOutCookie(response) {
  response.cookies.set(
    SIGNED_OUT_COOKIE_NAME,
    "1",
    getSignedOutCookieOptions(),
  );
  return response;
}

/** Clear signed-out cookie after a successful sign-in callback. */
export function clearSignedOutCookie(response) {
  response.cookies.set(
    SIGNED_OUT_COOKIE_NAME,
    "",
    getClearSignedOutCookieOptions(),
  );
  return response;
}

export function readSignedOutCookieClient() {
  if (typeof document === "undefined") return false;
  const prefix = `${SIGNED_OUT_COOKIE_NAME}=`;
  return document.cookie.split(";").some((part) => {
    const trimmed = part.trim();
    return trimmed === `${SIGNED_OUT_COOKIE_NAME}=1` || trimmed.startsWith(`${prefix}1`);
  });
}

export function writeSignedOutCookieClient() {
  if (typeof document === "undefined") return;
  document.cookie = `${SIGNED_OUT_COOKIE_NAME}=1; Path=/; Max-Age=${SIGNED_OUT_MAX_AGE_SEC}; SameSite=Lax${cookieSuffix()}`;
}

export function eraseSignedOutCookieClient() {
  if (typeof document === "undefined") return;
  document.cookie = `${SIGNED_OUT_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax${cookieSuffix()}`;
}
