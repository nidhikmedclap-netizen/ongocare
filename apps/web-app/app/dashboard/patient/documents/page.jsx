"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuthUser } from "@/lib/auth/useAuthUser";
import { auth } from "@/lib/firebase/auth";
import { formatIsoDateUs } from "@/lib/dates/usDate";
import { needsOnboardingResume } from "@/lib/billing/patientPayment";
import { onboardingResumePathFromProfile } from "@/lib/onboarding/resumePath";
import { useSignedStorageUrl } from "@/lib/storage/useSignedStorageUrl";
import PrescriptionView from "@/components/patient/PrescriptionView";
import styles from "../dashboard.module.css";
import { throwIfApiFailed } from "@/lib/ui/userErrorMessage";

const DOCUMENT_SLOTS = [
  {
    id: "photoId",
    title: "Government-issued ID",
    description: "Used to verify your identity before prescribing.",
    resumeStep: "s7e",
  },
  {
    id: "vialPhoto",
    title: "GLP-1 vial photo",
    description:
      "Reference photo of your current medication, if you submitted one.",
    resumeStep: "s7d",
  },
];

export default function PatientDocuments() {
  const { profile, user } = useAuthUser();
  const onb = profile?.onboarding || {};
  const docs = onb.documents || {};
  const showResumeOnboarding = needsOnboardingResume(profile);
  const resumeHref = onboardingResumePathFromProfile(profile);
  const [prescriptions, setPrescriptions] = useState(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const idToken = await auth.currentUser?.getIdToken();
        const res = await fetch("/api/patient/appointments", {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        const data = await res.json();
        if (cancelled) return;
        throwIfApiFailed(data, "load");
        const issued = (data.appointments || []).filter((a) =>
          a.prescriptionText?.trim(),
        );
        setPrescriptions(issued);
      } catch (e) {
        if (!cancelled) {
          setPrescriptions([]);
          setLoadError(e?.message || "Could not load documents.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const prescriptionCards = useMemo(
    () =>
      (prescriptions || []).map((a) => ({
        id: a.id,
        title: formatPrescriptionTitle(a),
        text: a.prescriptionText,
        signatureUrl: a.prescriptionSignatureURL,
      })),
    [prescriptions],
  );

  const documentItems = useMemo(
    () =>
      DOCUMENT_SLOTS.map((slot) => {
        const stored = docs[slot.id];
        const legacyName =
          slot.id === "photoId" ? onb.photoIdName : onb.vialPhotoName;
        const legacyPath =
          slot.id === "photoId" ? onb.photoIdPath : onb.vialPhotoPath;
        return {
          ...slot,
          stored: stored?.path
            ? stored
            : legacyPath
              ? {
                  path: legacyPath,
                  fileName: legacyName || slot.title,
                  contentType: "",
                }
              : null,
          legacyOnly: !stored?.path && !legacyPath && !!legacyName,
        };
      }),
    [docs, onb],
  );

  const present = documentItems.filter((item) => item.stored?.path);
  const missing = documentItems.filter((item) => !item.stored?.path);

  return (
    <>
      <header className={styles.pageHeader}>
        <div>
          <div className={styles.kicker}>Patient · Documents</div>
          <h1 className={styles.pageTitle}>Documents</h1>
          <p className={styles.pageSubtitle}>
            Files you submitted during onboarding. Only your care team can see
            these.
          </p>
        </div>
      </header>

      {loadError ? (
        <p role="alert" style={{ color: "var(--color-danger, #c0392b)", marginBottom: 16 }}>
          {loadError}
        </p>
      ) : null}

      {prescriptions === null ? (
        <section className={styles.card} style={{ marginBottom: 16 }}>
          <p style={{ color: "var(--color-text-muted)", margin: 0 }}>
            Loading your documents…
          </p>
        </section>
      ) : prescriptionCards.length > 0 ? (
        <div className={styles.stack} style={{ marginBottom: 16 }}>
          {prescriptionCards.map((rx) => (
            <section key={rx.id} className={styles.card}>
              <div className={styles.cardEyebrow}>Prescription</div>
              <h2 className={styles.cardTitle}>{rx.title}</h2>
              <PrescriptionView text={rx.text} signatureUrl={rx.signatureUrl} />
            </section>
          ))}
        </div>
      ) : null}

      {present.length > 0 && (
        <div className={styles.stack} style={{ marginBottom: 16 }}>
          {present.map((item) => (
            <StoredDocumentCard key={item.id} item={item} />
          ))}
        </div>
      )}

      {missing.length > 0 && (
        <section className={styles.card}>
          <div className={styles.cardEyebrow}>Missing</div>
          <h2 className={styles.cardTitle}>You haven&apos;t uploaded these yet</h2>
          <div
            className={styles.stack}
            style={{ marginTop: 12, gap: 12 }}
          >
            {missing.map((item) => (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 16px",
                  border: "1px solid var(--color-border)",
                  borderRadius: 12,
                  background: "var(--color-bg)",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>{item.title}</div>
                  <div
                    style={{
                      color: "var(--color-text-muted)",
                      fontSize: 13,
                      marginTop: 2,
                    }}
                  >
                    {item.description}
                  </div>
                  {item.legacyOnly && (
                    <div
                      style={{
                        color: "var(--color-text-soft)",
                        fontSize: 12,
                        marginTop: 6,
                        fontStyle: "italic",
                      }}
                    >
                      A previous filename was saved — please upload again to view
                      your file.
                    </div>
                  )}
                </div>
                {showResumeOnboarding ? (
                  <Link
                    href={`${resumeHref}${resumeHref.includes("?") ? "&" : "?"}step=${item.resumeStep}`}
                    className={styles.ctaSecondary}
                  >
                    Upload
                  </Link>
                ) : (
                  <span
                    style={{
                      fontSize: 12,
                      color: "var(--color-text-muted)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Not uploaded
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {present.length === 0 &&
        missing.length === 0 &&
        prescriptionCards.length === 0 && (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>📄</div>
          <div className={styles.emptyTitle}>No documents yet</div>
          <div className={styles.emptyBody}>
            {showResumeOnboarding
              ? "Once you complete onboarding, your uploaded documents will appear here."
              : "Your uploaded documents will appear here."}
          </div>
        </div>
      )}
    </>
  );
}

function StoredDocumentCard({ item }) {
  const { url, loading, error } = useSignedStorageUrl(item.stored?.path);
  const fileName = item.stored?.fileName || item.title;

  return (
    <section className={styles.card}>
      <div className={styles.cardEyebrow}>{item.title}</div>
      <h2 className={styles.cardTitle}>{fileName}</h2>
      <p
        style={{
          margin: "6px 0 0",
          color: "var(--color-text-muted)",
          fontSize: 14,
        }}
      >
        {item.description}
      </p>

      {loading && (
        <p style={{ margin: "12px 0 0", color: "var(--color-text-soft)", fontSize: 13 }}>
          Loading preview…
        </p>
      )}
      {error && (
        <p style={{ margin: "12px 0 0", color: "var(--color-danger, #c0392b)", fontSize: 13 }}>
          {error}
        </p>
      )}
      {url && (
        <div
          style={{
            marginTop: 12,
            borderRadius: 12,
            overflow: "hidden",
            border: "1px solid var(--color-border)",
            maxWidth: 360,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={fileName}
            style={{ display: "block", width: "100%", height: "auto" }}
          />
        </div>
      )}

      {url && (
        <div style={{ marginTop: 12 }}>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.ctaSecondary}
            style={{ display: "inline-block" }}
          >
            View / Download
          </a>
        </div>
      )}
    </section>
  );
}

function formatPrescriptionTitle(appt) {
  const parts = [];
  if (appt.date) {
    parts.push(formatIsoDateUs(appt.date, appt.date));
  }
  if (appt.doctorName) parts.push(`Dr. ${appt.doctorName}`);
  if (appt.type) parts.push(appt.type);
  return parts.join(" · ") || "Prescription";
}
