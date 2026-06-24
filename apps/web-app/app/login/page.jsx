// app/login/page.jsx
//
// Patient sign-in for the default Ongo portal. Per-tenant login lives at
// /<slug>/login and shares the same content component — only the brand /
// copy / start-journey deep-link differ.

"use client";

import { Suspense } from "react";
import PatientLoginContent from "@/components/auth/PatientLoginContent";
import { authStyles } from "@/components/auth/AuthShell";
import { DEFAULT_LOGO } from "@/lib/branding/defaults";
import { DEFAULT_ORG_SLUG } from "@/lib/orgs";

const BRAND = {
  href: "/",
  ...DEFAULT_LOGO,
};

const PANEL = {
  kicker: "Patient portal",
  title: "Welcome back.",
  subtitle:
    "Pick up your weight-loss plan, refills, and care messages right where you left off.",
  features: [
    {
      title: "Your progress",
      desc: "Weekly check-ins and weight trends",
    },
    {
      title: "Your medication",
      desc: "Refills, deliveries, and dosing schedule",
    },
    {
      title: "Your care team",
      desc: "Message your doctor and review notes",
    },
  ],
};

const CARD = {
  title: "Sign in to your dashboard",
  subtitle: "Use the email you signed up with.",
};

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <PatientLoginContent
        brand={BRAND}
        panel={PANEL}
        card={CARD}
        defaultNext="/dashboard"
        startJourneyHref="/weightloss-onboard?start=1"
        loginOrgSlug={DEFAULT_ORG_SLUG}
        resetReturnUrl="/login"
      />
    </Suspense>
  );
}

function LoginFallback() {
  return (
    <main className={authStyles.page}>
      <div className={authStyles.loadingFallback}>Loading…</div>
    </main>
  );
}
