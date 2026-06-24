// app/dashboard/patient/layout.jsx
//
// Shared chrome for every /dashboard/patient/* sub-route:
//   - Role guard (only role === "patient" passes)
//   - Sidebar navigation (fixed left rail; collapses to a topbar under 900px)
//   - Padded main content area where the active sub-page renders
//
// Children pages don't need their own auth gate — this layout already
// enforces it before mounting them.

"use client";

import { useRequireRole } from "@/lib/auth/useRequireRole";
import PatientSidebar from "./PatientSidebar";
import VerificationBanner from "./VerificationBanner";
import styles from "./dashboard.module.css";

export default function PatientLayout({ children }) {
  const { ready, user, profile } = useRequireRole("patient");

  if (!ready) {
    return (
      <main className={styles.loading}>Loading your dashboard…</main>
    );
  }

  return (
    <div className={styles.shell}>
      <PatientSidebar profile={profile} user={user} />
      <div className={styles.main}>
        {/* Renders only when the signed-in user's email isn't verified. */}
        <VerificationBanner />
        {children}
      </div>
    </div>
  );
}
