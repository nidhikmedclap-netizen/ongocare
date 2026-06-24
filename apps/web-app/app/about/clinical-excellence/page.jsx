import DeepPage from "../_components/DeepPage";

export const metadata = {
  title: "Clinical Excellence — Ongo Weight Loss",
  description:
    "Board-certified U.S. physicians, evidence-based GLP-1 protocols, and a clinical model built around outcomes.",
};

export default function ClinicalExcellencePage() {
  return (
    <DeepPage
      slug="clinical-excellence"
      eyebrow="Clinical excellence"
      title="Clinical"
      titleAccent="excellence"
      missionParts={[
        { text: "Our " },
        { text: "world-class medical team", bright: true },
        { text: " is " },
        { text: "dedicated to ensuring", bright: true },
        { text: " " },
        { text: "every step", bright: true },
        { text: " of your journey on our platform is " },
        { text: "safe, evidence-based, and personal", bright: true },
        { text: "." },
      ]}
      pillarsEyebrow="Standards"
      pillarsHeading="Real doctors."
      pillarsHeadingAccent="Real medicine."
      pillarsLead="Every plan is reviewed by a board-certified U.S. physician. We follow clinical guidelines, not shortcuts."
      pillars={[
        {
          icon: "🩺",
          title: "Board-certified U.S. physicians",
          body: "Every clinician on our platform is licensed in the U.S. — verifiable on the NPI registry — with years of weight-management experience.",
        },
        {
          icon: "📊",
          title: "Evidence-based protocols",
          body: "Treatment plans align with established clinical guidelines for obesity care. No experimental shortcuts, no fad protocols.",
        },
        {
          icon: "🔁",
          title: "Continuous follow-up",
          body: "Ongoing reviews to track progress, adjust dosing, and catch side effects early — care that doesn't stop after delivery.",
        },
      ]}
      listHeading="Our clinical standards"
      list={[
        "Licensed providers verified via NPI registry",
        "FDA-approved GLP-1 medications only",
        "Personalized dosing based on medical history",
        "Side-effect monitoring at every visit",
        "Coordinated care with your primary doctor on request",
        "Transparent, doctor-led decisions — not algorithms",
      ]}
      cta={{
        heading: "Meet a licensed clinician — same day.",
        copy: "Connect with a real, board-certified physician through a secure telehealth visit. Free, no commitment.",
        buttonLabel: "Book a free consultation",
        href: "/weightloss-onboard",
      }}
    />
  );
}
