// lib/storage/serverUploads.js
//
// Server-side Firebase Storage uploads via native GCS HTTPS (service account).

import { randomUUID } from "crypto";
import { resolveStorageBucket } from "@/lib/firebase/admin";
import { uploadObjectNative } from "@/lib/storage/gcsNativeUpload";
import { buildStoredFile } from "./metadata";
import {
  contentTypeForExt,
  doctorHeadshotPath,
  doctorSignaturePath,
  normalizeStorageExt,
  patientPhotoIdPath,
  patientVialPhotoPath,
} from "./paths";

function resolveBucketName() {
  return resolveStorageBucket();
}

function bucketNotFoundMessage(bucketName) {
  return (
    `Storage bucket "${bucketName}" was not found. In Vercel → Settings → ` +
    `Environment Variables (Preview + Production), set ` +
    `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET and FIREBASE_ADMIN_STORAGE_BUCKET ` +
    `to the exact bucket from Firebase Console → Storage (e.g. ` +
    `your-project-id.firebasestorage.app). .env.local does not apply on staging.`
  );
}

function buildDownloadUrl(bucketName, path, token) {
  return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(path)}?alt=media&token=${token}`;
}

function formatUploadError(err, bucketName) {
  const msg = String(err?.message || err || "");
  if (err?.statusCode === 404 || /bucket does not exist|not found/i.test(msg)) {
    return new Error(bucketNotFoundMessage(bucketName));
  }
  if (/invalid_grant|invalid jwt|asn1|decoder routines|private key|PEM/i.test(msg)) {
    return new Error(
      "Firebase Admin private key is invalid. Check FIREBASE_ADMIN_PRIVATE_KEY in .env.local.",
    );
  }
  if (/Missing required env vars/i.test(msg)) {
    return err;
  }
  return new Error(msg || "Upload failed");
}

async function uploadImageBuffer({ path, buffer, fileName, contentType }) {
  const stored = buildStoredFile({ path, fileName, contentType });
  if (!stored) throw new Error("Invalid storage path");

  const bucketName = resolveBucketName();
  if (!bucketName) throw new Error("Storage bucket not configured");

  const token = randomUUID();

  try {
    await uploadObjectNative({
      bucketName,
      objectPath: stored.path,
      buffer,
      contentType: stored.contentType,
      downloadToken: token,
    });
  } catch (err) {
    throw formatUploadError(err, bucketName);
  }

  return {
    stored,
    downloadURL: buildDownloadUrl(bucketName, stored.path, token),
  };
}

export async function uploadDoctorHeadshotAdmin(uid, buffer, { fileName, contentType }) {
  if (!uid || !buffer?.length) throw new Error("Headshot file is required");
  const ext = normalizeStorageExt(fileName);
  return uploadImageBuffer({
    path: doctorHeadshotPath(uid, ext),
    buffer,
    fileName: fileName || `headshot.${ext}`,
    contentType: contentType || contentTypeForExt(ext),
  });
}

export function dataUrlToBuffer(dataUrl) {
  if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:image/")) {
    throw new Error("Invalid image data");
  }
  const [meta, base64] = dataUrl.split(",");
  const contentType = meta.match(/data:(.*?);/)?.[1] || "image/png";
  return {
    buffer: Buffer.from(base64, "base64"),
    contentType,
  };
}

export async function uploadPatientPhotoIdAdmin(uid, buffer, { fileName, contentType }) {
  if (!uid || !buffer?.length) throw new Error("Photo ID file is required");
  const ext = normalizeStorageExt(fileName);
  return uploadImageBuffer({
    path: patientPhotoIdPath(uid, ext),
    buffer,
    fileName: fileName || `photo-id.${ext}`,
    contentType: contentType || contentTypeForExt(ext),
  });
}

export async function uploadPatientVialPhotoAdmin(uid, buffer, { fileName, contentType }) {
  if (!uid || !buffer?.length) throw new Error("Medication photo file is required");
  const ext = normalizeStorageExt(fileName);
  return uploadImageBuffer({
    path: patientVialPhotoPath(uid, ext),
    buffer,
    fileName: fileName || `vial-photo.${ext}`,
    contentType: contentType || contentTypeForExt(ext),
  });
}

export async function uploadDoctorSignatureAdmin(uid, signatureDataUrl) {
  if (!uid) throw new Error("Doctor id is required");
  const { buffer, contentType } = dataUrlToBuffer(signatureDataUrl);
  if (buffer.length > 2 * 1024 * 1024) {
    throw new Error("Signature image must be under 2 MB");
  }
  return uploadImageBuffer({
    path: doctorSignaturePath(uid),
    buffer,
    fileName: "signature.png",
    contentType,
  });
}
