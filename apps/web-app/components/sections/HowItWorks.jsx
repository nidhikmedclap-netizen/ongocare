import Image from "next/image";
import styles from "./HowItWorks.module.css";

const defaultContent = {
  headingMain: "How your GLP-1",
  headingAccent: "treatment journey works",
  ctaLabel: "Begin My Free Intake Call",
  ctaHref: "/weightloss-onboard",
  disclaimerLabel: "Important:",
  disclaimerBody:
    " Following your consultation, you may fill your prescription at any licensed pharmacy, or choose optional home delivery coordinated through a licensed pharmacy.",
  steps: [
    {
      number: "Step 1",
      title: "Start with a Free Intake Call",
      caption: "Discuss your medication preferences",
      imageAlt: "Mobile app screen showing weight loss goal questions",
      imageSrc: "/images/step-a.webp",
      features: [
        "Convenient online start",
        "Stress-free onboarding",
        "Care team support",
      ],
    },
    {
      number: "Step 2",
      title: "Consult with a Licensed Doctor",
      caption: "Determine your eligibility",
      imageAlt: "Healthcare provider in white coat",
      imageSrc: "/images/step-b.webp",
      features: [
        "Licensed physician review",
        "Eligibility check",
        "Personalized advice",
      ],
    },
    {
      number: "Step 3",
      title: "Receive a Personalized Treatment Plan",
      caption: "If appropriate, start your treatment",
      imageAlt: "Hands receiving a delivery box",
      imageSrc: "/images/step-c.webp",
      features: [
        "Custom medication plan",
        "Discreet door delivery",
        "Ongoing physician support",
      ],
    },
  ],
};

export default function HowItWorks({ content }) {
  const c = { ...defaultContent, ...(content || {}) };
  const steps = c.steps;
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h2 className={styles.heading}>
            {c.headingMain}{" "}
            <span className={styles.headingAccent}>{c.headingAccent}</span>
          </h2>
          <a
            href={c.ctaHref}
            className={styles.ctaButton}
            style={{ textDecoration: "none" }}
          >
           {c.ctaLabel}
          </a>
        </header>

        <ol className={styles.stepGrid}>
          {steps.map((step, index) => (
            <li key={step.number} className={styles.stepCard}>
              <span className={styles.cornerNumber} aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>

              <div className={styles.stepImageWrap}>
                <Image
                  src={step.imageSrc}
                  alt={step.imageAlt}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 400px"
                  className={styles.stepImage}
                />
                <div className={styles.imageGloss} aria-hidden="true" />
              </div>

              <div className={styles.timeline} aria-hidden="true">
                <span className={styles.timelineDot}>{index + 1}</span>
                {index < steps.length - 1 && (
                  <span className={styles.timelineLine} />
                )}
              </div>

              <div className={styles.stepBody}>
                <span className={styles.stepBadge}>{step.number}</span>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepCaption}>{step.caption}</p>

                <ul className={styles.featureList}>
                  {step.features.map((f, i) => (
                    <li
                      key={f}
                      className={styles.featureItem}
                      style={{ "--i": i }}
                    >
                      <span className={styles.featureCheck} aria-hidden="true">
                        ✓
                      </span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ol>

        <p className={styles.disclaimer}>
          <strong>{c.disclaimerLabel}</strong>{c.disclaimerBody}
        </p>
      </div>
    </section>
  );
}
