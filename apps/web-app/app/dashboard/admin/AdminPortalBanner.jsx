"use client";

import { useAdminPortal } from "./AdminPortalContext";
import admin from "./admin.module.css";

export default function AdminPortalBanner() {
  const { isFiltered, portalLabel } = useAdminPortal();
  if (!isFiltered) return null;

  return (
    <div className={admin.portalBanner} role="status">
      Viewing data for <strong>{portalLabel}</strong> only. Change portal in
      the sidebar to see other tenants.
    </div>
  );
}
