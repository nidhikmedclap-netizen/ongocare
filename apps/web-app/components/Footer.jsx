"use client";

import { useState } from "react";
import styles from "./Footer.module.css";
import BrandLogo from "@/components/BrandLogo";
import { DEFAULT_LOGO } from "@/lib/branding/defaults";
import { WEGOVY_PAGE } from "@/lib/medications/pages";

const defaultBranding = {
  ...DEFAULT_LOGO,
  logoText: "OngoWeightLoss",
  shortName: "Ongo",
  tagline:
    "Doctor-led GLP-1 weight loss, designed around your health and your schedule.",
  email: "info@ongoweightloss.com",
  phone: "+1 (888) 655-5267",
  phoneHref: "tel:+18886555267",
  copyrightName: "Ongo Weight Loss",
  disclaimerLead: "Medical disclaimer:",
  disclaimerBody:
    " Ongo Weight Loss provides access to licensed medical providers. GLP-1 medications require a physician evaluation and prescriptions are issued only when medically appropriate, in alignment with FDA guidelines. Individual results vary. This site does not provide medical advice and is not a substitute for professional care.",
  newsletterEyebrow: "Stay in the loop",
  newsletterHeading: "Tips, member stories & new programs",
  newsletterCopy: "One short email a month. No spam, unsubscribe anytime.",
  social: {
    instagram: "https://www.instagram.com/ongoweightloss/",
    youtube: "https://www.youtube.com/@ongoweightlossusa",
    yelp: "https://www.yelp.com/biz/ongo-weight-loss-new-york/",
  },
};

const PROGRAM_LINKS = [
  { label: "How It Works", href: "#how-it-works" },
  { label: "GLP-1 Plans", href: "#plans" },
  { label: "Compare Medications", href: "/comparison" },
  { label: "Blog", href: "/blog" },
  { label: "Wegovy", href: WEGOVY_PAGE },
  { label: "Pricing", href: "#pricing" },
  { label: "About GLP-1", href: "#glpeducation" },
  { label: "Reviews", href: "#reviews" },
  { label: "FAQ", href: "#faq" },
];

const FORYOU_LINKS = [
  { label: "BMI Calculator", href: "#bmi" },
  { label: "Build My Plan", href: "#plans" },
  { label: "Start Evaluation", href: "/weightloss-onboard" },
];

const defaultCompanyLinks = (b) => [
  { label: "Our Doctors", href: "#doctors" },
  { label: "Contact Us", href: `mailto:${b.email}` },
  { label: `Why ${b.shortName}`, href: "#why-us" },
];

const LEGAL_LINKS = [
  { label: "Privacy", href: "/privacy" },
  { label: "Refund", href: "/refund" },
  { label: "Shipping", href: "/shipping" },
  { label: "Terms", href: "/terms" },
  { label: "Medical Disclaimer", href: "/medical-disclaimer" },
  { label: "Editorial", href: "/editorial" },
  { label: "HIPAA", href: "/hipaa" },
  { label: "Privacy Practices", href: "/privacy-practices" },
  { label: "California Privacy", href: "/california-privacy" },
  { label: "Bill of Rights", href: "/bill-of-rights" },
];

