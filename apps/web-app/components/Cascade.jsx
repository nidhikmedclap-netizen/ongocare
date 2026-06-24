"use client";

import { useScrollReveal } from "./useScrollReveal";
import styles from "./Cascade.module.css";

export default function Cascade({
  children,
  delay = 0.2 * 1000,
  stagger,
  from = "up",
  className = "",
}) {
  const { ref, isVisible } = useScrollReveal();

  return (
    <div
      ref={ref}
      className={`${styles.wrapper} ${
        isVisible ? styles.visible : ""
      } ${styles[`from_${from}`]} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
