// app/doctor/doctor-login/page.jsx
//
// Default Ongo doctor sign-in. Per-portal doctor login lives at
// /<slug>/doctor/doctor-login and reuses the same content component.

"use client";

import { Suspense } from "react";
import DoctorLoginContent from "@/components/auth/DoctorLoginContent";
import { authStyles } from "@/components/auth/AuthShell";
import { DEFAULT_LOGO } from "@/lib/branding/defaults";
import { DEFAULT_ORG_SLUG } from "@/lib/orgs";

const BRAND = {
  href: "/",
  ...DEFAULT_LOGO,
};

const PANEL = {
  kicker: "Clinician portal",
  title: "Welcome back.",
  subtitle:
    "Sign in to see today's consults, manage your availability, and review payouts.",
  features: [
    {
      title: "Patients & consults",
      desc: "Your dashboard, charts, and chart notes",
    },
    {
      title: "Availability",
      desc: "Adjust weekly hours and block-out dates",
    },
    {
      title: "Payouts",
      desc: "Track earnings and update banking",
    },
  ],
  footnote: {
    text: "New to Ongo?",
    linkHref: "/doctor/doctor-onboard",
    linkLabel: "Register as a doctor →",
  },
};

const CARD = {
  kicker: "Doctor sign in",
  title: "Sign in to your dashboard",
  subtitle: "Use the work email you registered with.",
};

export default function DoctorLoginPage() {
  return (
    <Suspense fallback={<DoctorLoginFallback />}>
      <DoctorLoginContent
        brand={BRAND}
        panel={PANEL}
        card={CARD}
        defaultNext="/dashboard/doctor"
        loginOrgSlug={DEFAULT_ORG_SLUG}
        resetReturnUrl="/doctor/doctor-login"
      />
    </Suspense>
  );
}

function DoctorLoginFallback() {
  return (
    <main className={`${authStyles.page} ${authStyles.clinician}`}>
      <div className={authStyles.loadingFallback}>Loading…</div>
    </main>
  );
}
