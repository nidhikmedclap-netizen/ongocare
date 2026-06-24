import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  HERO,
  MISSION,
  EDITORIAL_PROCESS,
  EXPERT_AUTHORS,
  MEDICAL_REVIEWERS,
  CONTENT_GUIDELINES,
  PRODUCT_SELECTION,
  WHAT_WE_LOOK_FOR,
  PARTNER_AFFILIATES,
  TRANSPARENCY,
  POLICY_DETAILS,
  REPORTING_CONCERNS,
  CTA_BAND,
  CONTACT_STRIP,
  EDITORIAL_META,
} from "@/lib/editorial/content";
import styles from "./EditorialPage.module.css";

function SectionLabel({ children }) {
  return (
    <span className={styles.sectionLabel}>
      <span className={styles.sectionLabelDot} aria-hidden="true" />
      {children}
    </span>
  );
}

function PersonCard({ person, variant }) {
  const isReviewer = variant === "reviewerCard";
  return (
    <article className={`${styles.personCard} ${isReviewer ? styles.reviewerCard : styles.authorCard}`}>
      <div className={styles.personImageWrap}>
        <Image
          src={person.image}
          alt={person.name}
          fill
          className={styles.personImage}
          sizes="(max-width: 768px) 100vw, 400px"
        />
        <div className={styles.personImageFade} aria-hidden="true" />
        <span className={styles.personBadge}>
          {isReviewer ? "Medical reviewer" : "Expert author"}
        </span>
      </div>
      <div className={styles.personBody}>
        <h3 className={styles.personName}>{person.name}</h3>
        <p className={styles.personRole}>{person.role || person.credentials}</p>
        <p className={styles.personBio}>{person.bio}</p>
        <a href={person.href} className={styles.personCta}>
          {person.cta}
          <span className={styles.personCtaArrow} aria-hidden="true">→</span>
        </a>
      </div>
    </article>
  );
}

