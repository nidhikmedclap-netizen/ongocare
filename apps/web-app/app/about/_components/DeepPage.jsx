import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import styles from "./DeepPage.module.css";

const SUB_NAV = [
  { href: "/about", label: "About us", slug: "about" },
  { href: "/about/how-it-works", label: "How it works", slug: "how-it-works" },
  {
    href: "/about/clinical-excellence",
    label: "Clinical excellence",
    slug: "clinical-excellence",
  },
  { href: "/about/innovation", label: "Innovation", slug: "innovation" },
  {
    href: "/about/quality-and-safety",
    label: "Quality & Safety",
    slug: "quality-and-safety",
  },
];

const SUB_NAV_SECONDARY = [
  { href: "/contact", label: "Newsroom" },
  { href: "/contact", label: "Investors" },
];

const ARC_IMAGES = [
  "/images/johnathan-miller.webp",
  "/images/Dr-vanessa-niles.webp",
  "/images/dr-krasne .webp",
  "/images/cheryl-bugailiskis.webp",
  "/images/johnathan-miller.webp",
];

const ARC_POSITIONS = [
  { left: "8%", top: "78%" },
  { left: "27%", top: "30%" },
  { left: "50%", top: "10%" },
  { left: "73%", top: "30%" },
  { left: "92%", top: "78%" },
];

export default function DeepPage({
  slug,
  eyebrow,
  title,
  titleAccent,
  missionParts,
  pillarsEyebrow,
  pillarsHeading,
  pillarsHeadingAccent,
  pillarsLead,
  pillars,
  listHeading,
  list,
  cta,
}) {
  return (
    <>
      <Header />
      <main className={styles.page}>
        {/* Sub-navigation pill bar */}
        <div className={styles.subNavWrap}>
          <nav className={styles.subNav} aria-label="About sections">
            {SUB_NAV.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className={`${styles.subNavLink} ${
                  item.slug === slug ? styles.subNavActive : ""
                }`}
              >
                {item.label}
              </a>
            ))}
            <span className={styles.subNavDivider} aria-hidden="true" />
            {SUB_NAV_SECONDARY.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className={styles.subNavLink}
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>

        {/* ============================================
            GIANT HERO — stacked title, faded subtitle
            ============================================ */}
        <section className={styles.hero}>
          <div className={styles.heroInner}>
            <nav className={styles.crumbs} aria-label="Breadcrumb">
              <a href="/about" className={styles.crumbLink}>
                About
              </a>
              <span className={styles.crumbSep} aria-hidden="true">
                /
              </span>
              <span>{eyebrow}</span>
            </nav>

            <h1 className={styles.giantTitle}>
              <span>{title}</span>
              <span className={styles.giantTitleAccent}>{titleAccent}</span>
            </h1>
            <p className={styles.giantSubtitle}>every step of the way</p>
          </div>

          {/* Curved arc of avatars */}
          <div className={styles.arcWrap} aria-hidden="true">
            <svg
              className={styles.arcSvg}
              viewBox="0 0 900 350"
              preserveAspectRatio="none"
            >
              <path
                d="M 60,290 Q 450,-30 840,290"
                fill="none"
                stroke="var(--color-theme, var(--color-primary))"
                strokeOpacity="0.35"
                strokeWidth="2"
                strokeDasharray="6 8"
              />
            </svg>
            {ARC_POSITIONS.map((pos, i) => (
              <span
                key={i}
                className={styles.arcAvatar}
                style={{ left: pos.left, top: pos.top }}
              >
                <Image
                  src={ARC_IMAGES[i]}
                  alt=""
                  width={120}
                  height={120}
                  sizes="120px"
                />
              </span>
            ))}
          </div>
        </section>

        {/* ============================================
            COLORED MISSION BLOCK — highlight-on-faded
            ============================================ */}
        <section className={styles.missionBlock}>
          <div className={styles.missionInner}>
            <p className={styles.missionStatement}>
              {missionParts.map((part, i) => (
                <span
                  key={i}
                  className={
                    part.bright ? styles.missionBright : styles.missionFaded
                  }
                >
                  {part.text}
                </span>
              ))}
            </p>
          </div>
        </section>

        {/* ============================================
            PILLARS
            ============================================ */}
        <section className={styles.pillarsSection}>
          <header className={styles.pillarsHeader}>
            <p className={styles.eyebrow}>{pillarsEyebrow}</p>
            <h2 className={styles.sectionHeading}>
              {pillarsHeading}{" "}
              <span className={styles.headingAccent}>
                {pillarsHeadingAccent}
              </span>
            </h2>
            <p className={styles.sectionLead}>{pillarsLead}</p>
          </header>

          <div className={styles.pillarsInner}>
            {pillars.map((p) => (
              <article key={p.title} className={styles.pillarCard}>
                <span className={styles.pillarIcon} aria-hidden="true">
                  {p.icon}
                </span>
                <h3 className={styles.pillarTitle}>{p.title}</h3>
                <p className={styles.pillarBody}>{p.body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ============================================
            CHECK LIST
            ============================================ */}
        <section className={styles.listSection}>
          <div className={styles.listInner}>
            <div className={styles.listHeader}>
              <p className={styles.eyebrow}>What&apos;s included</p>
              <h2 className={styles.listHeading}>{listHeading}</h2>
            </div>
            <ul className={styles.listGrid}>
              {list.map((item) => (
                <li key={item} className={styles.listItem}>
                  <span className={styles.check} aria-hidden="true">
                    ✓
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ============================================
            CTA
            ============================================ */}
        <section className={styles.ctaSection}>
          <div className={styles.ctaInner}>
            <h2 className={styles.ctaHeading}>{cta.heading}</h2>
            <p className={styles.ctaCopy}>{cta.copy}</p>
            <a href={cta.href} className={styles.ctaBtn}>
              {cta.buttonLabel} →
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
