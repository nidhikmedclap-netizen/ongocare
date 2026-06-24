// app/dashboard/doctor/layout.jsx
//
// Shared chrome for every /dashboard/doctor/* sub-route. Role-gated so only
// users with role="doctor" make it past the loading shim, AND status-gated
// so pending/rejected/deactivated doctors see a verification screen rather
// than the dashboard.

"use client";

import { usePathname } from "next/navigation";
import { useRequireRole } from "@/lib/auth/useRequireRole";
import { confirmSignOut } from "@/lib/auth/signOut";
import { marketingLoginPathForDashboard } from "@/lib/urls/dashboardPaths";
import { formatGmailComposeHref } from "@/lib/email/gmailCompose";
import DoctorSidebar from "./DoctorSidebar";
import styles from "../patient/dashboard.module.css";

export default function DoctorLayout({ children }) {
  const { ready, user, profile } = useRequireRole("doctor");
  const pathname = usePathname();

  if (!ready) {
    return <main className={styles.loading}>Loading your dashboard…</main>;
  }

  // Status gate. Doctors land in "pending" right after signup and stay
  // there until an admin approves them. We block access to the actual
  // dashboard so they can't see patient PHI or accept bookings before
  // verification.
  const status = profile?.status || "pending";
  if (status !== "active") {
    const handleSignOut = () => {
      confirmSignOut({
        loginPath: marketingLoginPathForDashboard(pathname),
      });
    };

    const { title, message } = STATUS_COPY[status] || STATUS_COPY.pending;
    return (
      <main style={pendingLayout}>
        <div style={pendingCard}>
          <div style={pendingKicker}>Account status</div>
          <h1 style={pendingTitle}>{title}</h1>
          <p style={pendingBody}>
            Hi Dr. {profile?.firstName || profile?.lastName || ""} — {message}
          </p>
          <p style={pendingHint}>
            Questions? Email{" "}
            <a
              href={formatGmailComposeHref("info@ongoweightloss.com")}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#2c6f50" }}
            >
              info@ongoweightloss.com
            </a>
            .
          </p>
          <button type="button" onClick={handleSignOut} style={signOutBtn}>
            Sign out
          </button>
        </div>
      </main>
    );
  }

  return (
    <div className={styles.shell}>
      <DoctorSidebar profile={profile} user={user} />
      <div className={styles.main}>{children}</div>
    </div>
  );
}

const STATUS_COPY = {
  pending: {
    title: "Verification in progress",
    message:
      "your application is with our team for review. You'll get an email as soon as it's approved, after which you can sign back in and access your dashboard.",
  },
  rejected: {
    title: "Application not approved",
    message:
      "we weren't able to approve this application. If you believe this was a mistake, please reach out and we'll take another look.",
  },
  deactivated: {
    title: "Account deactivated",
    message:
      "this account has been deactivated. Please contact support to reactivate it.",
  },
};

const pendingLayout = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 32,
  background: "var(--color-bg, #f6f7f9)",
  fontFamily: "inherit",
  color: "var(--color-text, #1f2933)",
};
const pendingCard = {
  background: "var(--color-surface, white)",
  borderRadius: 16,
  padding: "40px 36px",
  maxWidth: 520,
  width: "100%",
  boxShadow: "0 12px 32px rgba(15, 23, 42, 0.08)",
  border: "1px solid var(--color-border, #e6e6e6)",
};
const pendingKicker = {
  fontSize: 12,
  letterSpacing: 1.2,
  textTransform: "uppercase",
  color: "var(--color-text-muted, #5c6470)",
  fontWeight: 600,
  marginBottom: 8,
};
const pendingTitle = {
  margin: "0 0 16px",
  fontSize: 26,
  fontWeight: 700,
  lineHeight: 1.2,
};
const pendingBody = {
  margin: "0 0 16px",
  color: "var(--color-text-muted, #5c6470)",
  lineHeight: 1.6,
};
const pendingHint = {
  margin: "0 0 24px",
  color: "var(--color-text-muted, #5c6470)",
  fontSize: 14,
};
const signOutBtn = {
  background: "transparent",
  border: "1px solid var(--color-border, #d6dae0)",
  borderRadius: 8,
  padding: "10px 16px",
  cursor: "pointer",
  fontSize: 14,
  fontWeight: 500,
};
