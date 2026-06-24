// lib/auth/sessionCookie.js
//
// Server-side Firebase session cookie create / verify / revoke (Node.js only).

import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { isSuperAdmin } from "@/services/firebase/users";
import {
  SESSION_COOKIE_NAME,
  SESSION_EXPIRES_MS,
  getClearSessionCookieOptions,
  getSessionCookieOptions,
} from "@/lib/auth/sessionConstants";

export {
  SESSION_COOKIE_NAME,
  ESTABLISH_COOKIE_NAME,
  SESSION_EXPIRES_MS,
  SESSION_EXPIRES_SEC,
} from "@/lib/auth/sessionConstants";

/**
 * Verify a Firebase ID token and mint an HTTP-only session cookie.
 * @returns {{ sessionCookie: string, decoded: import('firebase-admin/auth').DecodedIdToken }}
 */
export async function createSessionFromIdToken(idToken, { checkRevoked = true } = {}) {
  const decoded = await adminAuth.verifyIdToken(idToken, checkRevoked);
  const sessionCookie = await adminAuth.createSessionCookie(idToken, {
    expiresIn: SESSION_EXPIRES_MS,
  });
  return { sessionCookie, decoded };
}

/** Verify a Firebase session cookie JWT. Returns decoded claims or null. */
export async function verifySessionCookie(sessionCookie, checkRevoked = true) {
  if (!sessionCookie || typeof sessionCookie !== "string") return null;
  try {
    return await adminAuth.verifySessionCookie(sessionCookie, checkRevoked);
  } catch {
    return null;
  }
}

/** Revoke refresh tokens for the user tied to a session cookie. */
export async function revokeSession(sessionCookie) {
  if (!sessionCookie) return;
  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, false);
    await adminAuth.revokeRefreshTokens(decoded.sub);
  } catch {
    // Cookie invalid or already revoked — still clear the browser cookie.
  }
}

/** Load Firestore user profile for a verified session. */
export async function loadAuthUserFromDecoded(decoded) {
  if (!decoded?.sub) return null;

  const snap = await adminDb.collection("users").doc(decoded.sub).get();
  const data = snap.exists ? snap.data() : null;

  return {
    decoded,
    user: data
      ? { uid: decoded.sub, ...data }
      : { uid: decoded.sub, email: decoded.email || "" },
    orgSlug: data?.orgSlug || null,
    isSuper: isSuperAdmin(data?.role),
    role: data?.role || null,
  };
}

/** Read and verify the session from request cookies (Route Handlers / Server Actions). */
export async function getSessionFromRequest(request) {
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) return null;

  const decoded = await verifySessionCookie(sessionCookie, true);
  if (!decoded) return null;

  return loadAuthUserFromDecoded(decoded);
}

/** Read and verify the session from Next.js cookies() (Server Components). */
export async function getServerSession() {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) return null;

  const decoded = await verifySessionCookie(sessionCookie, true);
  if (!decoded) return null;

  return loadAuthUserFromDecoded(decoded);
}

/** Attach a session cookie to a NextResponse. */
export function attachSessionCookie(response, sessionCookie) {
  response.cookies.set(
    SESSION_COOKIE_NAME,
    sessionCookie,
    getSessionCookieOptions(),
  );
  return response;
}

/** Clear the session cookie on a NextResponse. */
export function clearSessionCookie(response) {
  response.cookies.set(
    SESSION_COOKIE_NAME,
    "",
    getClearSessionCookieOptions(),
  );
  return response;
}

/** Apply no-store cache headers for protected responses. */
export function applyNoStoreHeaders(response) {
  response.headers.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, max-age=0",
  );
  response.headers.set("Pragma", "no-cache");
  return response;
}
