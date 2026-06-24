// lib/firebase/index.js
//
// Barrel export — single ergonomic entry point for the Firebase layer.
//
//   import { app, auth, db, storage, getAnalyticsSafe } from "@/lib/firebase";
//
// Prefer importing the specific submodule (e.g. "@/lib/firebase/firestore")
// in performance-sensitive paths so tree-shaking can drop unused services.
// This barrel exists for convenience and discoverability.

export { default as app, getFirebaseApp } from "./client";
export { auth } from "./auth";
export { db } from "./firestore";
export { storage } from "./storage";
export { getAnalyticsSafe } from "./analytics";
