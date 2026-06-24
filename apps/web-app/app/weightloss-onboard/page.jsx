import WeightlossOnboardForm from "./WeightlossOnboardForm";
import { Suspense } from "react";

export const metadata = {
  title: "Weight Loss Onboarding",
  description:
    "Answer a few questions to see if you're eligible for GLP-1 treatment and book your consultation.",
  alternates: { canonical: "/weightloss-onboard" },
  robots: { index: false, follow: true },
  openGraph: {
    title: "Weight Loss Onboarding | Ongo",
    description:
      "Answer a few questions to see if you're eligible for GLP-1 treatment and book your consultation.",
    type: "website",
  },
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <WeightlossOnboardForm />
    </Suspense>
  );
}
