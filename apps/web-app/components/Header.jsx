"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./Header.module.css";
import ThemeSwitcher from "./ThemeSwitcher";
import { loginPathForRole } from "@/lib/urls/dashboardPaths";
import { MEDICATION_NAV, WEGOVY_PAGE } from "@/lib/medications/pages";

const NAV_LINKS = [
  { id: "hero", label: "Home" },
  { id: "lose-weight", label: "Lose Weight" },
  { id: "how-it-works", label: "How It Works" },
  { id: "bmi", label: "BMI Check" },
  { id: "plans", label: "GLP-1 Plans" },
  { id: "why-us", label: "Why Us" },
  { id: "pricing", label: "Pricing" },
  { id: "reviews", label: "Reviews" },
  { id: "glpeducation", label: "About GLP-1" },
  { id: "doctors", label: "Our Doctors" },
  { id: "faq", label: "FAQ" },
  { id: "get-started", label: "Get Started" },
];

const PAGE_LINKS = [
  {
    href: "/about",
    label: "About",
    children: [
      { href: "/about", label: "About us" },
      { href: "/about/how-it-works", label: "How it works" },
      { href: "/about/clinical-excellence", label: "Clinical excellence" },
      { href: "/about/innovation", label: "Innovation" },
      { href: "/about/quality-and-safety", label: "Quality & Safety" },
      { href: "/contact", label: "Newsroom" },
      { href: "/contact", label: "Investors" },
    ],
  },
  {
    href: WEGOVY_PAGE,
    label: "Medications",
    children: [
      { href: "/comparison", label: "Compare medications" },
      ...MEDICATION_NAV.filter((item) => item.live).map(({ href, label }) => ({
        href,
        label,
      })),
    ],
  },
  { href: "/comparison", label: "Compare" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
];

const defaultBranding = {
  logoSrc: "/images/ongo-weight-loss-logo.webp",
  logoAlt: "Ongo Weight Loss",
  logoText: "OngoWeightLoss",
  logoWidth: 220,
  logoHeight: 144,
  drawerLogoText: "Ongo",
  email: "info@ongoweightloss.com",
  phone: "+1 (888) 655-5267",
  phoneHref: "tel:+18886555267",
  copyrightName: "Ongo Weight Loss",
  footerTagline: "Doctor-led GLP-1, made for you.",
  social: {
    instagram: "https://www.instagram.com/ongoweightloss/",
    youtube: "https://www.youtube.com/@ongoweightlossusa",
    yelp: "https://www.yelp.com/biz/ongo-weight-loss-new-york/",
  },
};

function orgSlugFromBasePath(basePath) {
  if (!basePath || basePath === "/") return null;
  return basePath.replace(/^\//, "") || null;
}

export default function Header({ branding, basePath = "/" }) {
  const b = { ...defaultBranding, ...(branding || {}), social: { ...defaultBranding.social, ...(branding?.social || {}) } };

  const loginHref = useMemo(
    () => loginPathForRole("patient", orgSlugFromBasePath(basePath)),
    [basePath],
  );

  const [isScrolled, setIsScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeId, setActiveId] = useState("hero");

  useEffect(() => {
    let rafId = 0;
    let last = window.scrollY > 20;
    setIsScrolled(last);

    const check = () => {
      rafId = 0;
      const next = window.scrollY > 20;
      if (next !== last) {
        last = next;
        setIsScrolled(next);
      }
    };

    const onScroll = () => {
      if (rafId !== 0) return;
      rafId = requestAnimationFrame(check);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafId !== 0) cancelAnimationFrame(rafId);
    };
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActiveId(visible.target.id);
      },
      {
        rootMargin: "-30% 0px -50% 0px",
        threshold: [0, 0.25, 0.5, 0.75, 1],
      }
    );

    NAV_LINKS.forEach((link) => {
      const el = document.getElementById(link.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleLinkClick = (id) => {
    setIsOpen(false);
    if (id === "get-started") {
      // Route to the org-scoped onboarding when running under an org base
      // path, otherwise the default site flow.
      const onboardHref =
        basePath && basePath !== "/"
          ? `${basePath}/weightloss-onboard`
          : "/weightloss-onboard";
      window.location.href = onboardHref;
      return;
    }
    if (typeof window !== "undefined" && window.location.pathname !== basePath) {
      window.location.href = `${basePath}#${id}`;
      return;
    }
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleLogoClick = () => {
    setIsOpen(false);
    if (typeof window !== "undefined" && window.location.pathname !== basePath) {
      window.location.href = basePath;
      return;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <div className={styles.spacer} aria-hidden="true" />
      <header className={isScrolled ? styles.headerScrolled : styles.header}>
        <div className={styles.container}>
          <button
            type="button"
            className={styles.logo}
            onClick={handleLogoClick}
            aria-label="Go to top"
          >
            <span className={styles.logoMark}>
              <Image
                src={b.logoSrc}
                alt={b.logoAlt}
                width={b.logoWidth}
                height={b.logoHeight}
                priority
              />
            </span>
            {/* <span className={styles.logoText}>{b.logoText}</span> */}
          </button>

          <nav className={styles.midNav} aria-label="Primary pages">
            {PAGE_LINKS.map((link) =>
              link.children ? (
                <div key={link.href} className={styles.midNavItem}>
                  <a href={link.href} className={styles.midNavLink}>
                    {link.label}
                    <span className={styles.midNavChevron} aria-hidden="true">
                      ▾
                    </span>
                  </a>
                  <div className={styles.midNavDropdown} role="menu">
                    {link.children.map((child) => (
                      <a
                        key={child.label}
                        href={child.href}
                        className={styles.midNavDropdownLink}
                        role="menuitem"
                      >
                        {child.label}
                      </a>
                    ))}
                  </div>
                </div>
              ) : (
                <a
                  key={link.href}
                  href={link.href}
                  className={styles.midNavLink}
                >
                  {link.label}
                </a>
              )
            )}
          </nav>

          <div className={styles.headerActions}>
            <Link href={loginHref} className={styles.loginLink}>
              Log in
            </Link>
            <ThemeSwitcher />

            <button
              type="button"
              className={styles.menuToggle}
              onClick={() => setIsOpen(true)}
              aria-label="Open menu"
              aria-expanded={isOpen}
            >
              <span className={styles.hamburgerLine} />
              <span className={styles.hamburgerLine} />
              <span className={styles.hamburgerLine} />
            </button>
          </div>
        </div>
      </header>

      <div
        className={isOpen ? styles.backdropOpen : styles.backdrop}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      <aside
        className={isOpen ? styles.drawerOpen : styles.drawer}
        aria-label="Site navigation"
        aria-hidden={!isOpen}
      >
        <div className={styles.drawerInner}>
          <div className={styles.drawerTop}>
            <button
              type="button"
              className={styles.drawerLogo}
              onClick={handleLogoClick}
              aria-label="Go to top"
            >
              <span className={styles.drawerLogoMark}>
                <Image
                  src={b.logoSrc}
                  alt={b.logoAlt}
                  width={112}
                  height={112}
                />
              </span>
              <span className={styles.drawerLogoText}>{b.drawerLogoText}</span>
            </button>

            <button
              type="button"
              className={styles.closeButton}
              onClick={() => setIsOpen(false)}
              aria-label="Close menu"
            >
              <span className={styles.closeLabel}>Close</span>
              <span className={styles.closeIcon} aria-hidden="true">
                ✕
              </span>
            </button>
          </div>

          <div className={styles.drawerBody}>
            <nav className={styles.drawerNav} aria-label="Primary">
              <span className={styles.eyebrow}>
                <span className={styles.eyebrowDash} aria-hidden="true" />
                PAGES
              </span>

              <ul className={styles.drawerPageList}>
                <li>
                  <Link
                    href={loginHref}
                    className={styles.drawerPageLink}
                    onClick={() => setIsOpen(false)}
                  >
                    <span>Log in</span>
                    <span aria-hidden="true" className={styles.drawerPageArrow}>
                      ↗
                    </span>
                  </Link>
                </li>
                {PAGE_LINKS.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className={styles.drawerPageLink}
                      onClick={() => setIsOpen(false)}
                    >
                      <span>{link.label}</span>
                      <span aria-hidden="true" className={styles.drawerPageArrow}>
                        ↗
                      </span>
                    </a>
                    {link.children?.length > 0 && (
                      <ul className={styles.drawerPageSubList}>
                        {link.children.map((child) => (
                          <li key={child.href}>
                            <a
                              href={child.href}
                              className={styles.drawerPageSubLink}
                              onClick={() => setIsOpen(false)}
                            >
                              {child.label}
                            </a>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>

              <span className={`${styles.eyebrow} ${styles.eyebrowSpaced}`}>
                <span className={styles.eyebrowDash} aria-hidden="true" />
                NAVIGATE
              </span>

              <ul className={styles.navList}>
                {NAV_LINKS.map((link, index) => (
                  <li key={link.id} className={styles.navListItem}>
                    <button
                      type="button"
                      className={
                        activeId === link.id
                          ? styles.navItemActive
                          : styles.navItem
                      }
                      onClick={() => handleLinkClick(link.id)}
                      style={{ "--i": index }}
                    >
                      <span className={styles.navNumber}>
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className={styles.navLabel}>{link.label}</span>
                      <span className={styles.navArrow} aria-hidden="true">
                        ↗
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </nav>

            <aside className={styles.drawerInfo} aria-label="Contact information">
              <span className={styles.statusPill}>
                <span className={styles.statusDot} aria-hidden="true" />
                ACCEPTING NEW PATIENTS
              </span>

              <div className={styles.infoBlock}>
                <span className={styles.eyebrow}>
                  <span className={styles.eyebrowDash} aria-hidden="true" />
                  GET IN TOUCH
                </span>

                <a
                  className={styles.infoLink}
                  href={`mailto:${b.email}`}
                >
                  <span className={styles.infoIcon} aria-hidden="true">
                    ✉
                  </span>
                  <span>{b.email}</span>
                </a>

                <a className={styles.infoLink} href={b.phoneHref}>
                  <span className={styles.infoIcon} aria-hidden="true">
                    ☎
                  </span>
                  <span>{b.phone}</span>
                </a>
              </div>

              <div className={styles.infoBlock}>
                <span className={styles.eyebrow}>
                  <span className={styles.eyebrowDash} aria-hidden="true" />
                  FOLLOW US
                </span>

                <div className={styles.socialRow}>
                  <a
                    className={`${styles.socialBtn} ${styles.socialInstagram}`}
                    href={b.social.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="20"
                      height="20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M12 2.2c3.2 0 3.584.012 4.85.07 1.366.062 2.633.336 3.608 1.311.975.975 1.249 2.242 1.311 3.608.058 1.266.07 1.65.07 4.85s-.012 3.584-.07 4.85c-.062 1.366-.336 2.633-1.311 3.608-.975.975-2.242 1.249-3.608 1.311-1.266.058-1.65.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.062-2.633-.336-3.608-1.311-.975-.975-1.249-2.242-1.311-3.608C2.212 15.584 2.2 15.2 2.2 12s.012-3.584.07-4.85c.062-1.366.336-2.633 1.311-3.608.975-.975 2.242-1.249 3.608-1.311C8.416 2.212 8.8 2.2 12 2.2zm0 1.802c-3.146 0-3.518.012-4.76.069-1.064.048-1.64.227-2.024.376-.508.198-.871.434-1.252.815-.381.381-.617.744-.815 1.252-.149.384-.328.96-.376 2.024-.057 1.242-.069 1.614-.069 4.76 0 3.146.012 3.518.069 4.76.048 1.064.227 1.64.376 2.024.198.508.434.871.815 1.252.381.381.744.617 1.252.815.384.149.96.328 2.024.376 1.242.057 1.614.069 4.76.069s3.518-.012 4.76-.069c1.064-.048 1.64-.227 2.024-.376.508-.198.871-.434 1.252-.815.381-.381.617-.744.815-1.252.149-.384.328-.96.376-2.024.057-1.242.069-1.614.069-4.76s-.012-3.518-.069-4.76c-.048-1.064-.227-1.64-.376-2.024-.198-.508-.434-.871-.815-1.252-.381-.381-.744-.617-1.252-.815-.384-.149-.96-.328-2.024-.376-1.242-.057-1.614-.069-4.76-.069zm0 3.063A4.935 4.935 0 1 1 12 16.935 4.935 4.935 0 0 1 12 7.065zm0 8.135A3.2 3.2 0 1 0 12 8.8a3.2 3.2 0 0 0 0 6.4zm6.27-8.34a1.152 1.152 0 1 1-2.304 0 1.152 1.152 0 0 1 2.304 0z" />
                    </svg>
                  </a>
                  <a
                    className={`${styles.socialBtn} ${styles.socialYoutube}`}
                    href={b.social.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="YouTube"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="22"
                      height="22"
                      fill="currentColor"
                      aria-hidden="true"
                    >
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
                    <svg
                      viewBox="0 0 24 24"
                      width="20"
                      height="20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M20.16 12.594l-1.89-.612c-1.518-.486-2.484.18-2.484.18-.378.234-.36.72-.36.72l.018 4.86s.054.504.378.702c.378.234.846 0 .846 0l3.708-2.916s.36-.27.378-.738c.018-.396-.252-.81-.594-.972zM14.166 9.81c.486.612 1.404.072 1.404.072L19.692 7.5s.414-.27.45-.738c.054-.378-.234-.864-.234-.864-.234-.396-2.808-3.078-3.69-3.762-.378-.288-.792-.198-.792-.198-.486.072-.738.504-.738.504l-2.07 3.564c-.918 1.512-.612 2.376-.612 2.376.144.504.522.81 1.236 1.224.36.198.738.108.738.108zM10.602 11.43c.27-.486.252-1.026.252-1.026.072-1.566-.252-4.842-.504-6.696-.144-.99-.45-1.314-.846-1.476-.594-.234-1.314-.018-1.314-.018-2.124.45-4.554 1.404-6.012 2.358-.504.342-.738.81-.738.81-.27.594.072 1.116.072 1.116l5.526 8.046s.486.738 1.062.738c.45 0 .846-.36 1.296-.756l1.206-3.096zM10.692 14.058l-3.69 2.034s-.414.252-.504.738c-.108.504.198.99.198.99 1.494 2.358 4.05 4.014 4.05 4.014.504.288.972.198.972.198.504-.072.81-.45.81-.45l.27-.252v-6.444s-.018-.378-.36-.612c-.45-.288-.99-.27-.99-.27-.252.018-.756.054-.756.054zM18.864 18.738c-.378-.972-3.708-4.392-3.708-4.392s-.378-.378-.72-.252c-.27.09-.45.252-.594.612-.18.45-.072 4.842-.054 4.95.018.108.054.54.342.756.36.27.954.144.954.144l3.276-.918s.504-.198.612-.522c.108-.36-.108-.378-.108-.378z" />
                    </svg>
                  </a>
                </div>
              </div>

              <div className={styles.infoFooter}>
                <p className={styles.footerLine}>
                  © {new Date().getFullYear()} {b.copyrightName}.
                </p>
                <p className={styles.footerTagline}>
                  {b.footerTagline}
                </p>
              </div>
            </aside>
          </div>

          <div className={styles.drawerActions}>
            <Link
              href={loginHref}
              className={styles.drawerLogin}
              onClick={() => setIsOpen(false)}
            >
              Log in
            </Link>
            <button
              type="button"
              className={styles.drawerCta}
              onClick={() => handleLinkClick("get-started")}
            >
              Book Now →
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
