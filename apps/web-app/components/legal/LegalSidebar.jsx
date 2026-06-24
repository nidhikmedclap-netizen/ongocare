import styles from "./LegalPage.module.css";

const SEE_MORE_LINKS = [
  { label: "Compare medications", href: "/comparison", icon: "⚖" },
  { label: "Wegovy", href: "/medications/wegovy", icon: "💊" },
  { label: "How it works", href: "/about/how-it-works", icon: "📋" },
  { label: "FAQ", href: "/#faq", icon: "❓" },
];

export default function LegalSidebar() {
  return (
    <aside className={styles.rightSidebar} aria-label="Related links">
      <div className={styles.seeMoreBox}>
        <div className={styles.seeMoreHeader}>
          <h3 className={styles.seeMoreTitle}>Explore more</h3>
          <span className={styles.seeMoreTag}>Resources</span>
        </div>
        <ul className={styles.seeMoreList}>
          {SEE_MORE_LINKS.map((link) => (
            <li key={link.href}>
              <a href={link.href} className={styles.seeMoreLink}>
                <span className={styles.seeMoreIcon} aria-hidden="true">
                  {link.icon}
                </span>
                <span className={styles.seeMoreLabel}>{link.label}</span>
                <span className={styles.seeMoreChevron} aria-hidden="true">
                  ›
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.doubtsBox}>
        <div className={styles.doubtsGlow} aria-hidden="true" />
        <span className={styles.doubtsIcon} aria-hidden="true">
          💬
        </span>
        <div className={styles.doubtsContent}>
          <p className={styles.doubtsTitle}>Need clarification?</p>
          <p className={styles.doubtsSub}>
            Our care team is happy to explain any part of this document.
          </p>
          <a href="mailto:info@ongoweightloss.com" className={styles.doubtsBtn}>
            Email us →
          </a>
          <a href="tel:+18886555267" className={styles.doubtsPhone}>
            +1 (888) 655-5267
          </a>
        </div>
      </div>
    </aside>
  );
}
