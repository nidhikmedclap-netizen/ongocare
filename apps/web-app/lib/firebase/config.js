// lib/firebase/config.js
//
// Centralized Firebase configuration.
//
// All keys are read from environment variables (see .env.local / .env.example).
// Only NEXT_PUBLIC_* values are exposed to the browser — that is intentional
// for Firebase's web SDK config, which is a public identifier (NOT a secret).
// Access control is enforced server-side by Firebase Security Rules.
//
// If any required key is missing we throw early so misconfiguration is caught
// at boot time instead of failing silently inside a Firebase call later.

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  // measurementId is only needed when Analytics is enabled. Optional.
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Validate at module-load so we fail loudly during dev/build instead of at runtime.
// We allow measurementId to be undefined (Analytics is optional).
const requiredKeys = [
  "apiKey",
  "authDomain",
  "projectId",
  "storageBucket",
  "messagingSenderId",
  "appId",
];

export function assertFirebaseConfig() {
  const missing = requiredKeys.filter((k) => !firebaseConfig[k]);
  if (missing.length > 0) {
    // Build-time / dev-time visibility. Production builds will also surface this.
    throw new Error(
      `[firebase] Missing required env vars: ${missing
        .map((k) => `NEXT_PUBLIC_FIREBASE_${k.replace(/[A-Z]/g, (m) => `_${m}`).toUpperCase()}`)
        .join(", ")}. Add them to .env.local.`,
    );
  }
}

export default firebaseConfig;
