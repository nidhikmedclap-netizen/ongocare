import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LegalNav from "./LegalNav";
import LegalContent from "./LegalContent";
import LegalSidebar from "./LegalSidebar";
import styles from "./LegalPage.module.css";

export default function LegalPage({ page }) {
  return (
    <>
      <Header />
      <main className={styles.page}>
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
          <div className={styles.heroContent}>
            <span className={styles.heroBadge}>
              <span className={styles.heroBadgeDot} aria-hidden="true" />
              Legal &amp; compliance
            </span>
            <p className={styles.heroEyebrow}>You are in</p>
            <h1 className={styles.heroTitle}>{page.title}</h1>
            <div className={styles.heroMeta}>
              <nav className={styles.heroBreadcrumb} aria-label="Breadcrumb">
                <a href="/">Home</a>
                <span aria-hidden="true">›</span>
                <span>{page.title}</span>
              </nav>
              {page.lastUpdated && (
                <span className={styles.heroUpdated}>
                  <span>Updated</span>
                  <time>{page.lastUpdated}</time>
                </span>
              )}
            </div>
          </div>
        </section>

        <section className={styles.mainLayout}>
          <div className={styles.contentShell}>
            <div className={styles.mainGrid}>
              <LegalNav activeSlug={page.slug} sections={page.sections} />
              <LegalContent sections={page.sections} intro={page.intro} />
              <LegalSidebar />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
