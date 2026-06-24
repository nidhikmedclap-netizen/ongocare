// lib/firebase/admin.js
//
// Firebase ADMIN SDK singleton — SERVER-ONLY.
//
// This file MUST NEVER be imported from a client component, page, or browser
// bundle. It uses a service-account private key that grants root-level access
// to the entire Firebase project (bypasses Security Rules, can create users,
// read/write any document). Leaking it = total project compromise.
//
// Safe import sites:
//   - app/api/**/route.js     (Next.js API route handlers, run server-side)
//   - server actions / server components
//
// Init is LAZY — credentials are read on first actual use, not at module
// load. This matters because Next.js's build-time page-data collection
// evaluates route modules without env vars set the same way as runtime; an
// eager initializer would crash the build. With lazy init, an import of this
// module is free; the credential check only fires when an Admin SDK call
// actually happens.

import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

if (typeof window !== "undefined") {
  // Hard fail — this should never happen, but if it does we want a screaming
  // stack trace, not a silent credential leak.
  throw new Error(
    "[firebase-admin] Imported from a browser context. This module is server-only.",
  );
}

let _app = null;
let _auth = null;
let _db = null;
let _storage = null;

/** Parsed service account env vars (Admin SDK + native GCS upload). */
export function getServiceAccountCredentials() {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = (process.env.FIREBASE_ADMIN_PRIVATE_KEY || "")
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/\\n/g, "\n");

  const missing = [];
  if (!projectId) missing.push("FIREBASE_ADMIN_PROJECT_ID");
  if (!clientEmail) missing.push("FIREBASE_ADMIN_CLIENT_EMAIL");
  if (!privateKey) missing.push("FIREBASE_ADMIN_PRIVATE_KEY");
  if (missing.length > 0) {
    throw new Error(
      `[firebase-admin] Missing required env vars: ${missing.join(", ")}. ` +
        `See Firebase Console → Project Settings → Service accounts.`,
    );
  }

  return { projectId, clientEmail, privateKey };
}

function buildCredential() {
  const { projectId, clientEmail, privateKey } = getServiceAccountCredentials();
  return cert({ projectId, clientEmail, privateKey });
}

export function resolveStorageBucket(projectId) {
  const explicit =
    process.env.FIREBASE_ADMIN_STORAGE_BUCKET ||
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  if (explicit) {
    return String(explicit).trim().replace(/^gs:\/\//, "");
  }
  const pid =
    projectId ||
    process.env.FIREBASE_ADMIN_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    "";
  // New Firebase projects use *.firebasestorage.app (not legacy *.appspot.com).
  return pid ? `${pid}.firebasestorage.app` : "";
}

function getAdminApp() {
  if (_app) return _app;
  if (getApps().length) {
    _app = getApp();
    return _app;
  }

  const credential = buildCredential();
  const projectId =
    process.env.FIREBASE_ADMIN_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const storageBucket = resolveStorageBucket(projectId);

  _app = initializeApp({
    credential,
    ...(projectId ? { projectId } : {}),
    ...(storageBucket ? { storageBucket } : {}),
  });
  return _app;
}

// Proxy-based lazy singletons. Importers can `import { adminAuth }` and use
// it like a normal object; the underlying SDK instance is created on first
// property access.
function makeLazy(factory) {
  let target = null;
  return new Proxy(function () {}, {
    get(_t, prop) {
      if (!target) target = factory();
      const value = target[prop];
      return typeof value === "function" ? value.bind(target) : value;
    },
    apply(_t, _thisArg, args) {
      if (!target) target = factory();
      return target.apply ? target.apply(_thisArg, args) : target(...args);
    },
    has(_t, prop) {
      if (!target) target = factory();
      return prop in target;
    },
  });
}

export const adminAuth = makeLazy(() => {
  if (_auth) return _auth;
  _auth = getAuth(getAdminApp());
  return _auth;
});

export const adminDb = makeLazy(() => {
  if (_db) return _db;
  _db = getFirestore(getAdminApp());
  return _db;
});

export const adminStorage = makeLazy(() => {
  if (_storage) return _storage;
  _storage = getStorage(getAdminApp());
  return _storage;
});

export async function getSignedStorageUrl(path, expiresMs = 15 * 60 * 1000) {
  const projectId =
    process.env.FIREBASE_ADMIN_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const bucketName = resolveStorageBucket(projectId);
  if (!bucketName) {
    throw new Error(
      "[firebase-admin] Storage bucket not configured. Set NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET (or FIREBASE_ADMIN_STORAGE_BUCKET) in Vercel env vars.",
    );
  }

  const bucket = adminStorage.bucket(bucketName);
  const file = bucket.file(path);
  const [url] = await file.getSignedUrl({
    action: "read",
    expires: Date.now() + expiresMs,
  });
  return url;
}

export default { getAdminApp };
