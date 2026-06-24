"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase/auth";
import { redirectAfterAuth } from "@/lib/auth/redirectAfterAuth";
import { dashboardPathForRole } from "@/lib/urls/dashboardPaths";
import { useAuthUser } from "@/lib/auth/useAuthUser";
import { stateNameByCode } from "@/data/usStates";
import { useOnboard, useScreenContent } from "./OnboardContext";
import { throwIfApiFailed, userErrorMessage } from "@/lib/ui/userErrorMessage";

const s22bDefaults = {
  question: "Meet your physician",
  subtitle:
    "Your consultation will be with a licensed, board-certified physician who specializes in metabolic health and GLP-1 therapy. Pick the clinician you'd like to see.",
  loadingText: "Loading available clinicians…",
  emptyText:
    "No clinicians licensed in your state are available right now. Head to your patient dashboard — we'll let you know when a clinician is ready.",
  emptyStateText:
    "Select your state on the profile screen so we can match you with a licensed clinician.",
  emptyNoMatchTemplate:
    "No clinicians licensed in {state} are available right now. Head to your patient dashboard — we'll let you know when a clinician is ready.",
  ctaLabel: "Continue",
  dashboardCtaLabel: "Go to your dashboard",
};

export default function S22bDoctor() {
  const { form, updateField, goTo } = useOnboard();
  const c = useScreenContent("s22b", s22bDefaults);
  const router = useRouter();
  const { profile } = useAuthUser();
  const [doctors, setDoctors] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const idToken = await auth.currentUser?.getIdToken();
        const params = new URLSearchParams();
        if (form.state) params.set("state", form.state);
        const qs = params.toString();
        const res = await fetch(`/api/doctors/list${qs ? `?${qs}` : ""}`, {
          headers: idToken ? { Authorization: `Bearer ${idToken}` } : {},
        });
        const data = await res.json();
        if (cancelled) return;
        throwIfApiFailed(data, "load");
        setDoctors(Array.isArray(data.doctors) ? data.doctors : []);
        setError("");
      } catch (e) {
        if (!cancelled) {
          setError(userErrorMessage(e, "load"));
          setDoctors([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [form.state]);

  const select = (d) => {
    const same = form.doctorUid === d.uid;
    updateField("doctorUid", same ? "" : d.uid);
    updateField("doctor", same ? "" : d.fullName);
  };

  const missingState = !form.state;
  const noDoctorsAvailable =
    !missingState && doctors !== null && doctors.length === 0 && !error;
  const emptyNoMatchText =
    !missingState && form.state
      ? (c.emptyNoMatchTemplate || c.emptyText).replace(
          "{state}",
          stateNameByCode(form.state),
        )
      : c.emptyText;

  return (
    <div className="sc doc-sc">
      <div className="q doc-q">{c.question}</div>
      <div className="qs doc-qs">
        {c.subtitle}
      </div>

      {doctors === null && (
        <div className="qs" style={{ marginTop: 14 }}>
          {c.loadingText}
        </div>
      )}

      {missingState && doctors !== null && (
        <div className="qs" style={{ marginTop: 14 }}>
          {c.emptyStateText}
        </div>
      )}

      {!missingState && doctors?.length === 0 && !error && (
        <div className="qs" style={{ marginTop: 14 }}>
          {emptyNoMatchText}
        </div>
      )}

      {error && (
        <div className="qs" style={{ marginTop: 14, color: "#b45309" }}>
          {error}
        </div>
      )}

      {doctors?.map((d) => {
        const isSelected = form.doctorUid === d.uid && d.uid !== "";
        const states = (d.licensedStates || []).join(" · ");
        return (
          <button
            key={d.uid || d.fullName}
            type="button"
            className={`doc-card ${isSelected ? "sel" : ""}`}
            aria-pressed={isSelected}
            onClick={() => select(d)}
            style={{ marginBottom: 10 }}
          >
            <span className="doc-check" aria-hidden>✓</span>

            <span className="doc-header">
              <span
                className="doc-photo"
                style={{
                  background: d.photoURL
                    ? "var(--color-surface-alt, #f8f9fa)"
                    : "linear-gradient(135deg, var(--color-primary-light, #74c69d), var(--color-primary, #347e5d))",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontWeight: 800,
                  fontSize: 28,
                  letterSpacing: "-0.02em",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {d.photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={d.photoURL}
                    alt={d.fullName}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  (d.firstName?.[0] || d.fullName?.[0] || "D").toUpperCase()
                )}
              </span>
              <span className="doc-info">
                <span className="doc-name">Dr. {d.fullName}</span>
                {states && (
                  <span className="doc-creds">Licensed: {states}</span>
                )}
              </span>
            </span>

            {d.bio && (
              <>
                <span className="doc-divider" aria-hidden />
                <span className="doc-bio">{d.bio}</span>
              </>
            )}
          </button>
        );
      })}

      {noDoctorsAvailable ? (
        <button
          type="button"
          className="cta"
          onClick={() =>
            redirectAfterAuth({
              router,
              role: "patient",
              orgSlug: profile?.orgSlug,
              defaultNext: dashboardPathForRole("patient", profile?.orgSlug),
            })
          }
        >
          {c.dashboardCtaLabel || "Go to your dashboard"}
        </button>
      ) : (
        <button
          type="button"
          className="cta"
          disabled={!form.doctorUid}
          onClick={() => goTo("s23")}
        >
          {c.ctaLabel}
        </button>
      )}
    </div>
  );
}
