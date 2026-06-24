"use client";

import { useEffect, useRef } from "react";
import styles from "./ScrollProgress.module.css";

export default function ScrollProgress() {
  const barRef = useRef(null);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;

    let docHeight =
      document.documentElement.scrollHeight - window.innerHeight;
    let rafId = 0;

    const write = () => {
      rafId = 0;
      const pct = docHeight > 0 ? window.scrollY / docHeight : 0;
      bar.style.transform = `scaleX(${pct})`;
    };

    const onScroll = () => {
      if (rafId !== 0) return;
      rafId = requestAnimationFrame(write);
    };

    const ro = new ResizeObserver(() => {
      docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      onScroll();
    });
    ro.observe(document.documentElement);

    write();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
      if (rafId !== 0) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div className={styles.track} aria-hidden="true">
      <div ref={barRef} className={styles.bar} />
    </div>
  );
}
