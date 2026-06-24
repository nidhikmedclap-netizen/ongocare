// lib/auth/useRequireRole.js
//
// Drop-in guard for any page that should only render to a specific role.

"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { signOut, signInWithCustomToken } from "firebase/auth";
import { auth } from "@/lib/firebase/auth";
import { useAuthUser } from "./useAuthUser";
import {
  isSignedOutSession,
  resolveLoginRedirectUrl,
  clearSignedOutIfSessionActive,
  useAuthSessionGuard,
} from "./signOut";
import {
  dashboardPathForRole,
  dashboardUrl,
  isSplitSiteMode,
  loginPathForRole,
  marketingLoginPathForDashboard,
  marketingUrl,
  orgSlugFromPathname,
} from "@/lib/urls/siteOrigins";
import { doctorBelongsToPortal } from "@/lib/orgs/doctorPortals";
import { DEFAULT_ORG_SLUG } from "@/lib/orgs";

function redirectToLogin(requiredRole, pathname) {
  const slug = orgSlugFromPathname(pathname) || null;
  const loginPath = loginPathForRole(requiredRole, slug);
  const nextTarget = isSplitSiteMode()
    ? dashboardUrl(pathname)
    : pathname;
  const url = isSplitSiteMode()
    ? marketingUrl(loginPath, { query: { next: nextTarget } })
    : `${loginPath}?next=${encodeURIComponent(pathname)}`;

  if (isSplitSiteMode()) {
    window.location.assign(url);
  } else {
    return url;
  }
}

export function useRequireRole(requiredRole) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, profile, role, loading, profileReady } = useAuthUser();

  useEffect(() => {
    if (loading) return;

    const slug = orgSlugFromPathname(pathname) || null;
    const loginPath =
      marketingLoginPathForDashboard(pathname) ||
      loginPathForRole(requiredRole, slug);

    // Signed out — redirect even if bfcache still holds a stale `user` in memory.
    if (isSignedOutSession()) {
      let cancelled = false;

      (async () => {
        if (await clearSignedOutIfSessionActive()) return;
        if (cancelled) return;

        signOut(auth)
          .catch(() => {})
          .finally(() => {
            if (cancelled) return;
            window.location.replace(resolveLoginRedirectUrl(loginPath));
          });
      })();

      return () => {
        cancelled = true;
      };
    }

    if (!user) {
      if (loading) return;

      let cancelled = false;

      (async () => {
        if (isSplitSiteMode()) {
          try {
            const res = await fetch("/api/auth/session/status", {
              credentials: "include",
            });
            if (cancelled) return;
            if (res.ok) {
              const restore = await fetch("/api/auth/session/restore", {
                method: "POST",
                credentials: "include",
              });
              const data = await restore.json();
              if (cancelled) return;
              if (data?.customToken) {
                await signInWithCustomToken(auth, data.customToken);
                return;
              }
            }
          } catch {
            // fall through to login redirect
          }
        }

        const nextTarget = isSplitSiteMode()
          ? dashboardUrl(pathname)
          : pathname;

        if (isSplitSiteMode()) {
          window.location.assign(
            marketingUrl(loginPath, { query: { next: nextTarget } }),
          );
        } else {
          router.replace(
            `${loginPath}?next=${encodeURIComponent(pathname)}`,
          );
        }
      })();

      return () => {
        cancelled = true;
      };
    }

    if (!profileReady) return;

    if (!profile) {
      // New patients can land here before save-progress creates users/{uid}.
      if (requiredRole === "patient") {
        const slug = orgSlugFromPathname(pathname) || null;
        const onboardPath = slug
          ? `/${slug}/weightloss-onboard?step=s21`
          : "/weightloss-onboard?step=s21";
        if (isSplitSiteMode()) {
          window.location.assign(marketingUrl(onboardPath));
        } else {
          router.replace(onboardPath);
        }
        return;
      }
      signOut(auth)
        .catch(() => {})
        .finally(() => {
          if (isSplitSiteMode()) {
            redirectToLogin(requiredRole, pathname);
          } else {
            const slug = orgSlugFromPathname(pathname) || null;
            router.replace(loginPathForRole(requiredRole, slug));
          }
        });
      return;
    }

    if (role === "superadmin") {
      if (requiredRole === "admin") return;
      router.replace(
        dashboardPathForRole("superadmin", profile?.orgSlug || null),
      );
      return;
    }

    if (role !== requiredRole) {
      router.replace(dashboardPathForRole(role, profile?.orgSlug || null));
      return;
    }

    const urlSlug = orgSlugFromPathname(pathname);
    const userOrg = profile?.orgSlug || DEFAULT_ORG_SLUG;
    const expectedUrlSlug = userOrg === DEFAULT_ORG_SLUG ? null : userOrg;

    if (urlSlug !== expectedUrlSlug) {
      if (role === "doctor") {
        const portalSlug = urlSlug || DEFAULT_ORG_SLUG;
        if (doctorBelongsToPortal(profile, portalSlug)) return;
      }
      router.replace(dashboardPathForRole(requiredRole, userOrg));
    }
  }, [loading, profileReady, user, role, profile, requiredRole, router, pathname]);

  useAuthSessionGuard(
    marketingLoginPathForDashboard(pathname) ||
      loginPathForRole(requiredRole, orgSlugFromPathname(pathname)),
  );

  const ready =
    !loading &&
    !!user &&
    profileReady &&
    !!profile &&
    !isSignedOutSession() &&
    (role === requiredRole || role === "superadmin");
  return { ready, user, profile, role };
}
