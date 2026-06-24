// app/doctor/doctor-onboard/page.jsx
//
// Default Ongo doctor registration. Per-portal doctor signup lives at
// /<slug>/doctor/doctor-onboard and shares DoctorOnboardForm.
//
// This page also supports `?org=<slug>` for backwards compatibility with
// any link that hasn't been migrated to the per-portal URL yet. New links
// should use /<slug>/doctor/doctor-onboard.

"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import DoctorOnboardForm from "./DoctorOnboardForm";

export default function DoctorOnboardPage() {
  // useSearchParams requires a Suspense boundary in the App Router.
  return (
    <Suspense fallback={null}>
      <DoctorOnboardInner />
    </Suspense>
  );
}

function DoctorOnboardInner() {
  // Backwards-compat shim: links built before per-portal URLs existed used
  // `?org=<slug>`. We still honor that so old links keep stamping the
  // right tenant, but new links should target /<slug>/doctor/doctor-onboard.
  const searchParams = useSearchParams();
  const orgSlug = searchParams.get("org") || null;

  return <DoctorOnboardForm orgSlug={orgSlug} />;
}
