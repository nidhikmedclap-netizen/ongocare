// lib/auth/handoffStore.js
//
// Short-lived one-time codes for cross-site auth handoff (avoids tokens in URLs).
// Stored in Firestore so create (marketing host) and consume (dashboard host)
// work across separate dev servers and Vercel serverless instances.

import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";

const TTL_MS = 60_000;
const COLLECTION = "_authHandoffs";

function randomId() {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
}

/**
 * @param {{ idToken: string, customToken: string }} payload
 */
export async function createHandoffCode({ idToken, customToken }) {
  const id = randomId();
  const exp = Date.now() + TTL_MS;
  await adminDb.collection(COLLECTION).doc(id).set({
    idToken,
    customToken,
    exp,
    createdAt: FieldValue.serverTimestamp(),
  });
  return id;
}

/**
 * Read a handoff code. First call marks it consumed; repeat calls within TTL
 * return the same payload (handles duplicate callback navigations).
 * @returns {Promise<{ idToken: string, customToken: string } | null>}
 */
export async function consumeHandoffCode(id) {
  const key = typeof id === "string" ? id.trim() : "";
  if (!key) return null;

  const ref = adminDb.collection(COLLECTION).doc(key);

  return adminDb.runTransaction(async (transaction) => {
    const snap = await transaction.get(ref);
    if (!snap.exists) return null;

    const data = snap.data();

    if (
      !data?.idToken ||
      typeof data.exp !== "number" ||
      data.exp <= Date.now()
    ) {
      transaction.delete(ref);
      return null;
    }

    const payload = {
      idToken: data.idToken,
      customToken: data.customToken || "",
    };

    if (!data.consumed) {
      transaction.update(ref, {
        consumed: true,
        consumedAt: Date.now(),
      });
    }

    return payload;
  });
}
