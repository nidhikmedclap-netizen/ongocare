"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import styles from "./DoctorsConstellation.module.css";

const ORBIT_POSITIONS = [
  { left: "50%", top: "10%" },
  { left: "86%", top: "32%" },
  { left: "76%", top: "78%" },
  { left: "24%", top: "78%" },
  { left: "14%", top: "32%" },
];

export default function DoctorsConstellation({ doctors }) {
  const [visible, setVisible] = useState(false);
  const [selected, setSelected] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (selected === null) return;
    const onKey = (e) => {
      if (e.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [selected]);

  const orbitDoctors = [];
  for (let i = 0; i < 5; i++) {
    orbitDoctors.push(doctors[i % doctors.length]);
  }

  return (
    <div
      ref={containerRef}
      className={`${styles.stage} ${visible ? styles.visible : ""}`}
    >
      <div className={styles.hub} aria-hidden="true">
        <span className={styles.hubLabel}>Meet the team</span>
        <span className={styles.hubSub}>Tap any clinician</span>
      </div>

      <svg
        className={styles.orbitRing}
        viewBox="0 0 800 500"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <ellipse
          cx="400"
          cy="250"
          rx="320"
          ry="180"
          fill="none"
          stroke="var(--color-primary-soft)"
          strokeWidth="2"
          strokeDasharray="4 8"
        />
      </svg>

      {orbitDoctors.map((d, i) => (
        <button
          key={`${d.name}-${i}`}
          type="button"
          className={styles.avatar}
          style={{
            left: ORBIT_POSITIONS[i].left,
            top: ORBIT_POSITIONS[i].top,
            transitionDelay: `${0.15 + i * 0.12}s`,
            animationDelay: `${i * 0.7}s`,
          }}
          onClick={() => setSelected(i)}
          aria-label={`View profile for ${d.name}`}
        >
          <span className={styles.avatarImg}>
            <Image
              src={d.image}
              alt=""
              width={140}
              height={140}
              sizes="140px"
            />
          </span>
          <span className={styles.avatarName}>{d.name}</span>
        </button>
      ))}

      {selected !== null && (
        <div
          className={styles.overlay}
          onClick={() => setSelected(null)}
          role="dialog"
          aria-modal="true"
          aria-label={`${orbitDoctors[selected].name} profile`}
        >
          <div
            className={styles.expanded}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className={styles.closeBtn}
              onClick={() => setSelected(null)}
              aria-label="Close profile"
            >
              ×
            </button>
            <div className={styles.expandedPhoto}>
              <Image
                src={orbitDoctors[selected].image}
                alt={`Portrait of ${orbitDoctors[selected].name}`}
                fill
                sizes="(max-width: 600px) 90vw, 320px"
              />
            </div>
            <div className={styles.expandedBody}>
              <h3 className={styles.expandedName}>
                {orbitDoctors[selected].name}
              </h3>
              <p className={styles.expandedCredentials}>
                {orbitDoctors[selected].credentials}
              </p>
              <p className={styles.expandedBio}>
                {orbitDoctors[selected].bio}
              </p>
              <a
                href={`https://npiregistry.cms.hhs.gov/provider-view/${orbitDoctors[selected].npi}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.expandedNpi}
              >
                <span className={styles.npiBadge} aria-hidden="true">
                  NPI
                </span>
                <span>{orbitDoctors[selected].npi}</span>
                <span aria-hidden="true">↗</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
