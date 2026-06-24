// app/dashboard/patient/VerificationBanner.jsx
//
// Mounted in the patient layout. Renders only when the signed-in user's
// email is NOT yet verified. Lets them:
//   - Resend the verification email (subject to Firebase's rate limit)
//   - Refresh their session to pull in a freshly-verified status without
//     a manual page reload (useful when they verify in another tab)
//
// We trust two independent signals for "verified":
//   1. profile.emailVerified — mirrored from the ID token via the save-progress
//      route. Updates with the doc, so subscribers re-render automatically.
//   2. auth.currentUser.emailVerified — local Firebase Auth state, freshest
//      after a refreshVerificationStatus() call.
// We hide the banner if either is true so a user who just verified doesn't
// see a stale "not verified" warning while waiting for the Firestore mirror.

"use client";

import { useCallback, useState } from "react";
import {
  refreshVerificationStatus,
  resendVerificationEmail,
} from "@/app/weightloss-onboard/firebaseClient";
import { useAuthUser } from "@/lib/auth/useAuthUser";
import { toastApiError, toastSuccess, toastWarning } from "@/lib/ui/notify";
import { userErrorMessage } from "@/lib/ui/userErrorMessage";

export default function VerificationBanner() {
  const { user, profile } = useAuthUser();
  const [status, setStatus] = useState("idle"); // idle | sending | sent | refreshing
  const [error, setError] = useState("");
  const [locallyVerified, setLocallyVerified] = useState(false);

  // Combine signals — see component docstring for rationale.
  const verified =
    locallyVerified ||
    profile?.emailVerified === true ||
    user?.emailVerified === true;

  if (!user || verified) return null;

  const onResend = async () => {
    setError("");
    setStatus("sending");
    try {
      const { alreadyVerified } = await resendVerificationEmail();
      if (alreadyVerified) {
        setLocallyVerified(true);
        setStatus("idle");
        toastSuccess("Email verified");
      } else {
        setStatus("sent");
        toastSuccess("Verification email sent");
      }
    } catch (err) {
      const message = userErrorMessage(err, "send");
      setError(message);
      toastApiError(err, { fallback: "send" });
      setStatus("idle");
    }
  };

  const onRefresh = async () => {
    setError("");
    setStatus("refreshing");
    try {
      const { verified: nowVerified } = await refreshVerificationStatus();
      if (nowVerified) {
        setLocallyVerified(true);
        toastSuccess("Email verified");
      } else {
        const message = "Still unverified. Open the email link, then click here again.";
        setError(message);
        toastWarning(message);
      }
    } catch (err) {
      const message = userErrorMessage(err, "load");
      setError(message);
      toastApiError(err, { fallback: "load" });
    } finally {
      setStatus("idle");
    }
  };

  return (
    <div style={wrap} role="status" aria-live="polite">
      <div style={iconBox} aria-hidden>
        <WarnIcon />
      </div>
      <div style={textBox}>
        <div style={title}>Verify your email to unlock everything</div>
        <div style={body}>
          We sent a confirmation link to <strong>{user.email}</strong>.
          Click it, then come back here and tap{" "}
          <em>I&apos;ve verified</em>.
        </div>
        {status === "sent" && (
          <div style={successLine}>
            ✓ Verification email sent. Check your inbox (and spam folder).
          </div>
        )}
        {error && <div style={errorLine}>{error}</div>}
      </div>
      <div style={actions}>
        <button
          type="button"
          onClick={onRefresh}
          disabled={status === "refreshing"}
          style={primaryBtn(status === "refreshing")}
        >
          {status === "refreshing" ? "Checking…" : "I've verified"}
        </button>
        <button
          type="button"
          onClick={onResend}
          disabled={status === "sending"}
          style={secondaryBtn(status === "sending")}
        >
          {status === "sending" ? "Sending…" : "Resend email"}
        </button>
      </div>
    </div>
  );
}

/* ─── Styles (inline so the banner is fully self-contained) ──────────── */

const wrap = {
  display: "flex",
  alignItems: "flex-start",
  gap: 14,
  padding: "14px 16px",
  margin: "0 0 20px",
  background: "linear-gradient(135deg, #fff5d6 0%, #fce4dc 100%)",
  border: "1px solid #f4a261",
  borderRadius: 14,
  color: "#1a1a1a",
  flexWrap: "wrap",
};

const iconBox = {
  width: 36,
  height: 36,
  borderRadius: 10,
  background: "rgba(255, 255, 255, 0.7)",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#8a6b00",
  flexShrink: 0,
};

const textBox = { flex: "1 1 240px", minWidth: 0 };

const title = { fontWeight: 700, fontSize: 15, marginBottom: 2 };

const body = {
  fontSize: 13.5,
  color: "#5c6b73",
  lineHeight: 1.45,
};

const successLine = {
  marginTop: 8,
  fontSize: 13,
  color: "#1e7c3a",
  fontWeight: 600,
};

const errorLine = {
  marginTop: 8,
  fontSize: 13,
  color: "#a02928",
};

const actions = {
  display: "flex",
  gap: 8,
  flexShrink: 0,
  flexWrap: "wrap",
};

function primaryBtn(disabled) {
  return {
    background: disabled ? "#b5bcc6" : "var(--color-primary)",
    color: "white",
    border: "none",
    padding: "8px 14px",
    borderRadius: 999,
    fontWeight: 600,
    fontSize: 13,
    cursor: disabled ? "not-allowed" : "pointer",
  };
}

function secondaryBtn(disabled) {
  return {
    background: "transparent",
    color: "#1a1a1a",
    border: "1px solid rgba(0, 0, 0, 0.15)",
    padding: "8px 14px",
    borderRadius: 999,
    fontWeight: 600,
    fontSize: 13,
    cursor: disabled ? "not-allowed" : "pointer",
  };
}

function WarnIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}
