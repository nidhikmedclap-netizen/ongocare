// lib/auth/redirectAfterAuth.js
//
// After sign-in on the marketing site, bridge to the dashboard via /auth/callback
// (split-site mode). Dashboard host owns the session cookie in split mode.

"use client";

import { auth } from "@/lib/firebase/auth";
import {
  dashboardUrl,
  isSplitSiteMode,
  needsCrossOriginAuthHandoff,
  resolvePostAuthDashboardPath,
} from "@/lib/urls/siteOrigins";
import { toastApiError } from "@/lib/ui/notify";
import { throwIfApiFailed } from "@/lib/ui/userErrorMessage";

let redirectInFlight = false;

export const HANDOFF_COOLDOWN_KEY = "ongocare:handoff-cooldown-ms";
const HANDOFF_COOLDOWN_MS = 10_000;

export function isHandoffCooldownActive() {
  if (typeof window === "undefined") return false;
  try {
    const last = Number(sessionStorage.getItem(HANDOFF_COOLDOWN_KEY) || 0);
    return last > 0 && Date.now() - last < HANDOFF_COOLDOWN_MS;
  } catch {
    return false;
  }
}

function markHandoffAttempt() {
  try {
    sessionStorage.setItem(HANDOFF_COOLDOWN_KEY, String(Date.now()));
  } catch {
    // ignore
  }
}

export function clearHandoffCooldown() {
  try {
    sessionStorage.removeItem(HANDOFF_COOLDOWN_KEY);
  } catch {
    // ignore
  }
}

export function resetRedirectAfterAuthLock() {
  redirectInFlight = false;
}

async function establishSessionCookie(idToken) {
  const res = await fetch("/api/auth/session", {
    method: "POST",
    headers: { Authorization: `Bearer ${idToken}` },
    credentials: "include",
  });
  const data = await res.json();
  if (res.status === 429) {
    const err = new Error(data?.message || "Too many requests");
    err.status = 429;
    throw err;
  }
  if (!res.ok || !data?.success) {
    throwIfApiFailed(data, "auth");
  }
}

async function clearPartialSession() {
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
  } catch {
    // Best-effort — avoid leaving a marketing cookie that triggers middleware loops.
  }
}

/**
 * Navigate to the user's dashboard — handoff when marketing/dashboard split
 * is enabled, otherwise client-side router.replace on the same origin.
 * @returns {Promise<boolean>} true when navigation started successfully
 */
export async function redirectAfterAuth({
  router,
  nextParam,
  role,
  orgSlug,
  defaultNext,
}) {
  if (redirectInFlight) return false;
  redirectInFlight = true;

  const destPath = resolvePostAuthDashboardPath({
    nextParam,
    role,
    orgSlug,
    defaultNext,
  });

  const user = auth.currentUser;
  if (!user) {
    try {
      if (needsCrossOriginAuthHandoff()) {
        window.location.assign(dashboardUrl(destPath));
        return true;
      }
      router.replace(destPath);
      redirectInFlight = false;
      return true;
    } catch (err) {
      redirectInFlight = false;
      throw err;
    }
  }

  try {
    const idToken = await user.getIdToken(true);
    const splitHandoff = needsCrossOriginAuthHandoff();

    // In split-site mode the dashboard callback creates the real session cookie.
    // Setting a marketing cookie here caused login ↔ dashboard redirect loops.
    if (!splitHandoff) {
      await establishSessionCookie(idToken);
    }

    if (!splitHandoff) {
      router.replace(destPath);
      redirectInFlight = false;
      return true;
    }

    const res = await fetch("/api/auth/handoff", {
      method: "POST",
      headers: { Authorization: `Bearer ${idToken}` },
    });
    const data = await res.json();
    if (res.status === 429) {
      const err = new Error(data?.message || "Too many requests");
      err.status = 429;
      throw err;
    }
    if (!data?.handoffId) {
      throwIfApiFailed(data, "auth");
    }

    const callbackUrl = dashboardUrl("/auth/callback", {
      query: {
        handoff: data.handoffId,
        next: destPath,
      },
    });
    markHandoffAttempt();
    try {
      sessionStorage.removeItem("ongocare:callback-complete:/dashboard/patient");
    } catch {
      // ignore stale complete-page flags from prior attempts
    }
    window.location.assign(callbackUrl);
    return true;
  } catch (err) {
    redirectInFlight = false;
    await clearPartialSession();

    const isRateLimited =
      err?.message?.includes("Too many requests") ||
      err?.status === 429;

    let message = "Could not complete sign-in. Please try again.";
    if (isRateLimited) {
      message =
        "Too many sign-in attempts. Please wait a minute and try again.";
    } else if (
      isSplitSiteMode() &&
      typeof window !== "undefined" &&
      /localhost|127\.0\.0\.1/.test(window.location.hostname)
    ) {
      message =
        "Could not open the dashboard site. Make sure both dev servers are running: npm run dev:split (ports 3000 and 3001).";
    } else if (isSplitSiteMode()) {
      message =
        "Could not open the dashboard. Check Vercel env vars (NEXT_PUBLIC_MARKETING_ORIGIN, NEXT_PUBLIC_DASHBOARD_ORIGIN, Firebase client + admin) and redeploy.";
    }

    toastApiError(message);
    // eslint-disable-next-line no-console
    console.error("[redirectAfterAuth]", err?.message || err);
    return false;
  }
}
