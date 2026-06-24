// components/auth/AuthShell.jsx
//
// Branded two-column auth card used by every email/password login page.
// Renders the brand panel (left) and card header (right); the form itself
// is passed as `children` so each page owns submit logic but reuses the
// shared visual language.
//
// The CSS-module class names (form, field, input, submit, etc.) are
// re-exported as `authStyles` for callers to attach to their own form
// elements. This is intentional: the form primitives are part of the
// AuthShell contract — sharing the classnames keeps the visual rhythm
// identical across portals without inventing a wrapper component for
// every form element.
//
//   import AuthShell, { authStyles } from "@/components/auth/AuthShell";
//
//   <AuthShell variant="patient" brand={...} panel={...} card={...}>
//     <form className={authStyles.form} onSubmit={...}>
//       <label className={authStyles.field}>...</label>
//       ...
//     </form>
//   </AuthShell>
//
// `variant`:
//   "patient"   (default) — brighter green gradient, orb on the top-left.
//   "clinician"           — deeper green gradient, orb on the top-right.

import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import { mergeLogoBranding } from "@/lib/branding/defaults";
import styles from "./AuthShell.module.css";

export { styles as authStyles };

export default function AuthShell({
  variant = "patient",
  brand,
  panel,
  card,
  children,
}) {
  const pageClass =
    variant === "clinician"
      ? `${styles.page} ${styles.clinician}`
      : styles.page;

  const logoBranding = mergeLogoBranding(brand);

  return (
    <main className={pageClass}>
      <div className={styles.heroOrb} aria-hidden />

      <div className={styles.shell}>
        <aside className={styles.brandPanel} aria-hidden>
          <Link href={brand?.href || "/"} className={styles.brand}>
            <BrandLogo
              branding={logoBranding}
              className={styles.brandLogoWrap}
              imageClassName={styles.brandLogoImg}
              priority
            />
          </Link>

          <div className={styles.brandBody}>
            {panel.kicker && (
              <span className={styles.kicker}>{panel.kicker}</span>
            )}
            <h1 className={styles.brandTitle}>{panel.title}</h1>
            {panel.subtitle && (
              <p className={styles.brandSubtitle}>{panel.subtitle}</p>
            )}

            {panel.features?.length > 0 && (
              <ul className={styles.features}>
                {panel.features.map((feature) => (
                  <li key={feature.title}>
                    <span className={styles.featureDot} />
                    <span>
                      <strong>{feature.title}</strong>
                      <em>{feature.desc}</em>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {panel.footnote && (
            <div className={styles.brandFootnote}>
              {panel.footnote.text}{" "}
              <Link
                href={panel.footnote.linkHref}
                className={styles.brandLink}
              >
                {panel.footnote.linkLabel}
              </Link>
            </div>
          )}
        </aside>

        <section className={styles.card}>
          <header className={styles.cardHead}>
            {card.kicker && (
              <span className={styles.cardKicker}>{card.kicker}</span>
            )}
            <h2 className={styles.cardTitle}>{card.title}</h2>
            {card.subtitle && (
              <p className={styles.cardSubtitle}>{card.subtitle}</p>
            )}
          </header>
          {children}
        </section>
      </div>
    </main>
  );
}
