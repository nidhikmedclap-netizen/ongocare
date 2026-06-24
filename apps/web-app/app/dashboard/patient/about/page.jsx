// app/dashboard/patient/about/page.jsx
//
// About Ongo — in-dashboard variant. Animated, motion-rich storytelling about
// who we are, what we believe, and who's caring for you. Respects
// prefers-reduced-motion: animations short-circuit to their final state.

"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePatientDashboardBase } from "../usePatientBase";
import styles from "../dashboard.module.css";
import about from "./about.module.css";

const ROTATING_WORDS = ["life.", "story.", "biology.", "wins.", "schedule."];

const STATS = [
  { value: 4000, suffix: "+", label: "Patients trust Ongo" },
  { value: 24, suffix: "/7", label: "Care team messaging" },
  { value: 98, suffix: "%", label: "Visit satisfaction" },
  { value: 3, suffix: "–5 day", label: "Discreet delivery" },
];

const MARQUEE = [
  "Board-certified physicians",
  "Same-day virtual consultations",
  "FDA-approved GLP-1 options",
  "Real humans, not chatbots",
  "Transparent, flat pricing",
  "Discreet U.S. pharmacy shipping",
  "24/7 care team access",
];

const TIMELINE = [
  {
    year: "2023",
    title: "Ongo begins.",
    body: "A team of clinicians and engineers asks a simple question: why does losing weight medically still feel so cold? Ongo is founded to answer it.",
  },
  {
    year: "2024",
    title: "1,000 patients in.",
    body: "Our first thousand patients prove the model. Same-day visits, real follow-through, board-certified physicians — no gimmicks.",
  },
  {
    year: "2025",
    title: "Always on.",
    body: "Care team messaging goes 24/7. Whatever the question, whatever the hour, a real human responds.",
  },
  {
    year: "Today",
    title: "4,000+ and growing.",
    body: "We're still small enough to know you by name and big enough to back it with rigorous medicine. That's the part we'll never trade.",
  },
];

const VALUES = [
  {
    icon: HeartIcon,
    title: "Patient first",
    body: "Every decision is made for better outcomes — clinical, emotional, and practical. Your experience drives every choice we make.",
    featured: true,
  },
  {
    icon: EyeIcon,
    title: "Transparency",
    body: "Clear pricing, honest guidance, no hidden fees. You always know what your care costs and why it's recommended.",
  },
  {
    icon: SparkIcon,
    title: "Innovation",
    body: "Modern care for modern lives. Clinical rigor meets thoughtful technology so getting better doesn't feel like work.",
  },
  {
    icon: ShieldIcon,
    title: "Care & support",
    body: "Continuous patient support before, during, and long after your first dose. Real humans, available when life happens.",
  },
];

const DOCTORS = [
  {
    name: "Dr. Miller",
    credentials: "Licensed physician",
    image: "/images/johnathan-miller.webp",
    bio: "Provides physician-guided weight loss consultations aligned with established clinical standards. Medical degree from Columbia University.",
  },
  {
    name: "Dr. Niles",
    credentials: "R.N., M.D., F.A.C.O.G.",
    image: "/images/Dr-vanessa-niles.webp",
    bio: "Over 30 years of clinical experience. Focused on individualized medical assessment and patient-centered care.",
  },
  {
    name: "Dr. Krasne",
    credentials: "M.D. · Licensed physician",
    image: "/images/dr-krasne .webp",
    bio: "Board-certified and licensed. Completed medical training at the University of Florida and the Miller School of Medicine.",
  },
  {
    name: "Dr. Bugailiskis",
    credentials: "M.D. · Board-certified",
    image: "/images/cheryl-bugailiskis.webp",
    bio: "Focused on individualized treatment planning. Medical degree from the University of Illinois at Chicago.",
  },
];

