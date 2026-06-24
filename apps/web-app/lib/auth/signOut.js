// lib/auth/signOut.js
//
// Shared sign-out: invalidate HTTP-only session cookie, Firebase sign-out,
// hard redirect to login (replaces history so Back cannot return to dashboard).

"use client";

import { useEffect } from "react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/auth";
import { confirmAction } from "@/lib/ui/notify";
import { parseDashboardPathname } from "@/lib/urls/dashboardPaths";
import { isSplitSiteMode, marketingUrl } from "@/lib/urls/siteOrigins";
import {
  clearHandoffCooldown,
  resetRedirectAfterAuthLock,
} from "@/lib/auth/redirectAfterAuth";
import {
  eraseSignedOutCookieClient,
  readSignedOutCookieClient,
  writeSignedOutCookieClient,
} from "@/lib/auth/signedOutCookie";

export const SIGNED_OUT_SESSION_KEY = "ongocare:signed-out";

export function markSignedOutSession() {
  writeSignedOutCookieClient();
  try {
    sessionStorage.setItem(SIGNED_OUT_SESSION_KEY, "1");
  } catch {
    // private mode / disabled storage
  }
}

export function isSignedOutSession() {
  return readSignedOutCookieClient();
}

export function clearSignedOutSession() {
  eraseSignedOutCookieClient();
  try {
    sessionStorage.removeItem(SIGNED_OUT_SESSION_KEY);
  } catch {
    // ignore
  }
}

/** Drop stale signed-out UI state when the server session is still valid. */
export async function clearSignedOutIfSessionActive() {
  if (!isSignedOutSession()) return false;
  try {
    const res = await fetch("/api/auth/session/status", {
      credentials: "include",
    });
    if (!res.ok) return false;
    clearSignedOutSession();
    return true;
  } catch {
    return false;
  }
}

/** @deprecated Prefer {@link isSignedOutSession} — flag persists until login. */
export function consumeSignedOutSession() {
  return isSignedOutSession();
}

/**
 * Login URL after sign-out.
 * Split-site: always NEXT_PUBLIC_MARKETING_ORIGIN (e.g. :3000).
 * Single-site: current host.
 */
export function resolveLoginRedirectUrl(loginPath) {
  const normalized = loginPath?.startsWith("/") ? loginPath : `/${loginPath || "login"}`;

  if (isSplitSiteMode()) {
    return marketingUrl(normalized);
  }

  if (typeof window !== "undefined") {
    const current = window.location.origin.replace(/\/$/, "");
    return `${current}${normalized}`;
  }

  return normalized;
}

async function invalidateServerSession() {
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
  } catch {
    // Continue — cookie clear + redirect still required.
  }
}

/**
 * After dashboard sign-out in split-site mode, clear the marketing session
 * cookie via a redirect chain.
 */
export function resolveCrossDomainLogoutUrl(loginPath = "/login") {
  const normalized = loginPath.startsWith("/") ? loginPath : `/${loginPath}`;
  if (!isSplitSiteMode()) {
    return resolveLoginRedirectUrl(normalized);
  }
  return marketingUrl("/api/auth/logout", {
    query: { redirect: normalized },
  });
}

/** Clear Firebase auth and hard-navigate to login (no SPA navigation). */
export async function forceLoginRedirect(loginPath = "/login") {
  markSignedOutSession();
  resetRedirectAfterAuthLock();
  clearHandoffCooldown();
  await invalidateServerSession();
  try {
    await signOut(auth);
  } catch {
    // Still redirect — stale heap / bfcache must not keep dashboard access.
  }
  window.location.replace(resolveCrossDomainLogoutUrl(loginPath));
}

/** Bounce off dashboard when the tab was signed out (Back / bfcache / reload). */
export async function redirectSignedOutFromDashboard(loginPath = "/login") {
  if (!isSignedOutSession()) return;

  const pathname = typeof window !== "undefined" ? window.location.pathname : "";
  const onDashboard =
    pathname === "/dashboard" || parseDashboardPathname(pathname) != null;
  if (!onDashboard) return;

  await forceLoginRedirect(loginPath);
}

/** Sign out and hard-navigate to login (no SPA soft navigation). */
export async function performSignOut(loginPath) {
  markSignedOutSession();
  resetRedirectAfterAuthLock();
  clearHandoffCooldown();
  await invalidateServerSession();
  try {
    await signOut(auth);
  } catch {
    // Still redirect — local session should not remain on dashboard.
  }
  window.location.replace(resolveCrossDomainLogoutUrl(loginPath));
}

/** Confirm, then sign out + redirect. No-op if the user cancels. */
export async function confirmSignOut({
  loginPath,
  title = "Sign out?",
  description = "You will need to sign in again to access your dashboard.",
  confirmLabel = "Sign out",
  cancelLabel = "Stay signed in",
} = {}) {
  const ok = await confirmAction({
    title,
    description,
    confirmLabel,
    cancelLabel,
    destructive: true,
  });
  if (!ok) return;
  await performSignOut(loginPath);
}

/** Keep the user on login after sign-out instead of Back → cached dashboard. */
export function useLoginBackGuard() {
  useEffect(() => {
    let active = false;
    try {
      active =
        sessionStorage.getItem(SIGNED_OUT_SESSION_KEY) === "1" ||
        readSignedOutCookieClient();
    } catch {
      active = readSignedOutCookieClient();
    }
    if (!active) return;

    window.history.pushState({ signedOutGuard: true }, "", window.location.href);

    const onPopState = () => {
      window.history.pushState({ signedOutGuard: true }, "", window.location.href);
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);
}

/**
 * Re-check auth when the browser restores a cached dashboard page (Back /
 * reload after sign-out). Middleware is the primary gate; this is a UI safety net.
 */
export function useAuthSessionGuard(loginPath = "/login") {
  useEffect(() => {
    const guard = async () => {
      if (isSignedOutSession()) {
        if (await clearSignedOutIfSessionActive()) return;
        await redirectSignedOutFromDashboard(loginPath);
        return;
      }

      try {
        const res = await fetch("/api/auth/session/status", {
          credentials: "include",
        });
        if (!res.ok && parseDashboardPathname(window.location.pathname)) {
          await forceLoginRedirect(loginPath);
        }
      } catch {
        // Network errors — middleware already enforced on navigation.
      }
    };

    guard();

    const onPageShow = () => {
      guard();
    };

    window.addEventListener("pageshow", onPageShow);
    window.addEventListener("popstate", guard);

    return () => {
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener("popstate", guard);
    };
  }, [loginPath]);
}
