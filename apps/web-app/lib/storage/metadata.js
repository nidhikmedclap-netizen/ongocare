// lib/storage/metadata.js
//
// Small Firestore-friendly metadata for a stored file. APIs return only what
// is needed; download URLs are resolved on demand via signed-url route.

import { isValidStoragePath } from "./paths";

/**
 * @typedef {{ path: string, fileName: string, contentType: string, uploadedAtMs: number }} StoredFile
 */

/** @returns {StoredFile|null} */
export function buildStoredFile({ path, fileName, contentType }) {
  const cleanPath = String(path || "").trim();
  if (!isValidStoragePath(cleanPath)) return null;
  return {
    path: cleanPath.slice(0, 512),
    fileName: String(fileName || "file").slice(0, 255),
    contentType: String(contentType || "application/octet-stream").slice(0, 100),
    uploadedAtMs: Date.now(),
  };
}

/** @returns {StoredFile|null} */
export function sanitizeStoredFile(input) {
  if (!input || typeof input !== "object") return null;
  return buildStoredFile({
    path: input.path,
    fileName: input.fileName,
    contentType: input.contentType,
  });
}

/** Merge flat onboarding path fields into structured `documents` map. */
export function buildPatientDocumentsFromForm(form = {}) {
  const documents = {};

  if (form.photoIdPath) {
    const photoId = buildStoredFile({
      path: form.photoIdPath,
      fileName: form.photoIdName,
      contentType: form.photoIdContentType,
    });
    if (photoId) documents.photoId = photoId;
  }

  if (form.vialPhotoPath) {
    const vialPhoto = buildStoredFile({
      path: form.vialPhotoPath,
      fileName: form.vialPhotoName,
      contentType: form.vialPhotoContentType,
    });
    if (vialPhoto) documents.vialPhoto = vialPhoto;
  }

  return Object.keys(documents).length ? documents : null;
}
