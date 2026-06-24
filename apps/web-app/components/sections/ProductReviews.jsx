import Image from "next/image";
import styles from "./ProductReviews.module.css";

const defaultContent = {
  eyebrow: "THOSE WHO CHOSE US",
  headingMain: "There's a reason why people are",
  headingAccent: "choosing us",
  headingSuffix: ".",
  subcopy:
    "Join thousands of people who have trusted us to help change their lives, achieving sustainable and lasting weight loss.",
};

const DEFAULT_ROW_TOP = [
  {
    type: "text",
    name: "Margaret",
    rating: 5,
    quote:
      "Absolutely wonderful and helpful. She walked me through everything and made me feel as if I really mattered. I was very pleased with our conversation.",
  },
  {
    type: "image",
    imageSrc: "/images/review-a.webp",
    alt: "Real patient before-and-after weight loss transformation on a GLP-1 program",
  },
  {
    type: "text",
    name: "Jamie",
    rating: 5,
    quote:
      "The questions are to the point and easy to navigate. I'm able to voice my concerns if needed and ask questions. They are quick to respond and keep me updated on my prescription.",
  },
  {
    type: "text",
    name: "Jacqueline",
    rating: 5,
    quote:
      "My experience is very positive. I am doing very well. Slowly and surely reaching my goals with their help. They have been very attentive and have provided me with all the resources to be successful. Thank you.",
  },
  {
    type: "text",
    name: "Diana",
    rating: 5,
    quote:
      "The staff has been so friendly and caring. I didn't expect that! If I call, I get an immediate answer from a real person!",
  },
  {
    type: "image",
    imageSrc: "/images/review-d.webp",
    alt: "Happy patient sharing her GLP-1 weight loss journey results",
  },
];

const DEFAULT_ROW_BOTTOM = [
  {
    type: "text",
    name: "Alexandra",
    rating: 5,
    quote:
      "Everything was quick and concise. I was treated professionally and given the opportunity to ask questions and have my questions answered thoroughly.",
  },
  {
    type: "text",
    name: "Greg",
    rating: 5,
    quote:
      "I was ready to give up. Wow. I would pay 10x as much if I had to. Dieting days are over. Thanks to the team for the metabolic fix — game changer.",
  },
  {
    type: "image",
    imageSrc: "/images/review-c.webp",
    alt: "Two patients in matching outfits showing their weight loss progress",
  },
  {
    type: "text",
    name: "Lou-Ann",
    rating: 5,
    quote:
      "The doctors and staff have been very professional and prompt with any questions I have and their support and care. I feel in great hands! I'm 13 lbs away from goal. Thank you!",
  },
  {
    type: "text",
    name: "Elizabeth",
    rating: 5,
    quote:
      "My clinician was kind, understanding of expectations, and future follow-ups are easy to understand and schedule.",
  },
  {
    type: "image",
    imageSrc: "/images/review-d.webp",
    alt: "Patient celebrating her successful weight loss results",
  },
];

export default function ProductReviews({ content }) {
  const c = { ...defaultContent, ...(content || {}) };
  const ROW_TOP = content?.rowTop ?? DEFAULT_ROW_TOP;
  const ROW_BOTTOM = content?.rowBottom ?? DEFAULT_ROW_BOTTOM;

  return (
    <section id="reviews" className={styles.section}>
      {/* Header */}
      <header className={styles.header}>
        <p className={styles.eyebrow}>{c.eyebrow}</p>
        <h2 className={styles.heading}>
          {c.headingMain}{" "}
          <span className={styles.headingAccent}>{c.headingAccent}</span>{c.headingSuffix}
        </h2>
        <p className={styles.subcopy}>
         {c.subcopy}
        </p>
      </header>

      {/* Two scrolling rows */}
      <div className={styles.rows} aria-hidden="true">
        {/* Top row — scrolls right-to-left */}
        <div className={styles.rowWrap}>
          <div className={`${styles.rowTrack} ${styles.scrollLeft}`}>
            {[...ROW_TOP, ...ROW_TOP].map((card, i) => (
              <ReviewCard key={`t-${i}`} card={card} />
            ))}
          </div>
        </div>

        {/* Bottom row — scrolls left-to-right */}
        <div className={styles.rowWrap}>
          <div className={`${styles.rowTrack} ${styles.scrollRight}`}>
            {[...ROW_BOTTOM, ...ROW_BOTTOM].map((card, i) => (
              <ReviewCard key={`b-${i}`} card={card} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ----- Sub-component ----- */

function ReviewCard({ card }) {
  if (card.type === "image") {
    return (
      <article className={styles.imageCard}>
        <Image
          src={card.imageSrc}
          alt={card.alt}
          width={320}
          height={220}
          sizes="(max-width: 768px) 240px, 320px"
          className={styles.cardImage}
        />
      </article>
    );
  }

  return (
    <article className={styles.textCard}>
      <header className={styles.cardHeader}>
        <h3 className={styles.cardName}>{card.name}</h3>
        <div className={styles.stars} aria-label={`${card.rating} out of 5`}>
          {Array.from({ length: card.rating }).map((_, i) => (
            <span key={i} className={styles.star} aria-hidden="true">
              ★
            </span>
          ))}
        </div>
      </header>
      <p className={styles.cardQuote}>“{card.quote}”</p>
    </article>
  );
}
