import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DoctorsConstellation from "./DoctorsConstellation";
import styles from "./About.module.css";
import { WEGOVY_PAGE } from "@/lib/medications/pages";

export const metadata = {
  title: "About Us — Ongo Weight Loss",
  description:
    "Doctor-led, science-backed GLP-1 weight loss care delivered through secure same-day telehealth visits.",
};

const SUB_NAV = [
  { href: "/about", label: "About us", active: true },
  { href: "/about/how-it-works", label: "How it works" },
  { href: "/about/clinical-excellence", label: "Clinical excellence" },
  { href: "/about/innovation", label: "Innovation" },
  { href: "/about/quality-and-safety", label: "Quality & Safety" },
];

const SUB_NAV_SECONDARY = [
  { href: "/contact", label: "Newsroom" },
  { href: "/contact", label: "Investors" },
];

const HERO_STATS = [
  { value: "4,000+", label: "Patients Trust Ongo" },
  { value: "Same-Day", label: "Virtual Consultations" },
  { value: "FDA-Approved", label: "GLP-1 Medications" },
];

const HOW_IT_WORKS_VIDEOS = [
  {
    src: "/images/ozmepic-inj.mp4",
    title: "Ozempic, demystified",
    caption: "A licensed clinician walks through what to expect.",
  },
  {
    src: "/images/wegovy-inj.mp4",
    title: "Wegovy, in motion",
    caption: "From evaluation to your first dose.",
    href: WEGOVY_PAGE,
  },
  {
    src: "/images/zepbound-inj.mp4",
    title: "Zepbound up close",
    caption: "How GLP-1 therapy fits real lives.",
  },
];

const CORE_PRINCIPLES = [
  "Detailed health evaluation by licensed doctors",
  "Continuous support and monitoring",
  "Backed by scientifically proven studies",
];

const WHY_CHOOSE = [
  {
    icon: "💻",
    title: "Personalized care plans",
    body: "No waiting rooms, no generic plans. Connect with a licensed provider for a same-day virtual consultation built around your body and goals.",
  },
  {
    icon: "🩺",
    title: "Licensed medical professionals",
    body: "Board-certified physicians review every case. Prescriptions are issued only when clinically appropriate — never one-size-fits-all.",
  },
  {
    icon: "🌐",
    title: "Convenient online access",
    body: "Care from the couch. Secure telehealth visits, follow-ups, and messaging — all without ever sitting in a waiting room.",
  },
  {
    icon: "📦",
    title: "Discreet & fast delivery",
    body: "If prescribed, medication ships from a licensed U.S. pharmacy in plain, discreet packaging — typically within 3–5 business days.",
  },
  {
    icon: "💚",
    title: "Ongoing support & monitoring",
    body: "We don't disappear after delivery. Your care team checks in, adjusts your plan, and is available 24/7 when questions come up.",
  },
  {
    icon: "✅",
    title: "FDA-approved GLP-1 options",
    body: "When clinically appropriate, your provider can prescribe FDA-approved GLP-1 medications such as Ozempic, Wegovy, and Zepbound — sourced through licensed channels.",
  },
  {
    icon: "🏥",
    title: "Pharmacy-handled dispensing",
    body: "Every prescription is filled by a licensed U.S. pharmacy that manages secure storage, cold-chain shipping, and refill coordination on your behalf.",
  },
  {
    icon: "🔬",
    title: "Weight-loss specialist evaluations",
    body: "Your case is reviewed by clinicians with focused experience in obesity medicine and metabolic health — not a generalist running a questionnaire.",
  },
  {
    icon: "🕒",
    title: "24/7 messaging access",
    body: "Side effect questions at 11pm? Dose adjustment between visits? Your Care Team is reachable around the clock through secure in-app messaging.",
  },
  {
    icon: "💸",
    title: "Transparent, flat pricing",
    body: "One clear monthly cost. No hidden visit fees, no surprise add-ons, no upsells — you always know exactly what your care includes.",
  },
];

const STEPS = [
  {
    n: "Step 1",
    title: "Schedule a Free Visit",
    body: "A member of our care team connects with you to understand your health goals and medication preferences, including FDA-approved options and, when appropriate, compounded medications.",
  },
  {
    n: "Step 2",
    title: "Connect With a Licensed Doctor",
    body: "Speak with a licensed clinician who evaluates key factors like BMI, medical history, and health goals through a secure video or audio consultation.",
  },
  {
    n: "Step 3",
    title: "Receive a Prescription if Appropriate",
    body: "If clinically appropriate, your provider issues a prescription based on your personalized plan and guides you on next steps, including pharmacy options or home delivery coordination.",
  },
];

