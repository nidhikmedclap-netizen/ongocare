import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Faq from "@/components/sections/Faq";
import { FEATURE_CARDS, TRUST_LOGOS, DOCTORS } from "@/lib/medications/content";
import styles from "./MedicationPage.module.css";

export default function MedicationPage({ med }) {
  const featured =
    med.testimonials.items.find((t) => t.featured) ??
    med.testimonials.items[0];

  const circlePathId = `medCirclePath-${med.slug}`;

  const faqContent = {
    eyebrow: med.faq.eyebrow,
    headingMain: med.faq.headingMain,
    headingAccent: med.faq.headingAccent,
    headingSuffix: med.faq.headingSuffix,
    subcopy: med.faq.subcopy,
    contactBadge: med.faq.contactBadge,
    contactTitle: med.faq.contactTitle,
    contactText: med.faq.contactText,
    contactCta: med.faq.contactCta,
    faqs: med.faq.items,
  };

  return (
    <>
      <Header />
      <main className={styles.page}>
        <section className={styles.heroSection}>
          <div className={styles.heroShell}>
            <div className={styles.heroGrid}>
              <div className={styles.heroCopy}>
                <span className={styles.eyebrowBadge}>
                  <span className={styles.eyebrowDot} aria-hidden="true" />
                  {med.hero.eyebrow}
                </span>
                <h1 className={styles.heroHeading}>
                  {med.hero.headingMain}{" "}
                  <span className={styles.headingAccent}>
                    {med.hero.headingAccent}
                  </span>
                </h1>
                <p className={styles.heroSubcopy}>{med.hero.subcopy}</p>
                <div className={styles.heroCtas}>
                  <a href="/weightloss-onboard" className={styles.primaryBtn}>
                    Get Started →
                  </a>
                  <a href="#how-it-works" className={styles.secondaryBtn}>
                    How it works
                  </a>
                </div>
              </div>

              <div className={styles.heroVisual}>
                <div className={styles.rotatingBadge} aria-hidden="true">
                  <svg viewBox="0 0 200 200" className={styles.rotatingSvg}>
                    <defs>
                      <path
                        id={circlePathId}
                        d="M 100, 100 m -78, 0 a 78,78 0 1,1 156,0 a 78,78 0 1,1 -156,0"
                      />
                    </defs>
                    <text className={styles.rotatingText}>
                      <textPath href={`#${circlePathId}`} startOffset="0">
                        {med.rotatingBadge}
                      </textPath>
                    </text>
                  </svg>
                  <span className={styles.badgeCenter} />
                </div>

                <div className={styles.heroVideoFrame}>
                  <video
                    className={styles.heroVideo}
                    src={med.hero.videoSrc}
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="metadata"
                  />
                </div>

                <article className={styles.heroMiniCard}>
                  <span className={styles.heroMiniValue}>
                    {med.hero.stats[0].value}
                  </span>
                  <span className={styles.heroMiniLabel}>
                    {med.hero.stats[0].label}
                  </span>
                </article>
              </div>
            </div>
          </div>

          <div className={styles.trustStrip}>
            {TRUST_LOGOS.map((label) => (
              <span key={label} className={styles.trustItem}>
                {label}
              </span>
            ))}
          </div>
        </section>

        <section className={`${styles.section} ${styles.sectionAlt}`}>
          <div className={styles.container}>
            <header className={styles.sectionHeader}>
              <p className={styles.eyebrow}>The Ongo difference</p>
              <h2 className={styles.sectionHeading}>
                Physician-guided care,{" "}
                <span className={styles.headingAccent}>built around you</span>
              </h2>
            </header>

            <div className={styles.benefitGrid}>
              {FEATURE_CARDS.map((card) => (
                <article key={card.title} className={styles.benefitCard}>
                  <h3 className={styles.benefitTitle}>{card.title}</h3>
                  <p className={styles.benefitText}>{card.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className={`${styles.section} ${styles.sectionAlt}`}>
          <div className={`${styles.container} ${styles.panel}`}>
            <header className={styles.sectionHeader}>
              <p className={styles.eyebrow}>{med.about.eyebrow}</p>
              <h2 className={styles.sectionHeading}>{med.about.title}</h2>
            </header>
            <p className={styles.panelBody}>{med.about.body}</p>
            <a href="/weightloss-onboard" className={styles.outlineBtn}>
              See if you qualify →
            </a>
          </div>
        </section>

        <section
          id="how-it-works"
          className={`${styles.section} ${styles.sectionSoft}`}
        >
          <div className={styles.container}>
            <div className={styles.splitPanel}>
              <div className={styles.splitCopy}>
                <p className={styles.eyebrow}>{med.howItWorks.eyebrow}</p>
                <h2 className={styles.sectionHeadingLeft}>
                  {med.howItWorks.title}
                </h2>
                <p className={styles.splitBody}>{med.howItWorks.body}</p>
                <a href="/weightloss-onboard" className={styles.primaryBtn}>
                  Get Started Now →
                </a>
              </div>
              <div className={styles.splitMedia}>
                <video
                  className={styles.splitVideo}
                  src={med.hero.videoSrc}
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="metadata"
                />
              </div>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.container}>
            <header className={styles.sectionHeader}>
              <p className={styles.eyebrow}>Your journey</p>
              <h2 className={styles.sectionHeading}>
                Our step-by-step process
              </h2>
            </header>
            <div className={styles.programGrid}>
              {med.processSteps.map((step, i) => (
                <article
                  key={step.n}
                  className={`${styles.programCard} ${
                    i % 3 === 1 ? styles.programCardWide : ""
                  }`}
                >
                  <span className={styles.programNum}>{step.n}</span>
                  <h3 className={styles.programTitle}>{step.title}</h3>
                  <p className={styles.programBody}>{step.body}</p>
                </article>
              ))}
            </div>
            <div className={styles.sectionCta}>
              <a href="/weightloss-onboard" className={styles.primaryBtn}>
                Start My Free Evaluation →
              </a>
            </div>
          </div>
        </section>

        <section className={`${styles.section} ${styles.sectionAlt}`}>
          <div className={styles.container}>
            <div className={styles.splitPanel}>
              <div className={styles.splitCopy}>
                <h2 className={styles.sectionHeadingLeft}>
                  {med.eligibility.title}
                </h2>
                <ul className={styles.checkList}>
                  {med.eligibility.items.map((item) => (
                    <li key={item} className={styles.checkItem}>
                      <span className={styles.checkIcon} aria-hidden="true">
                        ✓
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
                <a href="/weightloss-onboard" className={styles.primaryBtn}>
                  Check your eligibility →
                </a>
              </div>
              <div className={styles.splitMedia}>
                <Image
                  src={med.eligibility.image}
                  alt={med.eligibility.imageAlt}
                  width={520}
                  height={650}
                  className={styles.lifestyleImage}
                />
              </div>
            </div>
          </div>
        </section>

        <section className={`${styles.section} ${styles.sectionDark}`}>
          <div className={styles.container}>
            <header className={styles.sectionHeaderLight}>
              <p className={styles.eyebrowLight}>Safety</p>
              <h2 className={styles.sectionHeadingLight}>
                Important safety information
              </h2>
            </header>
            <div className={styles.safetyGrid}>
              {med.safety.map((item) => (
                <article key={item.title} className={styles.safetyCard}>
                  <span className={styles.safetyIcon} aria-hidden="true">
                    {item.icon}
                  </span>
                  <h3 className={styles.safetyTitle}>{item.title}</h3>
                  <p className={styles.safetyBody}>{item.body}</p>
                </article>
              ))}
            </div>
            <div className={styles.sectionCta}>
              <a href="/weightloss-onboard" className={styles.lightBtn}>
                Talk to a clinician →
              </a>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.container}>
            <header className={styles.sectionHeader}>
              <h2 className={styles.sectionHeading}>{med.clinical.title}</h2>
            </header>
            <div className={styles.resultsPanel}>
              <table className={styles.resultsTable}>
                <thead>
                  <tr>
                    {med.clinical.tableHeaders.map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {med.clinical.rows.map((row) => (
                    <tr key={row[0]}>
                      {row.map((cell, i) => (
                        <td key={`${row[0]}-${i}`}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className={styles.metricsRow}>
              {med.clinical.stats.map((s) => (
                <article key={s.label} className={styles.metricCard}>
                  <span className={styles.metricValue}>{s.value}</span>
                  <span className={styles.metricLabel}>{s.label}</span>
                </article>
              ))}
            </div>
            <p className={styles.finePrint}>{med.clinical.finePrint}</p>
          </div>
        </section>

        <section className={`${styles.section} ${styles.sectionSoft}`}>
          <div className={styles.container}>
            <header className={styles.sectionHeader}>
              <h2 className={styles.sectionHeading}>
                {med.videoSection.title}
              </h2>
            </header>
            <div className={styles.videoPanel}>
              <video
                className={styles.videoEl}
                src={med.hero.videoSrc}
                controls
                playsInline
                preload="metadata"
              />
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.container}>
            <div className={styles.dualPanel}>
              <article className={styles.infoCard}>
                <h2 className={styles.infoCardTitle}>{med.injection.title}</h2>
                <ol className={styles.infoList}>
                  {med.injection.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
                <p className={styles.infoNote}>{med.injection.note}</p>
                {med.injection.sites.length > 0 && (
                  <div className={styles.sitePills}>
                    {med.injection.sites.map((site) => (
                      <span key={site} className={styles.sitePill}>
                        {site}
                      </span>
                    ))}
                  </div>
                )}
              </article>
              <article className={styles.infoCard}>
                <h2 className={styles.infoCardTitle}>{med.dosage.title}</h2>
                <p className={styles.infoNote}>{med.dosage.intro}</p>
                <ul className={styles.dosageList}>
                  {med.dosage.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ul>
                <a href="/weightloss-onboard" className={styles.primaryBtn}>
                  Get your personalized plan →
                </a>
              </article>
            </div>
          </div>
        </section>

        <section className={`${styles.section} ${styles.sectionAlt}`}>
          <div className={styles.container}>
            <header className={styles.sectionHeader}>
              <p className={styles.eyebrow}>{med.testimonials.eyebrow}</p>
              <h2 className={styles.sectionHeading}>
                {med.testimonials.title}
              </h2>
              <p className={styles.sectionLead}>{med.testimonials.lead}</p>
            </header>
            <div className={styles.testimonialStage}>
              <div className={styles.avatarCluster} aria-hidden="true">
                {med.testimonials.items.map((t) => (
                  <span
                    key={t.name}
                    className={`${styles.avatar} ${
                      t.featured ? styles.avatarActive : ""
                    }`}
                  >
                    {t.name.charAt(0)}
                  </span>
                ))}
              </div>
              <article className={styles.testimonialFeatured}>
                <p className={styles.testimonialQuote}>{featured.quote}</p>
                <p className={styles.testimonialName}>{featured.name}</p>
                <p className={styles.testimonialDetail}>{featured.detail}</p>
              </article>
              <div className={styles.testimonialStack}>
                {med.testimonials.items
                  .filter((t) => !t.featured)
                  .map((t) => (
                    <article key={t.name} className={styles.testimonialCard}>
                      <p className={styles.testimonialQuoteSm}>{t.quote}</p>
                      <p className={styles.testimonialName}>{t.name}</p>
                    </article>
                  ))}
              </div>
              <div className={styles.trustBadge}>
                <span className={styles.trustBadgeValue}>4,000+</span>
                <span className={styles.trustBadgeLabel}>
                  Patients trust Ongo
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.container}>
            <header className={styles.sectionHeader}>
              <h2 className={styles.sectionHeading}>Meet our medical team</h2>
            </header>
            <div className={styles.teamGrid}>
              {DOCTORS.map((doc) => (
                <article key={doc.name} className={styles.teamCard}>
                  <div className={styles.teamPhoto}>
                    <Image
                      src={doc.image}
                      alt={doc.name}
                      fill
                      sizes="(max-width: 600px) 45vw, 220px"
                      className={styles.teamImage}
                    />
                  </div>
                  <div className={styles.teamInfo}>
                    <h3 className={styles.teamName}>{doc.name}</h3>
                    <p className={styles.teamRole}>{doc.role}</p>
                    <p className={styles.teamBio}>{doc.bio}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <Faq content={faqContent} />

        <section className={styles.ctaSection}>
          <div className={styles.ctaCanvas}>
            <div className={styles.ctaDecor} aria-hidden="true" />
            <div className={styles.ctaContent}>
              <h2 className={styles.ctaHeading}>
                {med.cta.heading}{" "}
                <span className={styles.ctaHeadingAccent}>
                  {med.cta.headingAccent}
                </span>
              </h2>
              <p className={styles.ctaSubcopy}>{med.cta.subcopy}</p>
              <a href="/weightloss-onboard" className={styles.ctaBtn}>
                Get Started →
              </a>
            </div>
          </div>
        </section>

        <p className={styles.disclaimer}>{med.disclaimer}</p>
      </main>
      <Footer />
    </>
  );
}
