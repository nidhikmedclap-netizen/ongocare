"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuthUser } from "@/lib/auth/useAuthUser";
import {
  PORTAL_FILTER_ALL,
  adminApiUrl,
  portalFilterLabel,
} from "@/lib/admin/portals";

const STORAGE_KEY = "ongocare.admin.portalFilter";

const AdminPortalContext = createContext(null);

export function AdminPortalProvider({ children }) {
  const { role } = useAuthUser();
  const isSuper = role === "superadmin";
  const [selectedPortal, setSelectedPortalState] = useState(PORTAL_FILTER_ALL);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setSelectedPortalState(saved);
    } catch {
      // ignore private mode / blocked storage
    }
    setHydrated(true);
  }, []);

  const setSelectedPortal = useCallback((value) => {
    setSelectedPortalState(value || PORTAL_FILTER_ALL);
    try {
      if (!value || value === PORTAL_FILTER_ALL) {
        localStorage.removeItem(STORAGE_KEY);
      } else {
        localStorage.setItem(STORAGE_KEY, value);
      }
    } catch {
      // ignore
    }
  }, []);

  const activePortal = isSuper ? selectedPortal : PORTAL_FILTER_ALL;
  const isFiltered =
    isSuper && activePortal && activePortal !== PORTAL_FILTER_ALL;

  const value = useMemo(
    () => ({
      isSuper,
      selectedPortal: activePortal,
      setSelectedPortal,
      portalKey: isSuper ? activePortal : PORTAL_FILTER_ALL,
      isFiltered,
      portalLabel: portalFilterLabel(activePortal),
      buildUrl: (path) =>
        adminApiUrl(path, isSuper ? activePortal : PORTAL_FILTER_ALL),
      hydrated,
    }),
    [isSuper, activePortal, setSelectedPortal, isFiltered, hydrated],
  );

  return (
    <AdminPortalContext.Provider value={value}>
      {children}
    </AdminPortalContext.Provider>
  );
}

export function useAdminPortal() {
  const ctx = useContext(AdminPortalContext);
  if (!ctx) {
    throw new Error("useAdminPortal must be used inside AdminPortalProvider");
  }
  return ctx;
}
