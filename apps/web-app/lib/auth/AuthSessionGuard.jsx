"use client";

import { useEffect } from "react";
import {
  isAuthPortalRoute,
  marketingLoginPathForDashboard,
} from "@/lib/urls/dashboardPaths";
import { redirectSignedOutFromDashboard } from "@/lib/auth/signOut";

/**
 * App-wide listener for sign-out + browser Back (bfcache). Must live in
 * Providers so it stays mounted after leaving the dashboard for /login.
 */
export default function AuthSessionGuard() {
  useEffect(() => {
    const guard = () => {
      const pathname = window.location.pathname;
      if (isAuthPortalRoute(pathname)) return;

      const loginPath = marketingLoginPathForDashboard(pathname) || "/login";
      redirectSignedOutFromDashboard(loginPath);
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
  }, []);

  return null;
}
