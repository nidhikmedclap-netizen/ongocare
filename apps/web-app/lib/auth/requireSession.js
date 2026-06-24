// lib/auth/requireSession.js
//
// Server-side session helpers for Server Components, Server Actions, and routes.

import { redirect } from "next/navigation";
import {
  getServerSession,
  verifySessionCookie,
} from "@/lib/auth/sessionCookie";
import { SESSION_COOKIE_NAME } from "@/lib/auth/sessionConstants";
import { cookies } from "next/headers";
import {
  marketingLoginRedirectForDashboardPath,
  marketingUrl,
} from "@/lib/urls/siteOrigins";

/**
 * Require a valid session in a Server Component. Redirects to marketing login
 * when the session cookie is missing or invalid.
 */
export async function requireServerSession(options = {}) {
  const session = await getServerSession();
  if (!session) {
    const loginTarget = options.loginPath
      ? marketingUrl(options.loginPath)
      : marketingUrl("/login");
    redirect(loginTarget);
  }

  if (options.role) {
    const { role, isSuper } = session;
    if (!isSuper && role !== options.role) {
      redirect(marketingUrl("/login"));
    }
  }

  return session;
}

/** Read session cookie value without loading Firestore profile. */
export async function getSessionClaimsOnly() {
  const cookieStore = cookies();
  const value = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!value) return null;
  return verifySessionCookie(value, true);
}

/** Build a marketing login URL for a dashboard pathname (split-site aware). */
export function loginRedirectForPath(pathname) {
  return marketingLoginRedirectForDashboardPath(pathname || "/dashboard/patient");
}
