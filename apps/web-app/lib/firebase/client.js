// lib/firebase/client.js
//
// Firebase App singleton.
//
// Next.js (App Router) can evaluate modules in multiple contexts: server
// components, client components, route handlers, and during HMR in dev.
// `initializeApp` must only be called ONCE per JS runtime — otherwise Firebase
// throws "Firebase App named '[DEFAULT]' already exists". We guard against
// that with `getApps()` so this module is safe to import from anywhere.
//
// This file deliberately does NOT instantiate auth/firestore/storage. Each
// service is lazily created in its own module (./auth, ./firestore, ./storage)
// so that bundles only pull in what the importing code actually uses.

import { getApp, getApps, initializeApp } from "firebase/app";
import firebaseConfig, { assertFirebaseConfig } from "./config";

let _app;

export function getFirebaseApp() {
  if (_app) return _app;

  assertFirebaseConfig();

  // Reuse an existing app if one was already initialized (HMR, server reloads).
  _app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  return _app;
}

// Convenience default export for ergonomic imports:
//   import app from "@/lib/firebase/client";
const app = getFirebaseApp();
export default app;
