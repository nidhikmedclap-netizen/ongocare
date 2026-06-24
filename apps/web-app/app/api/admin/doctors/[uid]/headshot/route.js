// Super-admin uploads a doctor headshot via Admin SDK (client rules block this).

import { adminDb } from "@/lib/firebase/admin";
import { SUPERADMIN_MUTATION_DENIED } from "@/lib/admin/access";
import { uploadDoctorHeadshotAdmin } from "@/lib/storage/serverUploads";
import { fail, ok, withAuth } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 6 * 1024 * 1024;

export const POST = withAuth(
  { role: "admin" },
  async (request, { params }, auth) => {
    if (!auth.isSuper) return fail(SUPERADMIN_MUTATION_DENIED, 403);

    const uid = params?.uid;
    if (!uid) return fail("Missing uid", 400);

    const snap = await adminDb.collection("users").doc(uid).get();
    if (!snap.exists || snap.data()?.role !== "doctor") {
      return fail("Doctor not found", 404);
    }

    const formData = await request.formData().catch(() => null);
    const file = formData?.get("file");
    if (!file || typeof file.arrayBuffer !== "function") {
      return fail("Headshot file is required", 400);
    }

    const contentType = file.type || "image/jpeg";
    if (!contentType.startsWith("image/")) {
      return fail("Please upload an image file", 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.length > MAX_BYTES) {
      return fail("Headshot must be under 6 MB", 400);
    }
    if (buffer.length === 0) {
      return fail("Headshot file is empty", 400);
    }

    try {
      const { stored, downloadURL } = await uploadDoctorHeadshotAdmin(uid, buffer, {
        fileName: file.name || "headshot.jpg",
        contentType,
      });
      return ok({ headshot: stored, downloadURL });
    } catch (err) {
      return fail(err?.message || "Headshot upload failed", 400);
    }
  },
);
