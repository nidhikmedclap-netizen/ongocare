import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  HIPAA_META,
  HERO,
  TRUST_STATS,
  COMMITMENT,
  PROMISE,
  USES_SECTION,
  RIGHTS,
  RESPONSIBILITIES,
  CHANGES,
  CONTACT,
} from "@/lib/hipaa/content";
import styles from "./HipaaPage.module.css";

function Eyebrow({ children, light = false }) {
  return (
    <span className={light ? styles.eyebrowLight : styles.eyebrow}>
      <span className={styles.eyebrowDot} aria-hidden="true" />
      {children}
    </span>
  );
}

export default function HipaaPage() {
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
            className={styles.heroImage}
            sizes="100vw"
          />
          <div className={styles.heroOverlay} aria-hidden="true" />
          <div className={styles.heroPattern} aria-hidden="true" />
          <div className={styles.heroShell}>
            <div className={styles.heroTop}>
              <Eyebrow light>{HERO.breadcrumb}</Eyebrow>
              <span className={styles.heroDate}>
                Effective {HIPAA_META.lastUpdated}
              </span>
            </div>
            <h1 className={styles.heroTitle}>
              <span className={styles.heroTitleLead}>{HERO.titleLead}</span>{" "}
              <span className={styles.heroTitleMid}>{HERO.titleMid}</span>
              <br />
              <span className={styles.heroTitleEnd}>{HERO.titleEnd}</span>
            </h1>
            <p className={styles.heroIntro}>{HERO.intro}</p>
            <div className={styles.heroActions}>
              <a href={HERO.primaryCta.href} className={styles.primaryBtn}>
                {HERO.primaryCta.label} →
              </a>
              <a href={HERO.secondaryCta.href} className={styles.secondaryBtn}>
                {HERO.secondaryCta.label}
              </a>
            </div>
          </div>
        </section>

        {/* Trust stats — floating over hero */}
        <div className={styles.statsWrap}>
          <div className={styles.statsGrid}>
            {TRUST_STATS.map((stat) => (
              <div key={stat.label} className={styles.statCard}>
                <span className={styles.statValue}>{stat.value}</span>
                <span className={styles.statLabel}>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Commitment bento */}
        <section className={styles.section}>
          <div className={styles.container}>
            <div className={styles.bentoCommitment}>
              <article className={`${styles.surfaceCard} ${styles.bentoLead}`}>
                <div className={styles.cardTop}>
                  <span className={styles.iconTile} aria-hidden="true">{COMMITMENT.icon}</span>
                  <Eyebrow>Foundation</Eyebrow>
                </div>
                <h2 className={styles.sectionHeadingLeft}>{COMMITMENT.title}</h2>
                <p className={styles.bodyText}>{COMMITMENT.body}</p>
              </article>
              <article className={`${styles.surfaceCard} ${styles.bentoSupport}`}>
                <div className={styles.cardTop}>
                  <span className={styles.iconTile} aria-hidden="true">{PROMISE.icon}</span>
                  <Eyebrow>Protection</Eyebrow>
                </div>
                <h2 className={styles.sectionHeadingLeft}>{PROMISE.title}</h2>
                <p className={styles.bodyText}>{PROMISE.body}</p>
                <div className={styles.miniShield} aria-hidden="true">
                  <Image
                    src="/images/hippa.webp"
                    alt=""
                    width={40}
                    height={40}
                    className={styles.miniShieldImg}
                  />
                  <span>Enterprise-grade safeguards</span>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* Uses — asymmetric bento */}
        <section className={`${styles.section} ${styles.sectionAlt}`}>
          <div className={styles.container}>
            <div className={styles.usesLayout}>
              <aside className={styles.usesAside}>
                <Eyebrow>Disclosure</Eyebrow>
                <h2 className={styles.sectionHeadingLeft}>{USES_SECTION.title}</h2>
                <p className={styles.bodyText}>{USES_SECTION.lead}</p>
                <div className={styles.asideNote}>
                  <p>{USES_SECTION.otherUses}</p>
                </div>
              </aside>
              <div className={styles.bentoUses}>
                {USES_SECTION.categories.map((cat, i) => (
                  <article
                    key={cat.title}
                    className={`${styles.useTile} ${i === 0 ? styles.useTileFeatured : ""}`}
                  >
                    <div className={styles.useTileHead}>
                      <span className={styles.useTileIcon} aria-hidden="true">{cat.icon}</span>
                      <span className={styles.useTileIndex}>
                        {String(i + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <h3 className={styles.useTileTitle}>{cat.title}</h3>
                    <p className={styles.useTileBody}>{cat.body}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Rights — split layout */}
        <section className={styles.section}>
          <div className={styles.container}>
            <div className={styles.rightsLayout}>
              <aside className={styles.rightsAside}>
                <Eyebrow>Your rights</Eyebrow>
                <h2 className={styles.sectionHeadingLeft}>{RIGHTS.title}</h2>
                <p className={styles.bodyText}>{RIGHTS.lead}</p>
                <div className={styles.rightsActionCard}>
                  <p className={styles.rightsActionLead}>Exercise your rights</p>
                  <p className={styles.rightsActionBody}>{RIGHTS.exercise}</p>
                  <a href={`mailto:${CONTACT.email}`} className={styles.primaryBtn}>
                    Contact privacy team →
                  </a>
                </div>
                <p className={styles.rightsComplaint}>{RIGHTS.complaint}</p>
              </aside>
              <ul className={styles.rightsGrid}>
                {RIGHTS.items.map((item, i) => (
                  <li key={item.title} className={styles.rightsTile}>
                    <span className={styles.rightsNum}>{i + 1}</span>
                    <div>
                      <h3 className={styles.rightsTileTitle}>{item.title}</h3>
                      <p className={styles.rightsTileBody}>{item.body}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Responsibilities + changes */}
        <section className={`${styles.section} ${styles.sectionSoft}`}>
          <div className={styles.container}>
            <div className={styles.duoGrid}>
              <article className={styles.surfaceCard}>
                <div className={styles.cardTop}>
                  <span className={styles.iconTile} aria-hidden="true">{RESPONSIBILITIES.icon}</span>
                  <Eyebrow>Legal duties</Eyebrow>
                </div>
                <h2 className={styles.sectionHeadingLeft}>{RESPONSIBILITIES.title}</h2>
                <ul className={styles.dutyList}>
                  {RESPONSIBILITIES.items.map((item) => (
                    <li key={item}>
                      <span className={styles.dutyCheck} aria-hidden="true">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
              <article className={`${styles.surfaceCard} ${styles.changesCard}`}>
                <Eyebrow>Updates</Eyebrow>
                <h2 className={styles.sectionHeadingLeft}>{CHANGES.title}</h2>
                <p className={styles.bodyText}>{CHANGES.body}</p>
                <a href="/privacy" className={styles.textLink}>
                  Read our Privacy Policy →
                </a>
              </article>
            </div>
          </div>
        </section>

        {/* Conversion CTA */}
        <section className={styles.ctaSection}>
          <div className={styles.ctaGlow} aria-hidden="true" />
          <div className={styles.ctaShell}>
            <div className={styles.ctaCopy}>
              <Eyebrow light>Ready when you are</Eyebrow>
              <h2 className={styles.ctaHeading}>
                Your health data deserves{" "}
                <span className={styles.headingAccent}>the same care</span> you do
              </h2>
              <p className={styles.ctaBody}>
                Start a confidential evaluation with licensed clinicians on our
                HIPAA-compliant platform — no commitment required.
              </p>
            </div>
            <div className={styles.ctaActions}>
              <a href="/weightloss-onboard" className={styles.primaryBtn}>
                Get started — it&apos;s free →
              </a>
              <a href={CONTACT.phoneHref} className={styles.secondaryBtnLight}>
                {CONTACT.phone}
              </a>
            </div>
          </div>
        </section>

        {/* Contact strip */}
        <section className={styles.contactStrip}>
          <div className={styles.container}>
            <div className={styles.contactRow}>
              <div>
                <h2 className={styles.contactTitle}>{CONTACT.title}</h2>
                <p className={styles.contactOrg}>{CONTACT.org}</p>
              </div>
              <div className={styles.contactLinks}>
                <a href={`mailto:${CONTACT.email}`} className={styles.contactChip}>
                  <span aria-hidden="true">✉</span>
                  {CONTACT.email}
                </a>
                <a href={CONTACT.phoneHref} className={styles.contactChip}>
                  <span aria-hidden="true">☎</span>
                  {CONTACT.phone}
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
