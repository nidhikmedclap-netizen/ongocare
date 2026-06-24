// lib/storage/uploads.js
//
// Domain upload helpers — all image uploads go through /api/storage/upload
// so staging/production domains never need Firebase Storage CORS rules.

import { uploadViaStorageApi } from "./uploadViaApi";

async function uploadWithStatus({ onStatus, statusLabel, task }) {
  onStatus?.(statusLabel);
  try {
    return await task();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[storage/upload]", statusLabel, err);
    throw err;
  }
}

export async function uploadDoctorHeadshot({ uid, photoFile, onStatus }) {
  if (!uid || !photoFile) return null;
  return uploadWithStatus({
    onStatus,
    statusLabel: "Uploading headshot…",
    task: () =>
      uploadViaStorageApi({
        kind: "headshot",
        file: photoFile,
      }),
  });
}

export async function uploadDoctorSignature({
  uid,
  signatureDataUrl,
  onStatus,
}) {
  if (
    !uid ||
    typeof signatureDataUrl !== "string" ||
    !signatureDataUrl.startsWith("data:image/")
  ) {
    return null;
  }

  return uploadWithStatus({
    onStatus,
    statusLabel: "Uploading signature…",
    task: () =>
      uploadViaStorageApi({
        kind: "signature",
        signatureDataUrl,
      }),
  });
}

export async function uploadPatientPhotoId({ uid, file, onStatus }) {
  if (!uid || !file) return null;
  return uploadWithStatus({
    onStatus,
    statusLabel: "Uploading ID photo…",
    task: () =>
      uploadViaStorageApi({
        kind: "photoId",
        file,
      }),
  });
}

export async function uploadPatientVialPhoto({ uid, file, onStatus }) {
  if (!uid || !file) return null;
  return uploadWithStatus({
    onStatus,
    statusLabel: "Uploading medication photo…",
    task: () =>
      uploadViaStorageApi({
        kind: "vialPhoto",
        file,
      }),
  });
}
