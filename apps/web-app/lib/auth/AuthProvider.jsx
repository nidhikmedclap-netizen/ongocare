// lib/auth/AuthProvider.jsx
//
// Single shared auth + profile subscription for the whole app. Mount once
// near the root so every useAuthUser() consumer shares one onSnapshot
// instead of opening a new listener per component.

"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { onAuthStateChanged, signInWithCustomToken } from "firebase/auth";
import { doc, getDoc, getDocFromServer, onSnapshot } from "firebase/firestore";
import { auth } from "@/lib/firebase/auth";
import { db } from "@/lib/firebase/firestore";
import { clearSignedOutSession, clearSignedOutIfSessionActive, isSignedOutSession } from "@/lib/auth/signOut";
import { parseDashboardPathname } from "@/lib/urls/dashboardPaths";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileReady, setProfileReady] = useState(false);

  useEffect(() => {
    let profileUnsub = null;
    let fallbackTimer = null;
    let cancelled = false;
    let restoring = false;

    async function restoreClientFromSessionCookie() {
      if (restoring) return false;
      if (isSignedOutSession()) {
        if (!(await clearSignedOutIfSessionActive())) return false;
      }
      const pathname =
        typeof window !== "undefined" ? window.location.pathname : "";
      const onDashboard =
        pathname === "/dashboard" || parseDashboardPathname(pathname) != null;
      if (!onDashboard) return false;

      restoring = true;
      try {
        const status = await fetch("/api/auth/session/status", {
          credentials: "include",
        });
        if (!status.ok) return false;

        const establishRes = await fetch("/api/auth/establish", {
          method: "POST",
          credentials: "include",
        });
        if (establishRes.ok) {
          const establishData = await establishRes.json();
          if (establishData?.customToken) {
            await signInWithCustomToken(auth, establishData.customToken);
            if (auth.currentUser) {
              await auth.currentUser.getIdToken();
              return true;
            }
          }
        }

        const res = await fetch("/api/auth/session/restore", {
          method: "POST",
          credentials: "include",
        });
        const data = await res.json();
        if (data?.customToken) {
          await signInWithCustomToken(auth, data.customToken);
          if (auth.currentUser) {
            await auth.currentUser.getIdToken();
          }
        }
        return Boolean(auth.currentUser);
      } catch {
        return false;
      } finally {
        restoring = false;
      }
    }

    async function finishDashboardAuthWithoutUser() {
      if (cancelled || auth.currentUser) return;

      const deadline = Date.now() + 4000;
      while (Date.now() < deadline && !cancelled && !auth.currentUser) {
        try {
          const status = await fetch("/api/auth/session/status", {
            credentials: "include",
          });
          if (!status.ok) break;

          await restoreClientFromSessionCookie();
          if (auth.currentUser) return;

          await new Promise((resolve) => setTimeout(resolve, 200));
        } catch {
          break;
        }
      }

      if (cancelled || auth.currentUser) return;

      setProfileReady(true);
      setLoading(false);
    }

    const authUnsub = onAuthStateChanged(auth, (nextUser) => {
      profileUnsub?.();
      profileUnsub = null;
      if (fallbackTimer) {
        clearTimeout(fallbackTimer);
        fallbackTimer = null;
      }

      if (!nextUser) {
        setUser(null);
        setProfile(null);

        const pathname =
          typeof window !== "undefined" ? window.location.pathname : "";
        const onDashboard =
          pathname === "/dashboard" || parseDashboardPathname(pathname) != null;

        if (onDashboard) {
          setProfileReady(false);
          setLoading(true);
          (async () => {
            if (isSignedOutSession()) {
              await clearSignedOutIfSessionActive();
            }
            if (cancelled || auth.currentUser) return;
            await restoreClientFromSessionCookie();
            if (cancelled || auth.currentUser) return;
            finishDashboardAuthWithoutUser();
          })();
          return;
        }

        setProfileReady(true);
        setLoading(false);
        return;
      }

      clearSignedOutSession();

      setUser(nextUser);
      setProfileReady(false);
      setLoading(true);

      const finishProfileLoad = () => {
        if (cancelled) return;
        setProfileReady(true);
        setLoading(false);
      };

      fallbackTimer = setTimeout(finishProfileLoad, 4000);

      const profileRef = doc(db, "users", nextUser.uid);

      // One server read for onboarding resume (avoids stale cache + avoids
      // includeMetadataChanges doubling snapshot events).
      getDocFromServer(profileRef)
        .then((snap) => {
          if (cancelled) return;
          setProfile(snap.exists() ? snap.data() : null);
          if (fallbackTimer) {
            clearTimeout(fallbackTimer);
            fallbackTimer = null;
          }
          finishProfileLoad();
        })
        .catch(async () => {
          if (cancelled) return;
          // Server read failed (quota/offline) — try local cache so login
          // redirect can still resolve role when possible.
          try {
            const cached = await getDoc(profileRef);
            if (!cancelled) {
              setProfile(cached.exists() ? cached.data() : null);
            }
          } catch {
            // ignore — finishProfileLoad still runs via timer or below
          }
          if (fallbackTimer) {
            clearTimeout(fallbackTimer);
            fallbackTimer = null;
          }
          finishProfileLoad();
        });

      // Ignore cache-only snapshots so a stale local users/{uid} doc cannot
      // overwrite a fresh getDocFromServer result (wrong email/role after re-seed).
      profileUnsub = onSnapshot(
        profileRef,
        { includeMetadataChanges: true },
        (snap) => {
          if (snap.metadata.fromCache) return;
          setProfile(snap.exists() ? snap.data() : null);
        },
        (err) => {
          // eslint-disable-next-line no-console
          console.warn("[AuthProvider] profile snapshot error:", err);
          // Keep the last known profile — clearing it breaks login redirect.
        },
      );
    });

    return () => {
      cancelled = true;
      authUnsub();
      profileUnsub?.();
      if (fallbackTimer) clearTimeout(fallbackTimer);
    };
  }, []);

  const role = profile?.role ?? null;

  const value = useMemo(
    () => ({ user, profile, role, loading, profileReady }),
    [user, profile, role, loading, profileReady],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuthUser() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuthUser must be used inside AuthProvider");
  }
  return ctx;
}
