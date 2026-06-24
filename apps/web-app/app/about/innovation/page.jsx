import DeepPage from "../_components/DeepPage";

export const metadata = {
  title: "Innovation — Ongo Weight Loss",
  description:
    "How Ongo uses technology to make doctor-led GLP-1 weight loss care faster, kinder, and more personal.",
};

export default function InnovationPage() {
  return (
    <DeepPage
      slug="innovation"
      eyebrow="Innovation"
      title="Modern care"
      titleAccent="modern lives"
      missionParts={[
        { text: "We use " },
        { text: "thoughtful technology", bright: true },
        { text: " to make doctor-led GLP-1 care " },
        { text: "faster, kinder, and more personal", bright: true },
        { text: " — never replacing the clinician, always " },
        { text: "amplifying the human", bright: true },
        { text: " behind your care." },
      ]}
      pillarsEyebrow="What's different"
      pillarsHeading="Technology that"
      pillarsHeadingAccent="puts you first"
      pillarsLead="Telehealth-first design, intelligent intake, and a connected pharmacy network — built so getting healthier feels good."
      pillars={[
        {
          icon: "📱",
          title: "Telehealth-first design",
          body: "Same-day visits from your phone or laptop. No travel, no waiting rooms, no scheduling tetris — just care that fits your life.",
        },
        {
          icon: "🧬",
          title: "Personalized treatment plans",
          body: "Intake captures the data that matters. Your clinician sees your full picture before the call — so the visit goes deep, not broad.",
        },
        {
          icon: "🔒",
          title: "HIPAA-compliant platform",
          body: "Every message, video visit, and record is encrypted and HIPAA-compliant. Your privacy is treated as clinical, not optional.",
        },
      ]}
      listHeading="What innovation means at Ongo"
      list={[
        "5-minute online evaluation that adapts to your answers",
        "Same-day clinician matching based on your needs",
        "End-to-end encrypted video and messaging",
        "Connected U.S. pharmacy network for fast dispatch",
        "Patient dashboard for visits, refills, and progress",
        "24/7 support — chat, call, or message",
      ]}
      cta={{
        heading: "Experience care that feels modern.",
        copy: "Start your evaluation in 5 minutes. See what doctor-led GLP-1 care looks like when technology is on your side.",
        buttonLabel: "Start my evaluation",
        href: "/weightloss-onboard",
      }}
    />
  );
}
