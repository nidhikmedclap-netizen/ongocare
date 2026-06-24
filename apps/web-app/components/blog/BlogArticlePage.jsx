import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { formatPublishDate } from "@/lib/blog/utils";
import styles from "./BlogArticlePage.module.css";

function ArticleSection({ section }) {
  return (
    <section id={section.id}>
      {section.title && (
        <h2 className={styles.sectionTitle}>{section.title}</h2>
      )}

      {section.paragraphs?.map((para) => (
        <p key={para.slice(0, 48)} className={styles.paragraph}>
          {para}
        </p>
      ))}

      {section.highlight && (
        <div className={styles.highlight}>
          <p className={styles.highlightLabel}>{section.highlight.label}</p>
          <p className={styles.highlightText}>{section.highlight.text}</p>
        </div>
      )}

      {section.table && (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                {section.table.headers.map((header) => (
                  <th key={header}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {section.table.rows.map((row) => (
                <tr key={row[0]}>
                  {row.map((cell) => (
                    <td key={`${row[0]}-${cell}`}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {section.stats?.length > 0 && (
        <div className={styles.stats}>
          {section.stats.map((stat) => (
            <div key={stat.value} className={styles.stat}>
              <p className={styles.statValue}>{stat.value}</p>
              <p className={styles.statText}>{stat.text}</p>
            </div>
          ))}
        </div>
      )}

      {section.images?.map((img) => (
        <figure key={img.src} className={styles.figure}>
          <Image
            src={img.src}
            alt={img.alt}
            width={900}
            height={520}
            className={styles.figureImage}
          />
          {img.caption && (
            <figcaption className={styles.figureCaption}>{img.caption}</figcaption>
          )}
        </figure>
      ))}

      {section.subtitle && (
        <h3 className={styles.subsectionTitle}>{section.subtitle}</h3>
      )}

      {section.cards?.map((card) => (
        <div key={card.name} className={styles.card}>
          <h3 className={styles.cardTitle}>{card.name}</h3>
          {card.intro && <p className={styles.cardIntro}>{card.intro}</p>}
          {card.points?.map((point) => (
            <div key={`${card.name}-${point.label}`} className={styles.cardPoint}>
              <p className={styles.cardLabel}>{point.label}</p>
              <p className={styles.cardText}>{point.text}</p>
            </div>
          ))}
        </div>
      ))}

      {section.cta && (
        <a href={section.cta.href} className={styles.inlineCta}>
          {section.cta.label}
        </a>
      )}

      {section.subsections?.map((sub) => (
        <div key={sub.title} className={styles.subsection}>
          <h3 className={styles.subsectionTitle}>{sub.title}</h3>
          {sub.paragraphs?.map((para) => (
            <p key={para.slice(0, 48)} className={styles.paragraph}>
              {para}
            </p>
          ))}
        </div>
      ))}

      {section.columns?.length > 0 && (
        <div className={styles.columnRow}>
          {section.columns.map((col) => (
            <div
              key={col.title}
              className={`${styles.column} ${
                col.variant === "cons" ||
                col.title === "Cons" ||
                col.title === "Unrealistic Goals" ||
                col.title === "Who Should NOT Take GLP-1"
                  ? styles.columnCons
                  : styles.columnPros
              }`}
            >
              <h3 className={styles.columnTitle}>{col.title}</h3>
              <ul className={styles.columnList}>
                {col.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {section.lists?.map((list) => (
        <div key={list.title || list.items[0]} className={styles.listBlock}>
          {list.title && <h3 className={styles.subsectionTitle}>{list.title}</h3>}
          {list.intro && <p className={styles.paragraph}>{list.intro}</p>}
          <ul className={styles.bulletList}>
            {list.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ))}

      {section.badges?.length > 0 && (
        <div className={styles.badges}>
          {section.badges.map((badge) => (
            <span key={badge} className={styles.badge}>
              {badge}
            </span>
          ))}
        </div>
      )}

      {section.paragraphsAfter?.map((para) => (
        <p key={para.slice(0, 48)} className={styles.paragraph}>
          {para}
        </p>
      ))}

      {section.note && <p className={styles.note}>{section.note}</p>}
    </section>
  );
}

export default function BlogArticlePage({ article }) {
  return (
    <>
      <Header />
      <main className={styles.page}>
        <section className={styles.hero}>
          <Image
            src={article.heroImage || "/images/about-bg.png"}
            alt=""
            fill
            priority
            className={styles.heroImage}
            sizes="100vw"
          />
          <div className={styles.heroOverlay} aria-hidden="true" />
          <div className={styles.heroContent}>
            <nav className={styles.breadcrumb} aria-label="Breadcrumb">
              <a href="/">Home</a>
              <span aria-hidden="true">›</span>
              <a href="/blog">Blog</a>
            </nav>
            <h1 className={styles.title}>{article.title}</h1>
            <p className={styles.excerpt}>{article.excerpt}</p>
            <div className={styles.meta}>
              <span>By {article.author.name}</span>
              <span aria-hidden="true">·</span>
              <span>Reviewed by {article.reviewer.name}</span>
              <span aria-hidden="true">·</span>
              <time dateTime={article.publishedAt}>
                {formatPublishDate(article.publishedAt)}
              </time>
            </div>
          </div>
        </section>

        <section className={styles.main}>
          <div className={styles.shell}>
            <article className={styles.article}>
              {article.keyTakeaways?.length > 0 && (
                <aside className={styles.takeaways}>
                  <h2>Key takeaways</h2>
                  <ul className={styles.takeawayList}>
                    {article.keyTakeaways.map((item) => (
                      <li key={typeof item === "string" ? item : item.title}>
                        {typeof item === "string" ? (
                          item
                        ) : (
                          <>
                            <strong>{item.title}</strong>
                            <span>{item.text}</span>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                </aside>
              )}

              {article.sections.map((section) => (
                <ArticleSection key={section.id} section={section} />
              ))}

              {article.disclaimerPlacement !== "afterFaq" && article.disclaimer && (
                <p className={styles.disclaimer}>{article.disclaimer}</p>
              )}

              {article.faqs?.length > 0 && (
                <section id="faq" className={styles.faqSection}>
                  <h2 className={styles.sectionTitle}>Frequently Asked Questions</h2>
                  <div className={styles.faqList}>
                    {article.faqs.map((item) => (
                      <div key={item.question} className={styles.faqItem}>
                        <h3 className={styles.faqQuestion}>{item.question}</h3>
                        <p className={styles.faqAnswer}>{item.answer}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {article.disclaimerPlacement === "afterFaq" && article.disclaimer && (
                <p className={styles.disclaimer}>{article.disclaimer}</p>
              )}

              {article.faqDisclaimer && (
                <p className={styles.disclaimer}>{article.faqDisclaimer}</p>
              )}

              {article.references?.length > 0 && (
                <section id="references" className={styles.references}>
                  <h2 className={styles.sectionTitle}>References</h2>
                  <ol className={styles.referenceList}>
                    {article.references.map((ref) => (
                      <li key={ref.text}>
                        {ref.href ? (
                          <a
                            href={ref.href}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {ref.text}
                          </a>
                        ) : (
                          ref.text
                        )}
                      </li>
                    ))}
                  </ol>
                </section>
              )}

              <div className={styles.authorBox}>
                <p className={styles.authorName}>{article.author.name}</p>
                <p className={styles.authorBio}>{article.author.bio}</p>
              </div>
            </article>

            <aside className={styles.sidebar}>
              <a href="/weightloss-onboard" className={styles.sidebarCta}>
                Start Your Consultation
              </a>
              <a href="/blog" className={styles.sidebarLink}>
                ← Back to blog
              </a>
            </aside>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
