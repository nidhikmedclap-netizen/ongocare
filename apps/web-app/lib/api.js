// lib/api.js
//
// Tiny utility layer every API route in app/api/* uses:
//
//   import { withAuth, ok, fail } from "@/lib/api";
//
//   export const GET = withAuth({ role: "doctor" }, async (req, ctx, { user, decoded }) => {
//     const data = await fetchOverviewFor(user.uid);
//     return ok({ data });
//   });
//
// Why a wrapper:
//   - Every protected route was repeating the same ~10-line Bearer-token
//     + verifyIdToken + (optional) role check. Centralizing it kills the
//     copy-paste, normalizes the 401 response, and gives one place to add
//     cross-cutting concerns later (rate limiting, request logging,
//     verification-status gates, etc.).
//   - The handler signature mirrors Next.js's: (request, context, auth).
//     `auth` is added on the right so existing context (e.g. params) is
//     untouched.
//
// Response shape stays { success: true/false, message?, ...data } so we
// don't have to change a single client.

import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { SESSION_COOKIE_NAME } from "@/lib/auth/sessionConstants";
import { DEFAULT_ORG_SLUG, isSuperAdmin, normalizeOrgSlug } from "@/services/firebase/users";
import { rateLimitOrNull } from "@/lib/api/rateLimit";

const USER_DOC_CACHE_TTL_MS = 60_000;
/** @type {Map<string, { data: object | null, exp: number }>} */
const userDocCache = new Map();

function getCachedUserDoc(uid) {
  const hit = userDocCache.get(uid);
  if (!hit || hit.exp <= Date.now()) {
    userDocCache.delete(uid);
    return undefined;
  }
  return hit.data;
}

function setCachedUserDoc(uid, data) {
  userDocCache.set(uid, { data, exp: Date.now() + USER_DOC_CACHE_TTL_MS });
}

/** Drop cached profile after admin delete so stale role isn't served. */
export function invalidateUserDocCache(uid) {
  userDocCache.delete(uid);
}

/* ─── Response helpers ───────────────────────────────────────────────── */

export function ok(data = {}) {
  return NextResponse.json({ success: true, ...data });
}

export function fail(message, status = 400) {
  return NextResponse.json({ success: false, message }, { status });
}

/* ─── Auth ───────────────────────────────────────────────────────────── */

// Verify the Authorization: Bearer <idToken> header. When `role` is given,
// also loads the user's Firestore doc and confirms the role matches.
// Superadmin callers satisfy any role check, so a superadmin can hit
// patient/doctor/admin endpoints when troubleshooting tenants.
//
// Returns { decoded, user, orgSlug, isSuper } on success, or null on any
// failure (missing token, invalid token, missing user doc, wrong role).
// `orgSlug` is always present when the user doc exists; null otherwise.
// `isSuper` is true when the caller's role is "superadmin" (handy short-
// hand for handlers that need to bypass the tenant filter).
async function buildAuthFromDecoded(decoded, { role } = {}) {
  let data = getCachedUserDoc(decoded.uid);
  if (data === undefined) {
    const snap = await adminDb.collection("users").doc(decoded.uid).get();
    data = snap.exists ? snap.data() : null;
    setCachedUserDoc(decoded.uid, data);
  }
  const userRole = data?.role || null;
  const orgSlug = data?.orgSlug || null;
  const isSuper = isSuperAdmin(userRole);

  if (role) {
    if (!data) return null;
    if (!isSuper && userRole !== role) return null;
  }

  return {
    decoded,
    user: data
      ? { uid: decoded.uid, ...data }
      : { uid: decoded.uid, email: decoded.email || "" },
    orgSlug,
    isSuper,
  };
}

export async function authenticate(request, { role } = {}) {
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (sessionCookie) {
    try {
      const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
      return buildAuthFromDecoded(decoded, { role });
    } catch {
      // Fall through to Bearer token (client refresh / legacy callers).
    }
  }

  const header = request.headers.get("authorization") || "";
  const idToken = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!idToken) return null;

  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    return buildAuthFromDecoded(decoded, { role });
  } catch {
    return null;
  }
}

/**
 * Helper for tenant-scoped queries inside an authenticated handler.
 *
 *   const slug = scopedOrgSlug(auth);
 *   const patients = await listAllPatientsForAdmin(slug);
 *
 * Returns the caller's orgSlug for tenant-scoped admins, or `null` for
 * superadmins (which most services treat as "no filter, see everything").
 */
export function scopedOrgSlug(auth) {
  if (!auth) return null;
  if (auth.isSuper) return null;
  return normalizeOrgSlug(auth.orgSlug || DEFAULT_ORG_SLUG);
}

/**
 * Effective org scope for admin list/mutation routes.
 *
 * Portal admins: always their own orgSlug (query param ignored).
 * Superadmins: optional `?org=<slug>` narrows to one portal; omit or
 * `?org=all` for cross-portal view.
 */
export function adminOrgScope(auth, request) {
  if (!auth?.isSuper) return scopedOrgSlug(auth);
  try {
    const url = new URL(request.url);
    const org = url.searchParams.get("org");
    if (org == null || org === "" || org === "all") return null;
    return normalizeOrgSlug(org);
  } catch {
    return null;
  }
}

/* ─── Wrappers ───────────────────────────────────────────────────────── */

// Wrap a route handler with consistent error handling. Public endpoints
// (e.g. /api/doctors/list, /api/stripe/payment-intent) use this directly.
export function withErrorHandling(handler, { rateLimitProfile = "default" } = {}) {
  return async (request, ctx) => {
    const limited = rateLimitOrNull(request, rateLimitProfile);
    if (limited) return fail(limited.message, limited.status);
    try {
      return await handler(request, ctx);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[api] handler error:", err);
      return fail("Something went wrong. Please try again.", 500);
    }
  };
}

// Wrap a route handler so it only runs for authenticated requests, with
// an optional role check.
//
// Two call styles:
//   withAuth(handler)                          — any signed-in user
//   withAuth({ role: "doctor" }, handler)      — must be a doctor
//
// On auth failure, returns 401 { success: false, message: "Unauthorized" }.
// When `activeDoctor` is set with role "doctor", pending/rejected accounts
// get 403 instead of reaching the handler (mirrors the dashboard UI gate).
export function withAuth(arg1, arg2) {
  const [options, handler] =
    typeof arg1 === "function" ? [{}, arg1] : [arg1, arg2];

  return withErrorHandling(
    async (request, ctx) => {
      const auth = await authenticate(request, { role: options.role });
      if (!auth) return fail("Unauthorized", 401);
      if (
        options.activeDoctor &&
        auth.user?.role === "doctor" &&
        !auth.isSuper &&
        auth.user?.status !== "active"
      ) {
        return fail("Doctor account is not active.", 403);
      }
      return handler(request, ctx, auth);
    },
    { rateLimitProfile: options.rateLimitProfile || "default" },
  );
}
