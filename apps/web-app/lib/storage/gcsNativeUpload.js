// lib/storage/gcsNativeUpload.js
//
// Upload to Firebase/GCS using Node's native https + service-account JWT.
// Avoids google-auth-library fetch (breaks when webpack-bundled in Next.js).

import crypto from "crypto";
import https from "https";
import { getServiceAccountCredentials } from "@/lib/firebase/admin";

if (typeof window !== "undefined") {
  throw new Error("[storage/gcsNativeUpload] Server-only.");
}

const STORAGE_SCOPE = "https://www.googleapis.com/auth/devstorage.full_control";
const TOKEN_URL = "https://oauth2.googleapis.com/token";

let cachedToken = null;
let cachedTokenExpiresAt = 0;

function httpsRequest({ url, method, headers, body }) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = https.request(
      {
        hostname: parsed.hostname,
        path: `${parsed.pathname}${parsed.search}`,
        method,
        headers,
      },
      (res) => {
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          const raw = Buffer.concat(chunks).toString("utf8");
          let data = raw;
          try {
            data = raw ? JSON.parse(raw) : {};
          } catch {
            // keep raw string
          }
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ status: res.statusCode, data });
          } else {
            const message =
              typeof data === "object"
                ? data.error_description ||
                  data.error?.message ||
                  JSON.stringify(data)
                : String(data || `HTTP ${res.statusCode}`);
            const err = new Error(message);
            err.statusCode = res.statusCode;
            reject(err);
          }
        });
      },
    );
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

function createServiceAccountJwt(clientEmail, privateKey) {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(
    JSON.stringify({ alg: "RS256", typ: "JWT" }),
  ).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      iss: clientEmail,
      scope: STORAGE_SCOPE,
      aud: TOKEN_URL,
      exp: now + 3600,
      iat: now,
    }),
  ).toString("base64url");
  const input = `${header}.${payload}`;
  const signature = crypto
    .createSign("RSA-SHA256")
    .update(input)
    .sign(privateKey, "base64url");
  return `${input}.${signature}`;
}

async function getStorageAccessToken() {
  const now = Date.now();
  if (cachedToken && cachedTokenExpiresAt > now + 60_000) {
    return cachedToken;
  }

  const { clientEmail, privateKey } = getServiceAccountCredentials();
  const assertion = createServiceAccountJwt(clientEmail, privateKey);
  const body = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion,
  }).toString();

  const { data } = await httpsRequest({
    url: TOKEN_URL,
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Content-Length": Buffer.byteLength(body),
    },
    body,
  });

  if (!data?.access_token) {
    throw new Error("Google Storage token exchange returned no access_token");
  }

  cachedToken = data.access_token;
  cachedTokenExpiresAt = now + (Number(data.expires_in) || 3600) * 1000;
  return cachedToken;
}

/**
 * Multipart upload to GCS with Firebase download token metadata.
 */
export async function uploadObjectNative({
  bucketName,
  objectPath,
  buffer,
  contentType,
  downloadToken,
}) {
  const accessToken = await getStorageAccessToken();
  const boundary = `----gcs${crypto.randomBytes(8).toString("hex")}`;
  const meta = JSON.stringify({
    name: objectPath,
    contentType,
    metadata: {
      firebaseStorageDownloadTokens: downloadToken,
    },
  });

  const preamble = Buffer.from(
    `--${boundary}\r\n` +
      "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
      `${meta}\r\n` +
      `--${boundary}\r\n` +
      `Content-Type: ${contentType}\r\n\r\n`,
    "utf8",
  );
  const closing = Buffer.from(`\r\n--${boundary}--`, "utf8");
  const body = Buffer.concat([preamble, buffer, closing]);

  const path = `/upload/storage/v1/b/${encodeURIComponent(bucketName)}/o?uploadType=multipart`;

  await httpsRequest({
    url: `https://storage.googleapis.com${path}`,
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": `multipart/related; boundary=${boundary}`,
      "Content-Length": body.length,
    },
    body,
  });
}
