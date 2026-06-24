import { LEGAL_NAV } from "@/lib/legal/content";
import styles from "./LegalPage.module.css";

function sectionLabel(title) {
  return title.replace(/^\d+\.\s*/, "");
}

export default function LegalNav({ activeSlug, sections = [] }) {
  return (
    <aside className={styles.leftSidebar}>
      <div className={styles.sidebarCard}>
        <div className={styles.scrollHint} aria-hidden="true">
          <span className={styles.scrollMouse} />
          <span className={styles.scrollHintText}>Scroll to explore</span>
        </div>

        <nav className={styles.policyMenu} aria-label="Legal policies">
          <p className={styles.policyMenuLabel}>All policies</p>
          <ul className={styles.policyMenuList}>
            {LEGAL_NAV.map((item) => (
              <li key={item.slug}>
                <a
                  href={item.href}
                  className={
                    item.slug === activeSlug
                      ? styles.policyMenuLinkActive
                      : styles.policyMenuLink
                  }
                  aria-current={item.slug === activeSlug ? "page" : undefined}
                >
                  <span className={styles.policyMenuText}>{item.label}</span>
                  <span className={styles.policyMenuArrow} aria-hidden="true">
                    →
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {sections.length > 1 && (
          <nav className={styles.sectionMenu} aria-label="On this page">
            <p className={styles.policyMenuLabel}>On this page</p>
            <ul className={styles.sectionMenuList}>
              {sections.map((section) => (
                <li key={section.id}>
                  <a href={`#${section.id}`} className={styles.sectionMenuLink}>
                    <span className={styles.sectionMenuDot} aria-hidden="true" />
                    {sectionLabel(section.title)}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
    </aside>
  );
}
