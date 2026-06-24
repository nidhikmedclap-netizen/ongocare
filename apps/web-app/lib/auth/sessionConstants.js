// lib/auth/sessionConstants.js
//
// Session cookie configuration — safe to import from Edge middleware and client.

export const SESSION_COOKIE_NAME = "__session";
export const ESTABLISH_COOKIE_NAME = "__auth_establish";

/** Firebase session cookie lifetime (max 14 days). */
export const SESSION_EXPIRES_MS = 60 * 60 * 24 * 14 * 1000;
export const SESSION_EXPIRES_SEC = 60 * 60 * 24 * 14;

/** Short-lived cookie for Firebase client sign-in after server callback. */
export const ESTABLISH_EXPIRES_SEC = 120;

export function isProductionEnv() {
  return process.env.NODE_ENV === "production";
}

export function getSessionCookieOptions(maxAge = SESSION_EXPIRES_SEC) {
  return {
    httpOnly: true,
    secure: isProductionEnv(),
    sameSite: "lax",
    path: "/",
    maxAge,
  };
}

export function getClearSessionCookieOptions() {
  return {
    ...getSessionCookieOptions(0),
    maxAge: 0,
  };
}

export function getEstablishCookieOptions(maxAge = ESTABLISH_EXPIRES_SEC) {
  return {
    httpOnly: true,
    secure: isProductionEnv(),
    sameSite: "lax",
    path: "/",
    maxAge,
  };
}

/** Client-readable flag shared across marketing/dashboard hosts (localhost ports share host). */
export const SIGNED_OUT_COOKIE_NAME = "ongocare_signed_out";
export const SIGNED_OUT_MAX_AGE_SEC = 60 * 60;

function sharedCookieDomain() {
  const domain = process.env.NEXT_PUBLIC_SHARED_COOKIE_DOMAIN?.trim();
  return domain || undefined;
}

export function getSignedOutCookieOptions(maxAge = SIGNED_OUT_MAX_AGE_SEC) {
  const options = {
    httpOnly: false,
    secure: isProductionEnv(),
    sameSite: "lax",
    path: "/",
    maxAge,
  };
  const domain = sharedCookieDomain();
  if (domain) options.domain = domain;
  return options;
}

export function getClearSignedOutCookieOptions() {
  return {
    ...getSignedOutCookieOptions(0),
    maxAge: 0,
  };
}
