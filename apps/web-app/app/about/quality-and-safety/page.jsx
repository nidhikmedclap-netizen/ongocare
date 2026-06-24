import DeepPage from "../_components/DeepPage";

export const metadata = {
  title: "Quality & Safety — Ongo Weight Loss",
  description:
    "FDA-approved medications, licensed U.S. pharmacies, HIPAA-compliant care — the safeguards behind every Ongo prescription.",
};

export default function QualityAndSafetyPage() {
  return (
    <DeepPage
      slug="quality-and-safety"
      eyebrow="Quality & Safety"
      title="Quality"
      titleAccent="& safety"
      missionParts={[
        { text: "From " },
        { text: "your first intake", bright: true },
        { text: " to the day your medication arrives, " },
        { text: "multiple safeguards", bright: true },
        { text: " protect your " },
        { text: "health, your data, and your trust", bright: true },
        { text: "." },
      ]}
      pillarsEyebrow="The safeguards"
      pillarsHeading="Safety built into"
      pillarsHeadingAccent="every step"
      pillarsLead="FDA-approved medications, HIPAA-grade encryption, and pharmacy-managed shipping — the system behind every prescription."
      pillars={[
        {
          icon: "✅",
          title: "FDA-approved medications",
          body: "We prescribe only FDA-approved GLP-1 medications dispensed by licensed U.S. pharmacies — never gray-market or unregulated alternatives.",
        },
        {
          icon: "🛡️",
          title: "HIPAA-compliant platform",
          body: "Visits, messages, and records are protected by HIPAA-grade encryption and access controls. Your data is yours.",
        },
        {
          icon: "📦",
          title: "Pharmacy-managed shipping",
          body: "Medications ship from licensed pharmacies with cold-chain protections where required — no spillage, no spoilage, no surprises.",
        },
      ]}
      listHeading="The safeguards behind every prescription"
      list={[
        "FDA-approved GLP-1 medications, dispensed by licensed U.S. pharmacies",
        "Board-certified physicians verified on the NPI registry",
        "HIPAA-compliant video visits and messaging",
        "Adverse-event monitoring at every follow-up",
        "Coordinated care with your existing providers on request",
        "Aligned with federal and state telehealth regulations",
      ]}
      cta={{
        heading: "Care you can verify.",
        copy: "Real doctors. Real pharmacies. Real safeguards. Start with a free evaluation and see for yourself.",
        buttonLabel: "Start my free evaluation",
        href: "/weightloss-onboard",
      }}
    />
  );
}
