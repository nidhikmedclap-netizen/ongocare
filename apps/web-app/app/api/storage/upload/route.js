// app/api/storage/upload/route.js
//
// Authenticated image uploads via Firebase Admin SDK. Avoids browser → GCS
// CORS requirements on marketing/dashboard/staging domains.

import {
  uploadDoctorHeadshotAdmin,
  uploadDoctorSignatureAdmin,
  uploadPatientPhotoIdAdmin,
  uploadPatientVialPhotoAdmin,
} from "@/lib/storage/serverUploads";
import { contentTypeForExt, normalizeStorageExt } from "@/lib/storage/paths";
import { fail, ok, withAuth } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_PATIENT_BYTES = 10 * 1024 * 1024;
const MAX_HEADSHOT_BYTES = 6 * 1024 * 1024;

const ALLOWED_KINDS = new Set(["photoId", "vialPhoto", "headshot", "signature"]);

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "image/gif",
]);

/** Browsers often send HEIC as application/octet-stream — infer from extension. */
function resolveUploadContentType(file) {
  const raw = String(file?.type || "").trim().toLowerCase();
  if (raw && ALLOWED_IMAGE_TYPES.has(raw)) return raw;

  const name = String(file?.name || "");
  const ext = name.includes(".") ? name.split(".").pop() : "";
  if (ext) {
    const normalized = normalizeStorageExt(ext);
    if (["jpg", "png", "webp", "heic", "gif"].includes(normalized)) {
      return contentTypeForExt(normalized);
    }
  }

  if (raw && raw.startsWith("image/")) return raw;
  return null;
}

export const POST = withAuth(
  { rateLimitProfile: "auth" },
  async (request, _ctx, auth) => {
    const formData = await request.formData().catch(() => null);
    const kind = String(formData?.get("kind") || "").trim();
    if (!ALLOWED_KINDS.has(kind)) {
      return fail("Invalid upload type", 400);
    }

    const uid = auth.user?.uid || auth.decoded?.sub;
    if (!uid) return fail("Unauthorized", 401);

    try {
      if (kind === "signature") {
        const signatureDataUrl = String(formData?.get("signatureDataUrl") || "");
        if (!signatureDataUrl.startsWith("data:image/")) {
          return fail("Signature image is required", 400);
        }
        const { stored, downloadURL } = await uploadDoctorSignatureAdmin(
          uid,
          signatureDataUrl,
        );
        return ok({ stored, downloadURL });
      }

      const file = formData?.get("file");
      if (!file || typeof file.arrayBuffer !== "function") {
        return fail("Image file is required", 400);
      }

      const contentType = resolveUploadContentType(file);
      if (!contentType) {
        return fail("Please upload a JPG, PNG, HEIC, or WEBP image", 400);
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      if (buffer.length === 0) return fail("File is empty", 400);

      if (kind === "photoId" || kind === "vialPhoto") {
        if (buffer.length > MAX_PATIENT_BYTES) {
          return fail("Image must be under 10 MB", 400);
        }
        const upload =
          kind === "photoId"
            ? uploadPatientPhotoIdAdmin
            : uploadPatientVialPhotoAdmin;
        const { stored, downloadURL } = await upload(uid, buffer, {
          fileName: file.name || "photo.jpg",
          contentType,
        });
        return ok({ stored, downloadURL });
      }

      if (kind === "headshot") {
        if (buffer.length > MAX_HEADSHOT_BYTES) {
          return fail("Headshot must be under 6 MB", 400);
        }
        const { stored, downloadURL } = await uploadDoctorHeadshotAdmin(
          uid,
          buffer,
          {
            fileName: file.name || "headshot.jpg",
            contentType,
          },
        );
        return ok({ stored, downloadURL });
      }

      return fail("Invalid upload type", 400);
    } catch (err) {
      return fail(err?.message || "Upload failed", 400);
    }
  },
);