export default function EditorialPage() {
  return (
    <>
      <Header />
      <main className={styles.page}>
        {/* Hero */}
        <section className={styles.hero}>
          <Image
            src="/images/about-bg.png"
            alt=""
            fill
            priority
            className={styles.heroBg}
            sizes="100vw"
          />
          <div className={styles.heroOverlay} aria-hidden="true" />
          <div className={styles.heroGlowLeft} aria-hidden="true" />
          <div className={styles.heroGlowRight} aria-hidden="true" />
          <div className={styles.heroInner}>
            <SectionLabel>{HERO.eyebrow}</SectionLabel>
            <h1 className={styles.heroTitle}>{HERO.title}</h1>
            <p className={styles.heroSubtitle}>{HERO.subtitle}</p>
            <div className={styles.heroActions}>
              <a href={HERO.cta.href} className={styles.heroCtaPrimary}>
                {HERO.cta.label}
                <span aria-hidden="true">→</span>
              </a>
              <span className={styles.heroUpdated}>
                Updated {EDITORIAL_META.lastUpdated}
              </span>
            </div>
          </div>
        </section>

        {/* Mission */}
        <section className={styles.mission}>
          <div className={styles.missionShell}>
            <div className={styles.missionGrid}>
              <div className={styles.missionCopy}>
                <span className={styles.missionTag}>Our mission</span>
                <h2 className={styles.missionHeading}>{MISSION.heading}</h2>
                <p className={styles.missionBody}>{MISSION.body}</p>
              </div>
              <div className={styles.missionImageWrap}>
                <Image
                  src={MISSION.image}
                  alt={MISSION.imageAlt}
                  fill
                  className={styles.missionImage}
                  sizes="(max-width: 900px) 100vw, 560px"
                />
                <div className={styles.missionImageOverlay} aria-hidden="true" />
              </div>
            </div>
          </div>
        </section>

        {/* Process */}
        <section className={styles.section}>
          <div className={styles.container}>
            <div className={styles.sectionHeader}>
              <SectionLabel>{EDITORIAL_PROCESS.eyebrow}</SectionLabel>
              <h2 className={styles.sectionHeading}>{EDITORIAL_PROCESS.heading}</h2>
              <p className={styles.sectionLead}>{EDITORIAL_PROCESS.lead}</p>
            </div>
            <div className={styles.processGrid}>
              {EDITORIAL_PROCESS.steps.map((step, i) => (
                <article key={step} className={styles.processCard}>
                  <div className={styles.processCardTop}>
                    <span className={styles.processNum}>{String(i + 1).padStart(2, "0")}</span>
                    <span className={styles.processLine} aria-hidden="true" />
                  </div>
                  <p className={styles.processText}>{step}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Authors */}
        <section id="editorial-team" className={`${styles.section} ${styles.sectionInset}`}>
          <div className={styles.container}>
            <div className={styles.splitHeader}>
              <div>
                <SectionLabel>Expert authors</SectionLabel>
                <h2 className={styles.sectionHeading}>Our editorial team</h2>
                <p className={styles.sectionLeadLeft}>
                  Health writers who translate complex clinical research into guidance you can actually use.
                </p>
              </div>
              <div className={styles.headerStat}>
                <span className={styles.headerStatNum}>8+</span>
                <span className={styles.headerStatLabel}>Years combined experience</span>
              </div>
            </div>
            <div className={styles.personGrid}>
              {EXPERT_AUTHORS.map((author) => (
                <PersonCard key={author.name} person={author} variant="authorCard" />
              ))}
            </div>
          </div>
        </section>

        {/* Medical review */}
        <section className={styles.section}>
          <div className={styles.container}>
            <div className={styles.splitHeader}>
              <div>
                <SectionLabel>Medical review board</SectionLabel>
                <h2 className={styles.sectionHeading}>
                  Clinician-reviewed{" "}
                  <span className={styles.headingAccent}>content</span>
                </h2>
                <p className={styles.sectionLeadLeft}>
                  Every article is validated by licensed physicians before publication.
                </p>
              </div>
            </div>
            <div className={styles.personGrid}>
              {MEDICAL_REVIEWERS.map((reviewer) => (
                <PersonCard key={reviewer.name} person={reviewer} variant="reviewerCard" />
              ))}
            </div>
          </div>
        </section>

        {/* Guidelines */}
        <section className={`${styles.section} ${styles.sectionWarm}`}>
          <div className={styles.container}>
            <div className={styles.sectionHeader}>
              <SectionLabel>{CONTENT_GUIDELINES.eyebrow}</SectionLabel>
              <h2 className={styles.sectionHeading}>{CONTENT_GUIDELINES.heading}</h2>
            </div>
            <div className={styles.guidelinesGrid}>
              <article className={`${styles.guidelineCard} ${styles.guidelineFeatured}`}>
                <div className={styles.guidelineCardHeader}>
                  <span className={styles.guidelineIcon} aria-hidden="true">✓</span>
                  <h3 className={styles.guidelineTitle}>
                    {CONTENT_GUIDELINES.evidence.title}
                  </h3>
                </div>
                <ul className={styles.checkList}>
                  {CONTENT_GUIDELINES.evidence.items.map((item) => (
                    <li key={item}>
                      <span className={styles.checkIcon} aria-hidden="true">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>
              <article className={styles.guidelineCard}>
                <div className={styles.guidelineCardHeader}>
                  <span className={`${styles.guidelineIcon} ${styles.guidelineIconWarm}`} aria-hidden="true">◆</span>
                  <h3 className={styles.guidelineTitle}>
                    {CONTENT_GUIDELINES.conflict.title}
                  </h3>
                </div>
                <p className={styles.guidelineBody}>
                  {CONTENT_GUIDELINES.conflict.body}
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* Product selection */}
        <section className={styles.section}>
          <div className={styles.container}>
            <div className={styles.sectionHeader}>
              <SectionLabel>{PRODUCT_SELECTION.eyebrow}</SectionLabel>
              <h2 className={styles.sectionHeading}>{PRODUCT_SELECTION.heading}</h2>
            </div>
            <div className={styles.selectionGrid}>
              {PRODUCT_SELECTION.boxes.map((box) => (
                <article
                  key={box.title}
                  className={`${styles.selectionBox} ${
                    box.variant === "warm" ? styles.selectionWarm : styles.selectionCool
                  }`}
                >
                  <span className={styles.selectionIndex} aria-hidden="true">
                    {box.variant === "warm" ? "01" : "02"}
                  </span>
                  <h3 className={styles.selectionTitle}>{box.title}</h3>
                  <p className={styles.selectionBody}>{box.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* What we look for */}
        <section className={`${styles.section} ${styles.sectionSoft}`}>
          <div className={styles.container}>
            <div className={styles.sectionHeader}>
              <SectionLabel>{WHAT_WE_LOOK_FOR.eyebrow}</SectionLabel>
              <h2 className={styles.sectionHeading}>{WHAT_WE_LOOK_FOR.heading}</h2>
            </div>
            <div className={styles.pillarRow}>
              {WHAT_WE_LOOK_FOR.pillars.map((p) => (
                <div key={p.label} className={styles.pillarCard}>
                  <span className={styles.pillarIconWrap} aria-hidden="true">{p.icon}</span>
                  <span className={styles.pillarLabel}>{p.label}</span>
                </div>
              ))}
            </div>
            <article className={styles.criteriaCard}>
              <h3 className={styles.criteriaTitle}>Our better-choice criteria</h3>
              <ol className={styles.criteriaList}>
                {WHAT_WE_LOOK_FOR.criteria.map((item, i) => (
                  <li key={item}>
                    <span className={styles.criteriaNum}>{i + 1}</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ol>
            </article>
          </div>
        </section>

        {/* Partners */}
        <section className={styles.section}>
          <div className={styles.container}>
            <div className={styles.sectionHeader}>
              <SectionLabel>{PARTNER_AFFILIATES.eyebrow}</SectionLabel>
              <h2 className={styles.sectionHeading}>{PARTNER_AFFILIATES.heading}</h2>
              <p className={styles.sectionLead}>{PARTNER_AFFILIATES.lead}</p>
            </div>
            <div className={styles.partnerGrid}>
              {PARTNER_AFFILIATES.partners.map((p, i) => (
                <article key={p.title} className={styles.partnerCard}>
                  <span className={styles.partnerNum}>{String(i + 1).padStart(2, "0")}</span>
                  <span className={styles.partnerIcon} aria-hidden="true">{p.icon}</span>
                  <h3 className={styles.partnerTitle}>{p.title}</h3>
                  <p className={styles.partnerBody}>{p.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Transparency */}
        <section className={`${styles.section} ${styles.sectionWarm}`}>
          <div className={styles.container}>
            <div className={styles.sectionHeader}>
              <SectionLabel>{TRANSPARENCY.eyebrow}</SectionLabel>
              <h2 className={styles.sectionHeading}>{TRANSPARENCY.heading}</h2>
            </div>
            <article className={styles.transparencyCard}>
              <ol className={styles.transparencyList}>
                {TRANSPARENCY.items.map((item, i) => (
                  <li key={item}>
                    <span className={styles.transparencyNum}>{i + 1}</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ol>
            </article>
          </div>
        </section>

        {/* Policy details */}
        <section className={styles.section}>
          <div className={styles.container}>
            <div className={styles.policyRow}>
              {POLICY_DETAILS.map((item) => (
                <article key={item.title} className={styles.policyCard}>
                  <span className={styles.policyIcon} aria-hidden="true">{item.icon}</span>
                  <div>
                    <h3 className={styles.policyTitle}>{item.title}</h3>
                    <p className={styles.policyBody}>{item.body}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Reporting */}
        <section className={`${styles.section} ${styles.sectionInset}`}>
          <div className={styles.container}>
            <div className={styles.concernShell}>
              <div className={styles.concernIntro}>
                <SectionLabel>{REPORTING_CONCERNS.eyebrow}</SectionLabel>
                <h2 className={styles.sectionHeading}>{REPORTING_CONCERNS.heading}</h2>
                <p className={styles.sectionLeadLeft}>{REPORTING_CONCERNS.lead}</p>
              </div>
              <ul className={styles.concernList}>
                {REPORTING_CONCERNS.items.map((item) => (
                  <li key={item}>
                    <span className={styles.concernIcon} aria-hidden="true">!</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className={styles.ctaBand}>
          <div className={styles.ctaGlow} aria-hidden="true" />
          <div className={styles.ctaInner}>
            <SectionLabel>Get started</SectionLabel>
            <h2 className={styles.ctaHeading}>{CTA_BAND.heading}</h2>
            <p className={styles.ctaBody}>{CTA_BAND.body}</p>
            <a href={CTA_BAND.cta.href} className={styles.ctaBtn}>
              {CTA_BAND.cta.label}
              <span aria-hidden="true">→</span>
            </a>
          </div>
        </section>

        {/* Contact */}
        <section className={styles.contactStrip}>
          <div className={styles.container}>
            <h2 className={styles.contactHeading}>{CONTACT_STRIP.heading}</h2>
            <div className={styles.contactGrid}>
              {CONTACT_STRIP.channels.map((ch) => (
                <a key={ch.label} href={ch.href} className={styles.contactBtn}>
                  <span className={styles.contactIconWrap} aria-hidden="true">{ch.icon}</span>
                  <span className={styles.contactLabel}>{ch.label}</span>
                  <span className={styles.contactValue}>{ch.value}</span>
                </a>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
