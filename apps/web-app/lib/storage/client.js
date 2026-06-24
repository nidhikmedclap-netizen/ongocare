// lib/storage/client.js
//
// Client-side Firebase Storage uploads.

import {
  getDownloadURL,
  ref as storageRef,
  uploadBytes,
} from "firebase/storage";
import { storage } from "@/lib/firebase/storage";
import { buildStoredFile } from "./metadata";

/**
 * @param {{ path: string, file: Blob, fileName?: string, contentType?: string }} input
 * @returns {Promise<{ stored: import('./metadata').StoredFile, downloadURL: string }|null>}
 */
export async function uploadStorageBlob({
  path,
  file,
  fileName = "file",
  contentType,
}) {
  const stored = buildStoredFile({
    path,
    fileName,
    contentType: contentType || file.type || "application/octet-stream",
  });
  if (!stored) return null;

  const sref = storageRef(storage, stored.path);
  await uploadBytes(sref, file, { contentType: stored.contentType });
  const downloadURL = await getDownloadURL(sref);
  return { stored, downloadURL };
}

export function dataUrlToBlob(dataUrl) {
  const [meta, base64] = dataUrl.split(",");
  const mime = meta.match(/data:(.*?);/)?.[1] || "image/png";
  const bytes = atob(base64);
  const buffer = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i += 1) {
    buffer[i] = bytes.charCodeAt(i);
  }
  return new Blob([buffer], { type: mime });
}
