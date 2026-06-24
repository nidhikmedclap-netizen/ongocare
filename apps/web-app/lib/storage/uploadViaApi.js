// lib/storage/uploadViaApi.js
//
// Upload images through /api/storage/upload (Admin SDK). Works on every
// marketing/dashboard/staging domain without Firebase Storage CORS config.

import { auth } from "@/lib/firebase/auth";

async function authHeaders() {
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in");
  const idToken = await user.getIdToken();
  return { Authorization: `Bearer ${idToken}` };
}

/**
 * @param {{ kind: "photoId"|"vialPhoto"|"headshot"|"signature", file?: Blob, signatureDataUrl?: string }} input
 * @returns {Promise<{ stored: import("./metadata").StoredFile, downloadURL: string }>}
 */
export async function uploadViaStorageApi({ kind, file, signatureDataUrl }) {
  const formData = new FormData();
  formData.set("kind", kind);
  if (file) formData.set("file", file);
  if (signatureDataUrl) formData.set("signatureDataUrl", signatureDataUrl);

  const res = await fetch("/api/storage/upload", {
    method: "POST",
    headers: await authHeaders(),
    body: formData,
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.success || !data?.stored) {
    throw new Error(data?.message || "Upload failed");
  }
  return { stored: data.stored, downloadURL: data.downloadURL || "" };
}