export default function PatientAboutPage() {
  const patientBase = usePatientDashboardBase();
  return (
    <>
      {/* ============ HERO ============ */}
      <section className={about.hero}>
        <div className={about.heroGrid} aria-hidden />
        <div className={about.heroOrbA} aria-hidden />
        <div className={about.heroOrbB} aria-hidden />
        <div className={about.heroOrbC} aria-hidden />

        <div className={about.heroInner}>
          <span className={about.heroKicker}>
            <PulseDot /> Live · About Ongo
          </span>

          <h1 className={about.heroTitle}>
            Doctor-led care,
            <br />
            built around your{" "}
            <RotatingWord words={ROTATING_WORDS} />
          </h1>

          <p className={about.heroSubtitle}>
            Ongo is a modern telehealth practice for evidence-based weight
            loss. We pair board-certified physicians with thoughtful
            technology — so getting better feels less like paperwork and more
            like care.
          </p>

          <div className={about.heroStats}>
            {STATS.map((s) => (
              <div key={s.label} className={about.heroStat}>
                <div className={about.heroStatValue}>
                  <CountUp to={s.value} />
                  <span className={about.heroStatSuffix}>{s.suffix}</span>
                </div>
                <div className={about.heroStatLabel}>{s.label}</div>
              </div>
            ))}
          </div>

          <div className={about.heroScrollHint} aria-hidden>
            <span className={about.heroScrollDot} />
            <span>Scroll to explore</span>
          </div>
        </div>
      </section>

      {/* ============ MARQUEE ============ */}
      <div className={about.marquee} aria-hidden>
        <div className={about.marqueeTrack}>
          {[...MARQUEE, ...MARQUEE].map((item, i) => (
            <span key={i} className={about.marqueeItem}>
              <StarIcon />
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ============ MANIFESTO ============ */}
      <section className={about.manifesto}>
        <div className={about.manifestoMark} aria-hidden>
          &ldquo;
        </div>
        <div className={about.manifestoBody}>
          <div className={about.manifestoEyebrow}>The Ongo manifesto</div>
          <p className={about.manifestoQuote}>
            For decades, weight loss was treated as a willpower problem. The
            science says otherwise — and the people fighting it deserve
            medicine, and a care team, that treats them <em>like adults.</em>
          </p>
          <div className={about.manifestoSig}>
            <span className={about.manifestoSigLine} />
            <span>The Ongo Care Team</span>
          </div>
        </div>
      </section>

      {/* ============ TIMELINE ============ */}
      <section style={{ marginTop: 28 }}>
        <div className={about.sectionHeader}>
          <div className={styles.kicker}>Our journey</div>
          <h2 className={about.sectionTitle}>A short, busy history.</h2>
          <p className={about.sectionSubtitle}>
            We're not the biggest care platform — yet — and that's the point.
          </p>
        </div>

        <ol className={about.timeline}>
          {TIMELINE.map((t, i) => (
            <li key={t.year} className={about.timelineItem}>
              <div className={about.timelineMarker}>
                <span className={about.timelineDot} />
                {i < TIMELINE.length - 1 && (
                  <span className={about.timelineLine} aria-hidden />
                )}
              </div>
              <div className={about.timelineContent}>
                <div className={about.timelineYear}>{t.year}</div>
                <div className={about.timelineTitle}>{t.title}</div>
                <p className={about.timelineBody}>{t.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* ============ VALUES ============ */}
      <section style={{ marginTop: 28 }}>
        <div className={about.sectionHeader}>
          <div className={styles.kicker}>What we believe</div>
          <h2 className={about.sectionTitle}>Four ideas we won&apos;t compromise on.</h2>
        </div>

        <div className={about.valuesGrid}>
          {VALUES.map(({ icon: Icon, title, body, featured }) => (
            <article
              key={title}
              className={`${about.valueCard} ${featured ? about.valueCardFeatured : ""}`}
            >
              <div className={about.valueIcon}>
                <Icon />
              </div>
              <h3 className={about.valueTitle}>{title}</h3>
              <p className={about.valueBody}>{body}</p>
              <div className={about.valueGlow} aria-hidden />
            </article>
          ))}
        </div>
      </section>

      {/* ============ CARE TEAM ============ */}
      <section style={{ marginTop: 28 }}>
        <div className={about.sectionHeader}>
          <div className={styles.kicker}>Your care team</div>
          <h2 className={about.sectionTitle}>
            Hover a face. Meet a doctor.
          </h2>
          <p className={about.sectionSubtitle}>
            Every patient is reviewed by a licensed clinician — never an
            algorithm.
          </p>
        </div>

        <div className={about.doctorsGrid}>
          {DOCTORS.map((d) => (
            <article key={d.name} className={about.doctorCard} tabIndex={0}>
              <div className={about.doctorPhotoWrap}>
                <Image
                  src={d.image}
                  alt={d.name}
                  fill
                  sizes="(max-width: 700px) 50vw, 260px"
                  className={about.doctorPhoto}
                />
                <div className={about.doctorOverlay}>
                  <p className={about.doctorBio}>{d.bio}</p>
                </div>
              </div>
              <div className={about.doctorBody}>
                <div className={about.doctorName}>{d.name}</div>
                <div className={about.doctorCreds}>{d.credentials}</div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ============ CONTACT ============ */}
      <section className={about.contactCard}>
        <div className={about.contactPattern} aria-hidden />
        <div className={about.contactInner}>
          <div>
            <div className={styles.kicker} style={{ color: "white", opacity: 0.85 }}>
              Get in touch
            </div>
            <h2 className={about.contactTitle}>
              Questions about your plan or care?
            </h2>
            <p className={about.contactBody}>
              Your care team is reachable 24/7 — for clinical questions, dose
              adjustments, or anything in between.
            </p>
          </div>
          <div className={about.contactActions}>
            <Link
              href={`${patientBase}/appointments`}
              className={about.contactBtnPrimary}
            >
              View appointment <ArrowRight />
            </Link>
            <a
              href="tel:+18885550123"
              className={about.contactBtnGhost}
            >
              <PhoneIcon /> 1 (888) 555-0123
            </a>
          </div>
        </div>
      </section>
    </>
  );
}

/* ─── Animated bits ──────────────────────────────────────────────────── */

function RotatingWord({ words, intervalMs = 2200 }) {
  const [i, setI] = useState(0);
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduce(mq.matches);
    const onChange = () => setReduce(mq.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  useEffect(() => {
    if (reduce) return;
    const t = setInterval(() => {
      setI((p) => (p + 1) % words.length);
    }, intervalMs);
    return () => clearInterval(t);
  }, [words.length, intervalMs, reduce]);

  return (
    <span className={about.rotator}>
      <span key={i} className={about.rotatorWord}>
        {words[i]}
      </span>
    </span>
  );
}

function CountUp({ to, durationMs = 1100 }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduce) {
      setVal(to);
      return;
    }

    const node = ref.current;
    if (!node) return;

    const start = () => {
      if (started.current) return;
      started.current = true;
      const startTs = performance.now();
      const tick = (now) => {
        const t = Math.min(1, (now - startTs) / durationMs);
        // ease-out cubic
        const eased = 1 - Math.pow(1 - t, 3);
        setVal(Math.round(to * eased));
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            start();
            obs.disconnect();
          }
        }
      },
      { threshold: 0.3 },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [to, durationMs]);

  return (
    <span ref={ref}>
      {new Intl.NumberFormat().format(val)}
    </span>
  );
}

/* ─── Icons ──────────────────────────────────────────────────────────── */
function iconProps(size = 22) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };
}

function PulseDot() {
  return (
    <span className={about.pulseDot} aria-hidden>
      <span className={about.pulseDotCore} />
      <span className={about.pulseDotRing} />
    </span>
  );
}

function HeartIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M12 21s-7-4.5-9.5-9A5.5 5.5 0 0112 6a5.5 5.5 0 019.5 6c-2.5 4.5-9.5 9-9.5 9z" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg {...iconProps(12)}>
      <polygon points="12 2 15 9 22 9.5 17 14.5 18.5 22 12 18 5.5 22 7 14.5 2 9.5 9 9" />
    </svg>
  );
}

function ArrowRight() {
  return (
    <svg {...iconProps(14)}>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="13 5 20 12 13 19" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg {...iconProps(16)}>
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.12.96.34 1.9.65 2.81a2 2 0 01-.45 2.11L8 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.31 1.85.53 2.81.65A2 2 0 0122 16.92z" />
    </svg>
  );
}
