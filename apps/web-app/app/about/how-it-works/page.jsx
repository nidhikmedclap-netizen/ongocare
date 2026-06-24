import DeepPage from "../_components/DeepPage";

export const metadata = {
  title: "How It Works — Ongo Weight Loss",
  description:
    "From your first free evaluation to prescription delivery — a transparent look at the Ongo telehealth experience.",
};

export default function HowItWorksPage() {
  return (
    <DeepPage
      slug="how-it-works"
      eyebrow="How it works"
      title="How"
      titleAccent="it works"
      missionParts={[
        { text: "Care that starts with a " },
        { text: "conversation", bright: true },
        { text: " — not a waiting room. " },
        { text: "Three simple steps", bright: true },
        { text: " from your first free evaluation to a " },
        { text: "personalized GLP-1 plan", bright: true },
        { text: " delivered to your door." },
      ]}
      pillarsEyebrow="The process"
      pillarsHeading="Three steps."
      pillarsHeadingAccent="Real care."
      pillarsLead="Same-day virtual visits with licensed U.S. physicians — built around your goals."
      pillars={[
        {
          icon: "📝",
          title: "1. Free evaluation",
          body: "Tell us about your health, goals, and history. Takes about 5 minutes — no credit card, no commitment.",
        },
        {
          icon: "🎥",
          title: "2. Meet your clinician",
          body: "A licensed U.S. physician reviews your case in a secure same-day video or audio visit. Real human, not a chatbot.",
        },
        {
          icon: "📦",
          title: "3. Personalized plan",
          body: "If clinically appropriate, your medication ships from a licensed U.S. pharmacy — typically within 3–5 business days.",
        },
      ]}
      listHeading="What's included from day one"
      list={[
        "Same-day virtual evaluation by a licensed physician",
        "Personalized GLP-1 plan based on your medical history",
        "Discreet, pharmacy-managed home delivery",
        "Ongoing dose adjustments and follow-up visits",
        "24/7 support from a real care team",
        "Educational resources and a GLP-1 user guide",
      ]}
      cta={{
        heading: "See how the process feels — for free.",
        copy: "Start with a 5-minute evaluation. No commitment, no payment until you're ready to move forward.",
        buttonLabel: "Start my free evaluation",
        href: "/weightloss-onboard",
      }}
    />
  );
}