const VALUES = [
  {
    icon: "🤝",
    title: "Patient First",
    body: "Every decision is made for better outcomes — clinical, emotional, and practical. Your experience drives every product choice we make.",
  },
  {
    icon: "🔍",
    title: "Transparency",
    body: "Clear pricing. Honest guidance. No hidden fees, no surprise add-ons. You always know what care costs and why it's recommended.",
  },
  {
    icon: "🚀",
    title: "Innovation",
    body: "Modern solutions for modern problems. We combine clinical rigor with thoughtful technology to make care faster, kinder, and smarter.",
  },
  {
    icon: "💚",
    title: "Care & Support",
    body: "Continuous patient support — before, during, and long after your first dose. Real humans, available when life happens.",
  },
];

const DOCTORS = [
  {
    name: "Dr. Miller",
    credentials: "Licensed physician",
    image: "/images/johnathan-miller.webp",
    bio: "A licensed physician providing physician-guided weight loss and metabolic health consultations aligned with established clinical standards. Earned his medical degree from Columbia University with postgraduate training at Washington University in St. Louis.",
    npi: "1235623372",
  },
  {
    name: "Dr. Niles",
    credentials: "R.N., M.D., F.A.C.O.G. · Board-certified physician",
    image: "/images/Dr-vanessa-niles.webp",
    bio: "A licensed physician with over 30 years of clinical experience. Provides physician-guided weight loss consultations focused on individualized medical assessment and patient-centered care.",
    npi: "1922199470",
  },
  {
    name: "Dr. Krasne",
    credentials: "M.D. · Licensed physician",
    image: "/images/dr-krasne .webp",
    bio: "Board-certified and licensed, Dr. Krasne completed medical training at the University of Florida and the University of Miami Miller School of Medicine, with residency completed in 2017.",
    npi: "1306189832",
  },
  {
    name: "Dr. Bugailiskis",
    credentials: "MD · Board-certified physician",
    image: "/images/cheryl-bugailiskis.webp",
    bio: "A licensed physician focused on individualized treatment planning. Earned her medical degree from the University of Illinois at Chicago and evaluates patients based on their health history, goals, and clinical needs.",
    npi: "1871882035",
  },
];

