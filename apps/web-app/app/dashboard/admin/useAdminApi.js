"use client";

import { useCallback } from "react";
import { usePathname } from "next/navigation";
import { auth } from "@/lib/firebase/auth";
import { useAdminPortal } from "./AdminPortalContext";

/** `/dashboard/admin` or `/{slug}/dashboard/admin` from the current path. */
export function useAdminDashboardBase() {
  const pathname = usePathname();
  const match = pathname.match(/^(\/[^/]+)?\/dashboard\/admin/);
  return match ? match[0] : "/dashboard/admin";
}

/**
 * Authenticated fetch helper for /api/admin/* routes. Appends the
 * super-admin portal filter query param when a portal is selected.
 */
export function useAdminApi() {
  const portal = useAdminPortal();

  const fetchAdmin = useCallback(
    async (path, options = {}) => {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error("not signed in");
      const url = portal.buildUrl(path);
      const res = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${idToken}`,
        },
      });
      return res;
    },
    [portal.buildUrl],
  );

  return { ...portal, fetchAdmin };
}