export default function Footer({ branding, basePath = "/" }) {
  const b = {
    ...defaultBranding,
    ...(branding || {}),
    social: { ...defaultBranding.social, ...(branding?.social || {}) },
  };

  const COMPANY_LINKS = defaultCompanyLinks(b);

  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  function handleSubscribe(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
    setEmail("");
    window.setTimeout(() => setSubscribed(false), 4000);
  }

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        {/* TOP — brand + newsletter */}
        <div className={styles.top}>
          <div className={styles.brand}>
            <a href={basePath} className={styles.logo} aria-label={b.logoAlt}>
              <BrandLogo
                branding={b}
                className={styles.logoMark}
                imageClassName={styles.logoImg}
              />
            </a>
            <p className={styles.tagline}>
              {b.tagline}
            </p>

            <div className={styles.contactRow}>
              <a
                className={styles.contactLink}
                href={`mailto:${b.email}`}
              >
                <span className={styles.contactIcon} aria-hidden="true">✉</span>
                {b.email}
              </a>
              <a className={styles.contactLink} href={b.phoneHref}>
                <span className={styles.contactIcon} aria-hidden="true">☎</span>
                {b.phone}
              </a>
            </div>
          </div>

          <div className={styles.newsletter}>
            <span className={styles.newsletterEyebrow}>{b.newsletterEyebrow}</span>
            <h3 className={styles.newsletterHeading}>
              {b.newsletterHeading}
            </h3>
            <p className={styles.newsletterCopy}>
              {b.newsletterCopy}
            </p>

            <form className={styles.newsletterForm} onSubmit={handleSubscribe}>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.newsletterInput}
                aria-label="Email address"
              />
              <button type="submit" className={styles.newsletterBtn}>
                Subscribe
              </button>
            </form>
            {subscribed && (
              <p className={styles.newsletterSuccess} role="status">
                ✓ You&apos;re on the list. Check your inbox.
              </p>
            )}
          </div>
        </div>

        {/* MIDDLE — link columns */}
        <div className={styles.linkGrid}>
          <div className={styles.linkCol}>
            <h4 className={styles.colHeading}>Program</h4>
            <ul className={styles.linkList}>
              {PROGRAM_LINKS.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className={styles.link}>
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.linkCol}>
            <h4 className={styles.colHeading}>For You</h4>
            <ul className={styles.linkList}>
              {FORYOU_LINKS.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className={styles.link}>
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.linkCol}>
            <h4 className={styles.colHeading}>Company</h4>
            <ul className={styles.linkList}>
              {COMPANY_LINKS.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className={styles.link}>
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.linkCol}>
            <h4 className={styles.colHeading}>Legal</h4>
            <ul className={styles.linkList}>
              {LEGAL_LINKS.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className={styles.link}>
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* DISCLAIMER */}
        <div className={styles.disclaimer}>
          <p>
            <strong>{b.disclaimerLead}</strong>{b.disclaimerBody}
          </p>
        </div>

        {/* BOTTOM — copyright + socials + legal stripe */}
        <div className={styles.bottom}>
          <p className={styles.copyright}>
            © {new Date().getFullYear()} {b.copyrightName}. All rights reserved.
          </p>

          <div className={styles.socialRow}>
            <a
              className={`${styles.socialBtn} ${styles.socialInstagram}`}
              href={b.social.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                <path d="M12 2.2c3.2 0 3.584.012 4.85.07 1.366.062 2.633.336 3.608 1.311.975.975 1.249 2.242 1.311 3.608.058 1.266.07 1.65.07 4.85s-.012 3.584-.07 4.85c-.062 1.366-.336 2.633-1.311 3.608-.975.975-2.242 1.249-3.608 1.311-1.266.058-1.65.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.062-2.633-.336-3.608-1.311-.975-.975-1.249-2.242-1.311-3.608C2.212 15.584 2.2 15.2 2.2 12s.012-3.584.07-4.85c.062-1.366.336-2.633 1.311-3.608.975-.975 2.242-1.249 3.608-1.311C8.416 2.212 8.8 2.2 12 2.2zm0 3.063A4.935 4.935 0 1 1 12 16.935 4.935 4.935 0 0 1 12 7.065zm0 8.135A3.2 3.2 0 1 0 12 8.8a3.2 3.2 0 0 0 0 6.4zm6.27-8.34a1.152 1.152 0 1 1-2.304 0 1.152 1.152 0 0 1 2.304 0z" />
              </svg>
            </a>
            <a
              className={`${styles.socialBtn} ${styles.socialYoutube}`}
              href={b.social.youtube}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="YouTube"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
            </a>
            <a
              className={`${styles.socialBtn} ${styles.socialYelp}`}
              href={b.social.yelp}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Yelp"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                <path d="M20.16 12.594l-1.89-.612c-1.518-.486-2.484.18-2.484.18-.378.234-.36.72-.36.72l.018 4.86s.054.504.378.702c.378.234.846 0 .846 0l3.708-2.916s.36-.27.378-.738c.018-.396-.252-.81-.594-.972zM14.166 9.81c.486.612 1.404.072 1.404.072L19.692 7.5s.414-.27.45-.738c.054-.378-.234-.864-.234-.864-.234-.396-2.808-3.078-3.69-3.762-.378-.288-.792-.198-.792-.198-.486.072-.738.504-.738.504l-2.07 3.564c-.918 1.512-.612 2.376-.612 2.376.144.504.522.81 1.236 1.224.36.198.738.108.738.108zM10.602 11.43c.27-.486.252-1.026.252-1.026.072-1.566-.252-4.842-.504-6.696-.144-.99-.45-1.314-.846-1.476-.594-.234-1.314-.018-1.314-.018-2.124.45-4.554 1.404-6.012 2.358-.504.342-.738.81-.738.81-.27.594.072 1.116.072 1.116l5.526 8.046s.486.738 1.062.738c.45 0 .846-.36 1.296-.756l1.206-3.096zM10.692 14.058l-3.69 2.034s-.414.252-.504.738c-.108.504.198.99.198.99 1.494 2.358 4.05 4.014 4.05 4.014.504.288.972.198.972.198.504-.072.81-.45.81-.45l.27-.252v-6.444s-.018-.378-.36-.612c-.45-.288-.99-.27-.99-.27-.252.018-.756.054-.756.054zM18.864 18.738c-.378-.972-3.708-4.392-3.708-4.392s-.378-.378-.72-.252c-.27.09-.45.252-.594.612-.18.45-.072 4.842-.054 4.95.018.108.054.54.342.756.36.27.954.144.954.144l3.276-.918s.504-.198.612-.522c.108-.36-.108-.378-.108-.378z" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* Decorative blob */}
      <div className={styles.blob} aria-hidden="true" />
    </footer>
  );
}
