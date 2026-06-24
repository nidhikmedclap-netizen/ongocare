import styles from "./LegalPage.module.css";

function Block({ block }) {
  if (block.type === "paragraph") {
    return <p className={styles.paragraph}>{block.text}</p>;
  }

  if (block.type === "list") {
    return (
      <ul className={styles.list}>
        {block.items.map((item) => (
          <li key={item}>
            <span className={styles.listMarker} aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    );
  }

  if (block.type === "ordered-list") {
    return (
      <ol className={styles.orderedList}>
        {block.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ol>
    );
  }

  if (block.type === "note") {
    return (
      <aside className={styles.note}>
        <span className={styles.noteIcon} aria-hidden="true">
          ℹ
        </span>
        <div>
          <strong>{block.title}</strong>
          <p>{block.text}</p>
        </div>
      </aside>
    );
  }

  return null;
}

function sectionNumber(title, index) {
  const match = title.match(/^(\d+)\./);
  return match ? match[1] : String(index + 1).padStart(2, "0");
}

function sectionHeading(title) {
  return title.replace(/^\d+\.\s*/, "");
}

export default function LegalContent({ sections, intro }) {
  return (
    <article className={styles.prose}>
      {intro && (
        <div className={styles.aboutBlock}>
          <div className={styles.aboutIcon} aria-hidden="true">
            ◆
          </div>
          <div>
            <h2 className={styles.aboutTitle}>
              About this <span className={styles.headingAccent}>policy</span>
            </h2>
            <p className={styles.aboutText}>{intro}</p>
          </div>
        </div>
      )}

      <div className={styles.sectionStack}>
        {sections.map((section, index) => (
          <section
            key={section.id}
            id={section.id}
            className={styles.contentSection}
          >
            <header className={styles.sectionHeader}>
              <span className={styles.sectionNumber} aria-hidden="true">
                {sectionNumber(section.title, index)}
              </span>
              <h2 className={styles.sectionTitle}>
                {sectionHeading(section.title)}
              </h2>
            </header>
            <div className={styles.sectionBody}>
              {section.blocks.map((block, i) => (
                <Block key={`${section.id}-${i}`} block={block} />
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className={styles.continueRead}>
        <a href="/contact" className={styles.continueReadBtn}>
          Questions? Talk to our team
          <span aria-hidden="true">→</span>
        </a>
      </div>
    </article>
  );
}
