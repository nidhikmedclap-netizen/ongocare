// lib/auth/sessionEdge.js
//
// Edge-compatible Firebase session cookie verification for Next.js middleware.
// Uses Google's public x509 certificates (same keys as Firebase ID tokens).

import { importX509, jwtVerify } from "jose";
import { SESSION_COOKIE_NAME } from "@/lib/auth/sessionConstants";

const FIREBASE_CERTS_URL =
  "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";

/** @type {{ keys: Record<string, string> | null, exp: number }} */
const certCache = { keys: null, exp: 0 };

function decodeBase64Url(input) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = normalized.length % 4;
  const padded = pad ? normalized + "=".repeat(4 - pad) : normalized;
  return atob(padded);
}

function resolveAllowedProjectIds() {
  const ids = new Set();
  for (const value of [
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    process.env.FIREBASE_ADMIN_PROJECT_ID,
  ]) {
    const trimmed = String(value || "").trim();
    if (trimmed) ids.add(trimmed);
  }
  return ids;
}

async function getFirebasePublicKeys() {
  if (certCache.keys && Date.now() < certCache.exp) {
    return certCache.keys;
  }

  const res = await fetch(FIREBASE_CERTS_URL, { cache: "no-store" });

  if (!res.ok) {
    throw new Error("Failed to fetch Firebase public keys");
  }

  certCache.keys = await res.json();
  certCache.exp = Date.now() + 60 * 60 * 1000;
  return certCache.keys;
}

/**
 * Verify a Firebase session cookie in Edge middleware.
 * @returns {Promise<import('jose').JWTPayload | null>}
 */
export async function verifySessionCookieEdge(sessionCookie) {
  const allowedProjectIds = resolveAllowedProjectIds();
  if (!sessionCookie || allowedProjectIds.size === 0) return null;

  try {
    const parts = sessionCookie.split(".");
    if (parts.length !== 3) return null;

    const header = JSON.parse(decodeBase64Url(parts[0]));
    const kid = header?.kid;
    if (!kid) return null;

    const keys = await getFirebasePublicKeys();
    const cert = keys?.[kid];
    if (!cert) return null;

    const publicKey = await importX509(cert, "RS256");
    const { payload } = await jwtVerify(sessionCookie, publicKey, {
      algorithms: ["RS256"],
    });

    const aud =
      typeof payload.aud === "string"
        ? payload.aud
        : Array.isArray(payload.aud)
          ? payload.aud[0]
          : "";
    if (!aud || !allowedProjectIds.has(aud)) return null;

    const expectedIss = `https://session.firebase.google.com/${aud}`;
    if (payload.iss !== expectedIss) return null;

    if (typeof payload.exp === "number" && payload.exp * 1000 <= Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function readSessionCookieFromRequest(request) {
  return request.cookies.get(SESSION_COOKIE_NAME)?.value || null;
}

export async function hasValidSessionOnRequest(request) {
  const value = readSessionCookieFromRequest(request);
  if (!value) return false;
  const claims = await verifySessionCookieEdge(value);
  return Boolean(claims?.sub);
}
