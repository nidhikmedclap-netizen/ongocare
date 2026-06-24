import Image from "next/image";
import styles from "./LoseWeightSection.module.css";

const defaultContent = {
  headingMain: "GLP-1 weight loss plan",
  headingAccentLead: "tailored to",
  headingAccent: "your health",
  subcopy: "Our program is simple and easy to fit into your routine. We offer:",
  benefits: [
    { icon: "✋", text: "1:1 physician guidance" },
    { icon: "◐", text: "Access to GLP-1 medications (when appropriate)" },
    { icon: "📈", text: "Progress monitoring and adjustment" },
  ],
  ctaLabel: "Start My Medical Evaluation",
  ctaHref: "/weightloss-onboard",
  disclaimer:
    "All GLP-1 medications require a doctor's evaluation. Prescription approval is based on medical necessity and aligned with FDA guidelines.",
  chipLabel: "Your Weight",
  chipValue: "35 lbs",
  graphImage: "/images/graph.webp",
  beforeImage: "/images/fat-girl.webp",
  afterImage: "/images/slim-girl.webp",
};

export default function LoseWeightSection({ content }) {
  const c = { ...defaultContent, ...(content || {}) };
  const benefits = c.benefits;
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        {/* Descending weight curve in background — drops on hover */}
      {/* Descending diagonal trend line in background — drops on hover */}
{/* Smooth descending wave curve in background — drops on hover */}
<div  className={styles.bgCurve}>
  <Image
    src={c.graphImage}
    alt="graph goes down like your weight"
    fill
    sizes="100vw"
  />
</div>

        <div className={styles.loseweight_inner}>
          {/* LEFT: Content */}
          <div className={styles.content}>
            <h2 className={styles.heading}>
              {c.headingMain}

              <br />
             {c.headingAccentLead}{" "}
              <span className={styles.headingAccent}>{c.headingAccent}</span>
            </h2>

            <p className={styles.subcopy}>
             {c.subcopy}

            </p>

            <ul className={styles.benefitList}>
              {benefits.map((b, i) => (
                <li key={i} className={styles.benefitItem}>
                  <span className={styles.benefitIcon} aria-hidden="true">
                    {b.icon}
                  </span>
                  <span className={styles.benefitText}>{b.text}</span>
                </li>
              ))}
            </ul>

            <a
              href={c.ctaHref}
              className={styles.primaryBtn}
              style={{ textDecoration: "none" }}
            >
              {c.ctaLabel}
            </a>

            <p className={styles.disclaimer}>
              {c.disclaimer}
            </p>
          </div>

          {/* RIGHT: Image + floating weight chip */}
          <div className={styles.visual}>
            <div className={styles.imageWrapper}>
              <Image
                src={c.beforeImage}
                alt="Person before weight loss program"
                fill
                sizes="(max-width: 900px) 100vw, 640px"
                className={`${styles.heroImage} ${styles.heroImageBefore}`}
              />
              <Image
                src={c.afterImage}
                alt="Person after weight loss program"
                fill
                sizes="(max-width: 900px) 100vw, 640px"
                className={`${styles.heroImage} ${styles.heroImageAfter}`}
              />
            </div>

            {/* Glassmorphic weight chip */}
            <div className={styles.weightChip}>
              <div className={styles.chipHeader}>
                <span className={styles.chipLabel}>{c.chipLabel}</span>
                <span className={styles.chipValue}>
                  <span className={styles.chipArrow} aria-hidden="true">↓</span>
                  {c.chipValue}
                </span>
              </div>
              <svg
                viewBox="0 0 200 60"
                className={styles.chipChart}
                aria-hidden="true"
              >
                <polyline
                  points="10,15 50,18 90,12 130,30 170,40 190,48"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.95)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {[
                  [10, 15],
                  [50, 18],
                  [90, 12],
                  [130, 30],
                  [170, 40],
                  [190, 48],
                ].map(([x, y], i) => (
                  <circle
                    key={i}
                    cx={x}
                    cy={y}
                    r="3"
                    fill="white"
                    stroke="rgba(255,255,255,0.6)"
                    strokeWidth="1"
                  />
                ))}
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