const DEEP_PAGES = [
  { href: "/about/how-it-works", label: "How it works" },
  { href: "/about/clinical-excellence", label: "Clinical excellence" },
  { href: "/about/innovation", label: "Innovation" },
  { href: "/about/quality-and-safety", label: "Quality & Safety" },
  { href: "/contact", label: "Newsroom", external: true },
  { href: "/contact", label: "Investors", external: true },
];

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className={styles.page}>
        {/* ============================================
            HERO — Hims-style massive title + sub-nav
            ============================================ */}
        <section className={styles.hero} id="about">
          <div className={styles.heroInner}>
            <span className={styles.heroBadge}>Experience the power of</span>

            <div className={styles.heroStage}>
              {/* Desktop — rotating circle, top half clipped */}
              <div className={styles.heroCurveClip} aria-hidden="true">
                <svg
                  className={styles.heroCurve}
                  viewBox="0 0 800 800"
                >
                  <defs>
                    <path
                      id="aboutHeroArc"
                      d="M 400,400 m -340,0 a 340,340 0 1,1 680,0 a 340,340 0 1,1 -680,0"
                    />
                  </defs>
                  <text className={styles.heroCurveText}>
                    <textPath href="#aboutHeroArc" startOffset="0">
                      Better Health · Better Care · Better You · Better Health · Better Care · Better You · Better Health · Better Care · Better You ·
                    </textPath>
                  </text>
                </svg>
              </div>

              <div className={styles.heroPortraitWrap}>
                <Image
                  src="/images/about-bg.png"
                  alt="Smiling person enjoying a confident moment"
                  fill
                  sizes="(max-width: 600px) 78vw, 360px"
                  priority
                  className={styles.heroPortrait}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ============================================
            INTRO — slides up over the sticky hero.
            Holds the heading, subcopy, CTAs, and stat strip.
            ============================================ */}
        <section className={styles.introSection}>
          <div className={styles.introInner}>
            <h1 className={styles.heroHeading}>
              <span className={styles.heroHeadingAccent}>Better health</span>
              <br />
              for a better you
            </h1>

            <p className={styles.heroSubcopy}>
              Doctor-led GLP-1 weight loss programs — built around your body,
              your goals, and your life. Telehealth-first, evidence-backed,
              never one-size-fits-all.
            </p>

            <div className={styles.heroCtas}>
              <a href="/weightloss-onboard" className={styles.primaryBtn}>
                Start My Free Evaluation →
              </a>
              <a href="/contact" className={styles.secondaryBtn}>
                Talk to our team
              </a>
            </div>

            <div className={styles.statStrip}>
              {HERO_STATS.map((s) => (
                <div key={s.label} className={styles.statItem}>
                  <span className={styles.statValue}>{s.value}</span>
                  <span className={styles.statLabel}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================
            EDITORIAL STATEMENT — "Your health is personal."
            Hims-style massive heading + highlight-on-faded body
            ============================================ */}
        <section className={styles.editorialSection}>
          <div className={styles.editorialInner}>
            <h2 className={styles.editorialHeading}>
              Your health is personal.
              <br />
              Now, so is your care.
            </h2>
            <p className={styles.editorialBody}>
              <span className={styles.editorialFaded}>
                Whether you&apos;re looking for an{" "}
              </span>
              <span className={styles.editorialAccent}>innovative</span>
              <span className={styles.editorialFaded}>
                {" "}treatment or a tried-and-true generic option, Ongo connects
                you with a{" "}
              </span>
              <span className={styles.editorialBright}>
                licensed medical provider
              </span>
              <span className={styles.editorialFaded}>
                {" "}in your state to assess your{" "}
              </span>
              <span className={styles.editorialBright}>
                symptoms and health history
              </span>
              <span className={styles.editorialFaded}>
                {" "}on a 1-to-1 basis to determine what is right for you. Your
                provider recommends a{" "}
              </span>
              <span className={styles.editorialAccentWarm}>
                personalized treatment plan
              </span>
              <span className={styles.editorialFaded}>
                {" "}based on your unique needs and goals. This customer-centric
                approach doesn&apos;t stop at delivery — through the Ongo app
                you can{" "}
              </span>
              <span className={styles.editorialBright}>
                message your Care Team 24/7
              </span>
              <span className={styles.editorialFaded}>
                {" "}at no additional cost.
              </span>
            </p>
          </div>
        </section>

        {/* ============================================
            HOW IT WORKS — videos
            ============================================ */}
        <section className={styles.videoSection}>
          <div className={styles.sectionContainer}>
            <header className={styles.sectionHeader}>
              <p className={styles.eyebrow}>HOW IT WORKS</p>
              <h2 className={styles.sectionHeading}>
                See Ongo{" "}
                <span className={styles.headingAccent}>in motion</span>
              </h2>
              <p className={styles.sectionLead}>
                Real GLP-1 medications, real telehealth visits — a short look
                at the experience our patients receive.
              </p>
            </header>

            <div className={styles.videoGrid}>
              {HOW_IT_WORKS_VIDEOS.map((v) => {
                const card = (
                  <>
                    <div className={styles.videoWrap}>
                      <video
                        className={styles.video}
                        src={v.src}
                        autoPlay
                        loop
                        muted
                        playsInline
                        preload="metadata"
                      />
                    </div>
                    <h3 className={styles.videoTitle}>{v.title}</h3>
                    <p className={styles.videoCaption}>{v.caption}</p>
                  </>
                );

                return v.href ? (
                  <a
                    key={v.title}
                    href={v.href}
                    className={`${styles.videoCard} ${styles.videoCardLink}`}
                  >
                    {card}
                  </a>
                ) : (
                  <article key={v.title} className={styles.videoCard}>
                    {card}
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* ============================================
            BIG STAT / TESTIMONIAL CARDS — Hims-style
            ============================================ */}
        <section className={styles.statCardsSection}>
          <div className={styles.statCardsGrid}>
            <article className={styles.statCard}>
              <p className={styles.statCardBig}>
                &ldquo;Out of 5 stars, I&apos;d give Ongo 6.&rdquo;
              </p>
              <div className={styles.statCardFooter}>
                <span className={styles.statCardName}>— Brandon, 44</span>
                <span className={styles.statCardRole}>Real Ongo patient</span>
              </div>
            </article>

            <article className={styles.statCard}>
              <p className={styles.statCardNumber}>4,000+*</p>
              <p className={styles.statCardSmall}>active patients</p>
              <div className={styles.statCardFooter}>
                <span className={styles.statCardRole}>
                  *Patients currently enrolled in an Ongo GLP-1 plan as of this
                  quarter.
                </span>
              </div>
            </article>

            <article className={styles.statCard}>
              <p className={styles.statCardBig}>
                &ldquo;Ongo has changed my life for the better.&rdquo;
              </p>
              <div className={styles.statCardFooter}>
                <span className={styles.statCardName}>— Stephanie, 32</span>
                <span className={styles.statCardRole}>Real Ongo patient</span>
              </div>
            </article>
          </div>
        </section>

        {/* ============================================
            FOUNDER QUOTE
            ============================================ */}
        <section className={styles.founderSection}>
          <div className={styles.founderInner}>
            <p className={styles.eyebrow}>A MESSAGE FROM OUR FOUNDER</p>
            <h2 className={styles.sectionHeading}>
              The problem that{" "}
              <span className={styles.headingAccent}>sparked our idea</span>
            </h2>

            <div className={styles.founderGrid}>
              <blockquote className={styles.quote}>
                <span className={styles.quoteMark} aria-hidden="true">
                  “
                </span>
                <p>
                  For many years, there was a gap between healthcare services
                  and real patient needs. People waited long hours to see a
                  doctor, while others struggled just to get to the clinic.
                </p>
                <p>
                  Patients told us they avoided going out or socializing due to
                  low confidence, mobility issues, or fear of being judged —
                  which made it even harder to seek the care they truly needed.
                </p>
                <p>
                  We started Ongo to act as a bridge between patients and
                  doctors, offering a virtual platform where you can achieve
                  your weight-loss goals comfortably at home.
                </p>
              </blockquote>

              <div className={styles.founderImageCard}>
                <div className={styles.founderImageWrap}>
                  <Image
                    src="/images/deep.webp"
                    alt="Deep Chand Sharma, Founder & CEO of Ongo Weight Loss"
                    fill
                    sizes="(max-width: 768px) 90vw, 420px"
                    className={styles.founderImage}
                  />
                </div>
                <div className={styles.founderImageMeta}>
                  <p className={styles.founderName}>Deep Chand Sharma</p>
                  <p className={styles.founderTitle}>
                    Founder &amp; CEO, Ongo Weight Loss
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================
            WHY CHOOSE US
            ============================================ */}
        <section className={styles.section}>
          <div className={styles.sectionContainer}>
            <header className={styles.sectionHeader}>
              <p className={styles.eyebrow}>WHY ONGO</p>
              <h2 className={styles.sectionHeading}>
                Why thousands choose{" "}
                <span className={styles.headingAccent}>Ongo Weight Loss</span>
              </h2>
              <p className={styles.sectionLead}>
                A pioneering approach to healthcare — convenient, personalized,
                and designed for long-term, healthier habits.
              </p>
            </header>

            <div className={styles.cardGrid}>
              {WHY_CHOOSE.map((c) => (
                <article key={c.title} className={styles.featureCard}>
                  <span className={styles.featureIcon} aria-hidden="true">
                    {c.icon}
                  </span>
                  <h3 className={styles.featureTitle}>{c.title}</h3>
                  <p className={styles.featureBody}>{c.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================
            MISSION
            ============================================ */}
        <section className={styles.missionSection}>
          <div className={styles.sectionTwoCol}>
            <div className={styles.colCopy}>
              <p className={styles.eyebrow}>OUR MISSION</p>
              <h2 className={styles.sectionHeading}>
                Healthier lives,{" "}
                <span className={styles.headingAccent}>
                  effective weight loss solutions
                </span>
              </h2>
              <p className={styles.sectionLead}>
                We aim to make healthcare more accessible, transparent, and
                patient-focused. By combining technology with medical expertise,
                we're redefining how people experience care.
              </p>
            </div>

            <div className={styles.principlesCard}>
              <span className={styles.principlesLabel}>Our core principles</span>
              <ul className={styles.principlesList}>
                {CORE_PRINCIPLES.map((p) => (
                  <li key={p} className={styles.principleItem}>
                    <span className={styles.principleCheck} aria-hidden="true">
                      ✓
                    </span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ============================================
            CORE VALUES
            ============================================ */}
        <section className={styles.section}>
          <div className={styles.sectionContainer}>
            <header className={styles.sectionHeader}>
              <p className={styles.eyebrow}>OUR CORE VALUES</p>
              <h2 className={styles.sectionHeading}>
                Building emotional trust{" "}
                <span className={styles.headingAccent}>&amp; brand identity</span>
              </h2>
              <p className={styles.sectionLead}>
                Four values shape every decision we make — from how we hire
                clinicians to how we design your follow-up.
              </p>
            </header>

            <div className={styles.valuesGrid}>
              {VALUES.map((v) => (
                <article key={v.title} className={styles.valueCard}>
                  <span className={styles.valueIcon} aria-hidden="true">
                    {v.icon}
                  </span>
                  <h3 className={styles.valueTitle}>{v.title}</h3>
                  <p className={styles.valueBody}>{v.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================
            STEPS
            ============================================ */}
        <section className={styles.stepsSection} id="how-it-works">
          <div className={styles.sectionContainer}>
            <header className={styles.sectionHeader}>
              <p className={styles.eyebrow}>HOW IT WORKS</p>
              <h2 className={styles.sectionHeading}>
                Steps to your{" "}
                <span className={styles.headingAccent}>weight loss journey</span>
              </h2>
            </header>

            <ol className={styles.stepsGrid}>
              {STEPS.map((s, i) => (
                <li key={s.title} className={styles.stepCard}>
                  <span className={styles.stepBadge}>{s.n}</span>
                  <span className={styles.stepNumber} aria-hidden="true">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className={styles.stepTitle}>{s.title}</h3>
                  <p className={styles.stepBody}>{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ============================================
            DOCTORS — arc preview + grid
            ============================================ */}
        <section className={styles.doctorsSection}>
          <div className={styles.sectionContainer}>
            <header className={styles.sectionHeader}>
              <p className={styles.eyebrow}>OUR CLINICIANS</p>
              <h2 className={styles.sectionHeading}>
                The expertise{" "}
                <span className={styles.headingAccent}>behind our care</span>
              </h2>
              <p className={styles.sectionLead}>
                U.S. board-certified clinicians with interdisciplinary expertise
                — invested in the best patient outcomes.
              </p>
            </header>

            <DoctorsConstellation doctors={DOCTORS} />

            <div className={styles.doctorsCta}>
              <a href="/weightloss-onboard" className={styles.primaryBtn}>
                Book your free consultation →
              </a>
            </div>
          </div>
        </section>

        {/* ============================================
            MORE TO EXPLORE — deep pages
            ============================================ */}
        <section className={styles.exploreSection}>
          <div className={styles.exploreInner}>
            <p className={styles.exploreEyebrow}>More to explore</p>
            <ul className={styles.exploreList}>
              {DEEP_PAGES.map((p) => (
                <li key={p.label}>
                  <a href={p.href} className={styles.exploreLink}>
                    <span>{p.label}</span>
                    {p.external && (
                      <span className={styles.exploreArrow} aria-hidden="true">
                        ↗
                      </span>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ============================================
            CLOSING CTA
            ============================================ */}
        <section className={styles.ctaBanner}>
          <div className={styles.ctaBannerInner}>
            <p className={styles.ctaEyebrow}>YOUR TRUSTED FITNESS PARTNER</p>
            <h2 className={styles.ctaHeading}>
              Connect with us and join{" "}
              <span className={styles.ctaHeadingAccent}>thousands of patients</span>
            </h2>
            <p className={styles.ctaCopy}>
              Embrace your fitness journey with Ongo Weight Loss. Guided by
              licensed providers, step into a healthier and more confident you
              — on a HIPAA-compliant platform aligned with federal and state
              telehealth regulations.
            </p>
            <div className={styles.ctaButtons}>
              <a href="/weightloss-onboard" className={styles.ctaPrimary}>
                Schedule Consultation →
              </a>
              <a href="/contact" className={styles.ctaSecondary}>
                Contact our team
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
