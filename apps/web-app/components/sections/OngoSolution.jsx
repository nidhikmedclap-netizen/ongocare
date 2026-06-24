import { Fragment } from "react";
import Image from "next/image";
import styles from "./OngoSolution.module.css";

const defaultContent = {
  headingMain: "Meet our",
  headingAccent: "Dedicated Doctors",
  subcopy:
    "We connect you with licensed doctors who guide you toward healthy and sustainable weight loss.",
  ctaLabel: "Meet My Doctor",
  ctaHref: "/weightloss-onboard",
  trustItems: [
    { value: "30+", label: "Licensed providers" },
    { value: "50", label: "States covered" },
  ],
};

const DEFAULT_COLUMN_LEFT = [
  {
    name: "Dr. Miller",
    credential: "MD",
    affiliation: "Licensed physician",
    npi: "1235623372",
    imageSrc: "/images/johnathan-miller.webp",
  },
  {
    name: "Dr. Krasne",
    credential: "MD",
    affiliation: "Licensed physician",
    npi: "1306189832",
    imageSrc: "/images/dr-krasne .webp",
  },
  {
    name: "Dr. Niles",
    credential: "R.N., M.D., F.A.C.O.G",
    affiliation: "Board-certified physician",
    npi: "1922199470",
    imageSrc: "/images/Dr-vanessa-niles.webp",
  },
  {
    name: "Dr. Bugailiskis",
    credential: "MD",
    affiliation: "Board-certified physician",
    npi: "1871882035",
    imageSrc: "/images/cheryl-bugailiskis.webp",
  },
];

const DEFAULT_COLUMN_RIGHT = [
  {
    name: "Dr. Bugailiskis",
    credential: "MD",
    affiliation: "Board-certified physician",
    npi: "1871882035",
    imageSrc: "/images/cheryl-bugailiskis.webp",
  },
  {
    name: "Dr. Niles",
    credential: "R.N., M.D., F.A.C.O.G",
    affiliation: "Board-certified physician",
    npi: "1922199470",
    imageSrc: "/images/Dr-vanessa-niles.webp",
  },
  {
    name: "Dr. Krasne",
    credential: "MD",
    affiliation: "Licensed physician",
    npi: "1306189832",
    imageSrc: "/images/dr-krasne .webp",
  },
  {
    name: "Dr. Miller",
    credential: "MD",
    affiliation: "Licensed physician",
    npi: "1235623372",
    imageSrc: "/images/johnathan-miller.webp",
  },
];

export default function ongoSolution({ content }) {
  const c = { ...defaultContent, ...(content || {}) };
  const COLUMN_LEFT = content?.columnLeft ?? DEFAULT_COLUMN_LEFT;
  const COLUMN_RIGHT = content?.columnRight ?? DEFAULT_COLUMN_RIGHT;
  const TRUST_ITEMS = c.trustItems;

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        {/* LEFT — copy */}
        <div className={styles.copy}>
          <h2 className={styles.heading}>
            {c.headingMain}{" "}
            <span className={styles.headingAccent}>{c.headingAccent}</span>
          </h2>

          <p className={styles.subcopy}>
           {c.subcopy}

          </p>

          <a
            href={c.ctaHref}
            className={styles.ctaButton}
            style={{ textDecoration: "none" }}
          >
            {c.ctaLabel}

          </a>

          {/* Trust strip */}
          <div className={styles.trustStrip}>
            {TRUST_ITEMS.map((t, i) => (
              <Fragment key={t.label}>
                <div className={styles.trustItem}>
                  <span className={styles.trustValue}>{t.value}</span>
                  <span className={styles.trustLabel}>{t.label}</span>
                </div>
                {i < TRUST_ITEMS.length - 1 && (
                  <div className={styles.trustDivider} />
                )}
              </Fragment>
            ))}
          </div>
        </div>

        {/* RIGHT — scrolling columns */}
        <div className={styles.columns}>
          {/* Left column scrolls UP */}
          <div className={styles.columnWrap}>
            <div className={`${styles.columnTrack} ${styles.scrollUp}`}>
              {COLUMN_LEFT.map((doc, i) => (
                <DoctorCard key={`l-${i}`} doctor={doc} />
              ))}
              {COLUMN_LEFT.map((doc, i) => (
                <DoctorCard
                  key={`l-clone-${i}`}
                  doctor={doc}
                  ariaHidden
                />
              ))}
            </div>
          </div>

          {/* Right column scrolls DOWN */}
          <div className={styles.columnWrap}>
            <div className={`${styles.columnTrack} ${styles.scrollDown}`}>
              {COLUMN_RIGHT.map((doc, i) => (
                <DoctorCard key={`r-${i}`} doctor={doc} />
              ))}
              {COLUMN_RIGHT.map((doc, i) => (
                <DoctorCard
                  key={`r-clone-${i}`}
                  doctor={doc}
                  ariaHidden
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ----- Sub-component ----- */

function DoctorCard({ doctor, ariaHidden = false }) {
  return (
    <article
      className={styles.doctorCard}
      aria-hidden={ariaHidden || undefined}
    >
      <div className={styles.doctorImageWrap}>
        <Image
          src={doctor.imageSrc}
          alt={`${doctor.name}, ${doctor.credential}`}
          width={320}
          height={320}
          sizes="(max-width: 900px) 50vw, 320px"
          className={styles.doctorImage}
        />
      </div>

      <div className={styles.doctorInfo}>
        <h3 className={styles.doctorName}>
          {doctor.name}, {doctor.credential}
          <span className={styles.verifiedBadge} aria-label="Verified provider">
            ✓
          </span>
        </h3>
        <p className={styles.doctorAffiliation}>{doctor.affiliation}</p>
        <a
          href={`https://npiregistry.cms.hhs.gov/provider-view/${doctor.npi}`}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.doctorNPI}
          aria-label={`Verify ${doctor.name} on the NPI registry (opens in new tab)`}
          tabIndex={ariaHidden ? -1 : undefined}
        >
          <span>NPI: {doctor.npi}</span>
          <span className={styles.npiArrow} aria-hidden="true">
            ↗
          </span>
        </a>
      </div>
    </article>
  );
}
