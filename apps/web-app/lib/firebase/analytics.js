// lib/firebase/analytics.js
//
// Firebase Analytics (Google Analytics for Firebase).
//
// Analytics is browser-only — it touches `window`, cookies, and IndexedDB,
// so it MUST NOT be initialized during server-side rendering or it will crash
// the Next.js build / SSR pass. We guard with `isSupported()` and `typeof
// window` checks, and return `null` outside the browser.
//
// We also skip initialization in development by default to avoid polluting
// production analytics with local traffic. Override with
// NEXT_PUBLIC_FIREBASE_ANALYTICS_ENABLED=true if you need to test it locally.
//
// Usage (client component only):
//
//   "use client";
//   import { useEffect } from "react";
//   import { getAnalyticsSafe } from "@/lib/firebase/analytics";
//
//   useEffect(() => { getAnalyticsSafe(); }, []);

import { getFirebaseApp } from "./client";

let _analytics;

export async function getAnalyticsSafe() {
  // Server / build-time: do nothing.
  if (typeof window === "undefined") return null;

  // Production-only by default; opt in for dev via env flag.
  const enabled =
    process.env.NODE_ENV === "production" ||
    process.env.NEXT_PUBLIC_FIREBASE_ANALYTICS_ENABLED === "true";
  if (!enabled) return null;

  // measurementId is required for Analytics.
  if (!process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID) return null;

  if (_analytics) return _analytics;

  // Dynamic import keeps the analytics chunk out of the server bundle.
  const { getAnalytics, isSupported } = await import("firebase/analytics");
  if (!(await isSupported())) return null;

  _analytics = getAnalytics(getFirebaseApp());
  return _analytics;
}

export default getAnalyticsSafe;
