import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SavingsCalculator from "./SavingsCalculator";
import {
  TRUST_ITEMS,
  INTRO_BULLETS,
  COMPARISON_ROWS,
  HOW_IT_WORKS,
  COMMON_SIDE_EFFECTS,
  SERIOUS_SIDE_EFFECTS,
  COST_PROVIDERS,
  PROCESS_STEPS,
  WHY_CHOOSE,
  HERO_MEDS,
} from "@/lib/comparison/content";
import styles from "./ComparisonPage.module.css";

const MAX_COST = Math.max(...COST_PROVIDERS.map((p) => p.cost));

function CellValue({ cell }) {
  if (cell.type === "check") {
    return (
      <span className={styles.checkCell}>
        <span className={styles.checkIcon} aria-hidden="true">
          ✓
        </span>
        {cell.text}
      </span>
    );
  }
  return <span>{cell.text}</span>;
}

export default function ComparisonPage() {
  return (
    <>
      <Header />
      <main className={styles.page}>
        {/* Hero */}
        <section className={styles.heroSection}>
          <div className={styles.heroShell}>
            <div className={styles.heroGrid}>
              <div className={styles.heroCopy}>
                <span className={styles.eyebrowBadge}>
                  <span className={styles.eyebrowDot} aria-hidden="true" />
                  GLP-1 Comparison Guide
                </span>
                <h1 className={styles.heroHeading}>
                  Choose the right{" "}
                  <span className={styles.headingAccent}>GLP-1 medication</span>{" "}
                  for you
                </h1>
                <p className={styles.heroSubcopy}>
                  Compare FDA-approved options like Wegovy and Zepbound side by
                  side — then connect with a licensed clinician to find the plan
                  that fits your goals.
                </p>
                <a href="/weightloss-onboard" className={styles.primaryBtn}>
                  Get Started Now — It&apos;s Free →
                </a>
              </div>

              <div className={styles.heroVisual}>
                <div className={styles.heroBento}>
                  {HERO_MEDS.map((med) => (
                    <a
                      key={med.name}
                      href={med.href}
                      className={styles.heroMedCard}
                    >
                      <div className={styles.heroMedVideo}>
                        <video
                          src={med.videoSrc}
                          autoPlay
                          loop
                          muted
                          playsInline
                          preload="metadata"
                        />
                      </div>
                      <div className={styles.heroMedMeta}>
                        <span className={styles.heroMedName}>{med.name}</span>
                        <span className={styles.heroMedIngredient}>
                          {med.ingredient}
                        </span>
                        <span className={styles.heroMedStat}>
                          {med.stat} avg. loss
                        </span>
                      </div>
                    </a>
                  ))}
                  <article className={styles.heroStatCard}>
                    <span className={styles.heroStatValue}>4,000+</span>
                    <span className={styles.heroStatLabel}>
                      Patients trust Ongo
                    </span>
                  </article>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.trustStrip}>
            {TRUST_ITEMS.map((item) => (
              <span key={item.label} className={styles.trustItem}>
                <span aria-hidden="true">{item.icon}</span>
                {item.label}
              </span>
            ))}
          </div>
        </section>

        {/* Introduction */}
        <section className={`${styles.section} ${styles.sectionAlt}`}>
          <div className={styles.container}>
            <div className={styles.introGrid}>
              <header className={styles.introHeader}>
                <p className={styles.eyebrow}>Compare with confidence</p>
                <h2 className={styles.sectionHeading}>
                  A detailed comparison of{" "}
                  <span className={styles.headingAccent}>GLP-1 medications</span>
                </h2>
              </header>
              <div className={styles.introBody}>
                <p>
                  GLP-1 medications have transformed chronic weight management,
                  but not every option works the same way. Wegovy (semaglutide)
                  and Zepbound (tirzepatide) are both FDA-approved — yet they
                  differ in mechanism, dosing, and clinical outcomes.
                </p>
                <p>
                  Choosing the right medication depends on your health history,
                  tolerance, and goals. A licensed Ongo clinician helps you
                  weigh the evidence — never a one-size-fits-all questionnaire.
                </p>
                <ul className={styles.introList}>
                  {INTRO_BULLETS.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Comparison table */}
        <section className={styles.section}>
          <div className={styles.container}>
            <header className={styles.sectionHeader}>
              <p className={styles.eyebrow}>Side by side</p>
              <h2 className={styles.sectionHeading}>
                Wegovy vs. Zepbound:{" "}
                <span className={styles.headingAccent}>a side-by-side comparison</span>
              </h2>
              <p className={styles.sectionLead}>
                Key differences at a glance. Always consult a licensed clinician
                before starting any prescription medication.
              </p>
            </header>

            <div className={styles.tableWrap}>
              <table className={styles.compareTable}>
                <thead>
                  <tr>
                    <th scope="col">Feature</th>
                    <th scope="col">Wegovy (Semaglutide)</th>
                    <th scope="col">Zepbound (Tirzepatide)</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON_ROWS.map((row) => (
                    <tr key={row.feature}>
                      <th scope="row">{row.feature}</th>
                      <td>
                        <CellValue cell={row.wegovy} />
                      </td>
                      <td>
                        <CellValue cell={row.zepbound} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className={styles.tableNote}>
              *Based on published clinical trial data. Individual results vary.
              Prescription required. This comparison is for educational purposes
              and does not constitute medical advice.
            </p>
          </div>
        </section>

        {/* Mid CTA */}
        <section className={styles.ctaBanner}>
          <div className={styles.ctaBannerInner}>
            <div className={styles.ctaBannerCopy}>
              <span className={styles.ctaEyebrow}>Real results, real care</span>
              <h2 className={styles.ctaBannerHeading}>
                The journey to a healthier you starts here
              </h2>
              <p className={styles.ctaBannerText}>
                Take a free 5-minute evaluation. A licensed clinician will review
                your history and recommend a plan — only prescribing when
                clinically appropriate.
              </p>
              <div className={styles.ctaStats}>
                <div className={styles.ctaStat}>
                  <span className={styles.ctaStatValue}>−29 lbs</span>
                  <span className={styles.ctaStatLabel}>Avg. loss in 6 months</span>
                </div>
                <div className={styles.ctaStatDivider} aria-hidden="true" />
                <div className={styles.ctaStat}>
                  <span className={styles.ctaStatValue}>92%</span>
                  <span className={styles.ctaStatLabel}>See visible results</span>
                </div>
              </div>
              <a href="/weightloss-onboard" className={styles.lightBtn}>
                Check my eligibility →
              </a>
            </div>

            <div className={styles.ctaBannerVisual}>
              <div className={styles.ctaImageWrap}>
                <Image
                  src="/images/fat-girl.webp"
                  alt="Before weight loss program"
                  fill
                  sizes="(max-width: 900px) 100vw, 340px"
                  className={`${styles.ctaHeroImage} ${styles.ctaHeroBefore}`}
                />
                <Image
                  src="/images/slim-girl.webp"
                  alt="After weight loss program"
                  fill
                  sizes="(max-width: 900px) 100vw, 340px"
                  className={`${styles.ctaHeroImage} ${styles.ctaHeroAfter}`}
                />
                <span className={styles.ctaLabelBefore}>Before</span>
                <span className={styles.ctaLabelAfter}>After</span>
              </div>

              <div className={styles.ctaWeightChip}>
                <div className={styles.ctaChipHeader}>
                  <span className={styles.ctaChipLabel}>Your weight</span>
                  <span className={styles.ctaChipValue}>
                    <span aria-hidden="true">↓</span> 35 lbs
                  </span>
                </div>
                <svg viewBox="0 0 200 60" className={styles.ctaChipChart} aria-hidden="true">
                  <polyline
                    points="10,15 50,18 90,12 130,30 170,40 190,48"
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.95)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <p className={styles.ctaHoverHint}>
                <span className={styles.ctaHintDot} aria-hidden="true" />
                Hover to see her transformation
              </p>
            </div>
          </div>
        </section>

        {/* How GLP-1 works */}
        <section className={`${styles.section} ${styles.sectionSoft}`}>
          <div className={styles.container}>
            <div className={styles.splitPanel}>
              <div className={styles.splitCopy}>
                <p className={styles.eyebrow}>The science</p>
                <h2 className={styles.sectionHeadingLeft}>
                  How GLP-1 medications work
                </h2>
                <ul className={styles.mechanismList}>
                  {HOW_IT_WORKS.map((item) => (
                    <li key={item.title} className={styles.mechanismItem}>
                      <span className={styles.mechanismIcon} aria-hidden="true">
                        {item.icon}
                      </span>
                      <div>
                        <h3 className={styles.mechanismTitle}>{item.title}</h3>
                        <p className={styles.mechanismBody}>{item.body}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <div className={styles.splitVisual}>
                <div className={styles.bodyDiagram}>
                  <div className={styles.bodyDiagramBrain}>
                    <span>🧠</span>
                    <p>Appetite signals</p>
                  </div>
                  <div className={styles.bodyDiagramCore}>
                    <span>GLP-1</span>
                  </div>
                  <div className={styles.bodyDiagramStomach}>
                    <span>🫁</span>
                    <p>Slower digestion</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Side effects */}
        <section className={`${styles.section} ${styles.sectionAlt}`}>
          <div className={styles.container}>
            <header className={styles.sectionHeader}>
              <p className={styles.eyebrow}>Safety first</p>
              <h2 className={styles.sectionHeading}>
                Common and potential{" "}
                <span className={styles.headingAccent}>side effects</span>
              </h2>
            </header>

            <div className={styles.effectsGrid}>
              <article className={styles.effectsCard}>
                <h3 className={styles.effectsCardTitle}>Common side effects</h3>
                <ul className={styles.effectsList}>
                  {COMMON_SIDE_EFFECTS.map((item) => (
                    <li key={item} className={styles.effectsItemOk}>
                      <span aria-hidden="true">✓</span> {item}
                    </li>
                  ))}
                </ul>
              </article>
              <article className={styles.effectsCard}>
                <h3 className={styles.effectsCardTitle}>Serious side effects</h3>
                <ul className={styles.effectsList}>
                  {SERIOUS_SIDE_EFFECTS.map((item) => (
                    <li key={item} className={styles.effectsItemWarn}>
                      <span aria-hidden="true">✕</span> {item}
                    </li>
                  ))}
                </ul>
              </article>
            </div>

            <div className={styles.warningBox}>
              <span className={styles.warningIcon} aria-hidden="true">
                ⚠
              </span>
              <div>
                <strong>Black box warning</strong>
                <p>
                  GLP-1 medications may cause thyroid C-cell tumors in rodents.
                  It is unknown whether this occurs in humans. Do not use if you
                  or a family member have had medullary thyroid carcinoma or MEN
                  2. Report any neck lumps, hoarseness, or difficulty swallowing
                  to your clinician immediately.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Savings & cost */}
        <section className={styles.section}>
          <div className={styles.container}>
            <header className={styles.sectionHeader}>
              <p className={styles.eyebrow}>Transparent pricing</p>
              <h2 className={styles.sectionHeading}>
                Estimate your savings with{" "}
                <span className={styles.headingAccent}>Ongo Care</span>
              </h2>
            </header>

            <div className={styles.savingsGrid}>
              <SavingsCalculator />

              <div className={styles.costCompareCard}>
                <h3 className={styles.calculatorTitle}>
                  Compare costs across providers
                </h3>
                <p className={styles.calculatorLead}>
                  Estimated monthly medication + care costs. Actual pricing varies
                  by plan and medication.
                </p>
                <div className={styles.costBars}>
                  {COST_PROVIDERS.map((provider) => (
                    <div key={provider.name} className={styles.costBarRow}>
                      <div className={styles.costBarMeta}>
                        <span
                          className={
                            provider.highlight
                              ? styles.costBarNameHighlight
                              : styles.costBarName
                          }
                        >
                          {provider.name}
                        </span>
                        <span className={styles.costBarValue}>
                          ${provider.cost}/mo
                        </span>
                      </div>
                      <div className={styles.costBarTrack}>
                        <div
                          className={
                            provider.highlight
                              ? styles.costBarFillHighlight
                              : styles.costBarFill
                          }
                          style={{
                            width: `${(provider.cost / MAX_COST) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Process timeline */}
        <section className={`${styles.section} ${styles.sectionSoft}`}>
          <div className={styles.container}>
            <header className={styles.sectionHeader}>
              <p className={styles.eyebrow}>Your journey</p>
              <h2 className={styles.sectionHeading}>
                How to get started with{" "}
                <span className={styles.headingAccent}>Ongo Care</span>
              </h2>
            </header>

            <ol className={styles.timeline}>
              {PROCESS_STEPS.map((step, index) => (
                <li key={step.n} className={styles.timelineItem}>
                  <div
                    className={
                      index % 2 === 0
                        ? styles.timelineMarker
                        : styles.timelineMarkerAlt
                    }
                  >
                    <span aria-hidden="true">{step.icon}</span>
                  </div>
                  <article className={styles.timelineCard}>
                    <span className={styles.timelineStep}>{step.n}</span>
                    <h3 className={styles.timelineTitle}>{step.title}</h3>
                    <p className={styles.timelineBody}>{step.body}</p>
                  </article>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Why choose us */}
        <section className={styles.section}>
          <div className={styles.container}>
            <header className={styles.sectionHeader}>
              <p className={styles.eyebrow}>The Ongo difference</p>
              <h2 className={styles.sectionHeading}>
                Why choose Ongo Care for{" "}
                <span className={styles.headingAccent}>weight loss?</span>
              </h2>
            </header>

            <div className={styles.whyGrid}>
              {WHY_CHOOSE.map((card) => (
                <article key={card.title} className={styles.whyCard}>
                  <span className={styles.whyIcon} aria-hidden="true">
                    {card.icon}
                  </span>
                  <h3 className={styles.whyTitle}>{card.title}</h3>
                  <p className={styles.whyBody}>{card.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className={styles.finalCta}>
          <div className={styles.finalCtaInner}>
            <h2 className={styles.finalCtaHeading}>
              Ready to start your weight loss journey?
            </h2>
            <p className={styles.finalCtaText}>
              Take a free evaluation today. A licensed clinician will review your
              history and help you choose the right GLP-1 plan.
            </p>
            <a href="/weightloss-onboard" className={styles.lightBtn}>
              Get Started Now →
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
