"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  BLOG_HERO,
  BLOG_CATEGORIES,
  BLOG_ARTICLES,
  EDITOR_PICKS_TITLE,
  EDITOR_PICKS_INTRO,
  SIDEBAR_JOURNEY,
  NEWSLETTER,
  MID_CTA,
  BOTTOM_CTA,
  CONTACT_CARDS,
} from "@/lib/blog/content";
import { filterArticles } from "@/lib/blog/utils";
import styles from "./BlogPage.module.css";

function categoryLabel(group) {
  return BLOG_CATEGORIES.find((c) => c.id === group)?.label ?? "Article";
}

function ArticleCard({ article }) {
  return (
    <article className={styles.card}>
      <a href={`/blog/${article.slug}`} className={styles.cardLink}>
        <div className={styles.cardImageWrap}>
          <Image
            src={article.image}
            alt={article.imageAlt}
            fill
            sizes="(max-width: 768px) 80vw, 280px"
            className={styles.cardImage}
          />
        </div>
        <div className={styles.cardBody}>
          <h3 className={styles.cardTitle}>{article.title}</h3>
          <p className={styles.cardExcerpt}>{article.excerpt}</p>
          <div className={styles.cardMeta}>
            <span>{article.readingTime} min read</span>
            <span className={styles.cardDot} aria-hidden="true" />
            <span>{categoryLabel(article.group)}</span>
          </div>
        </div>
      </a>
    </article>
  );
}

export default function BlogPage() {
  const [category, setCategory] = useState("all");
  const [subscribed, setSubscribed] = useState(false);
  const [email, setEmail] = useState("");

  const articles = useMemo(
    () => filterArticles(BLOG_ARTICLES, { category }),
    [category],
  );

  function handleSubscribe(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
    setEmail("");
    window.setTimeout(() => setSubscribed(false), 4000);
  }

  return (
    <>
      <Header />
      <main className={styles.page}>
        {/* Hero — image + overlay, ref-style */}
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
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>
              {BLOG_HERO.headline}{" "}
              <span className={styles.heroTitleEm}>{BLOG_HERO.headlineEm}</span>
            </h1>
            <p className={styles.heroSub}>{BLOG_HERO.subcopy}</p>
            <a href={BLOG_HERO.primaryCta.href} className={styles.heroPill}>
              {BLOG_HERO.primaryCta.label}
            </a>
          </div>
        </section>

        {/* Rounded white shell overlapping hero */}
        <section className={styles.shell}>
          <div className={styles.workspace}>
            <nav className={styles.categoryNav} aria-label="Article categories">
              {BLOG_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  className={
                    category === cat.id
                      ? styles.categoryActive
                      : styles.categoryItem
                  }
                  onClick={() => setCategory(cat.id)}
                >
                  <span className={styles.categoryDot} aria-hidden="true" />
                  {cat.label}
                </button>
              ))}
            </nav>

            <div className={styles.mainCol}>
              <header className={styles.sectionHead}>
                <h2 className={styles.sectionTitle}>{EDITOR_PICKS_TITLE}</h2>
                <p className={styles.sectionIntro}>{EDITOR_PICKS_INTRO}</p>
                <a href={MID_CTA.cta.href} className={styles.sectionCta}>
                  {MID_CTA.cta.label}
                </a>
              </header>

              {articles.length > 0 ? (
                <div className={styles.cardRow}>
                  {articles.map((article) => (
                    <ArticleCard key={article.slug} article={article} />
                  ))}
                </div>
              ) : (
                <p className={styles.empty}>No articles in this category yet.</p>
              )}
            </div>

            <aside className={styles.asideCol} aria-label="Blog sidebar">
              <div className={styles.darkCard}>
                <h3 className={styles.darkCardTitle}>{SIDEBAR_JOURNEY.title}</h3>
                <p className={styles.darkCardCopy}>{SIDEBAR_JOURNEY.copy}</p>
                <a href={SIDEBAR_JOURNEY.cta.href} className={styles.darkCardBtn}>
                  {SIDEBAR_JOURNEY.cta.label}
                </a>
              </div>

              <div className={styles.newsletterCard}>
                <h3 className={styles.newsletterTitle}>{NEWSLETTER.title}</h3>
                <p className={styles.newsletterCopy}>{NEWSLETTER.copy}</p>
                <form onSubmit={handleSubscribe} className={styles.newsletterForm}>
                  <input
                    type="email"
                    required
                    placeholder="Your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={styles.newsletterInput}
                    aria-label="Email address"
                  />
                  <button type="submit" className={styles.newsletterBtn}>
                    {NEWSLETTER.cta}
                  </button>
                  {subscribed && (
                    <p className={styles.newsletterSuccess} role="status">
                      {NEWSLETTER.success}
                    </p>
                  )}
                </form>
              </div>
            </aside>
          </div>
        </section>

        {/* Bottom CTA band */}
        <section className={styles.bottomCta}>
          <div className={styles.bottomInner}>
            <h2 className={styles.bottomTitle}>{BOTTOM_CTA.title}</h2>
            <p className={styles.bottomCopy}>{BOTTOM_CTA.copy}</p>
            <a href={BOTTOM_CTA.cta.href} className={styles.bottomBtn}>
              {BOTTOM_CTA.cta.label}
            </a>

            <div className={styles.contactGrid}>
              {CONTACT_CARDS.map((card) => (
                <div key={card.title} className={styles.contactCard}>
                  <h3 className={styles.contactTitle}>{card.title}</h3>
                  <p className={styles.contactCopy}>{card.copy}</p>
                  <a href={card.href} className={styles.contactBtn}>
                    {card.cta}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
