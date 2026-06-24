// Super-admin uploads a doctor signature via Admin SDK.

import { adminDb } from "@/lib/firebase/admin";
import { SUPERADMIN_MUTATION_DENIED } from "@/lib/admin/access";
import { uploadDoctorSignatureAdmin } from "@/lib/storage/serverUploads";
import { fail, ok, withAuth } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

    const body = await request.json().catch(() => ({}));
    const signatureDataUrl = body?.signatureDataUrl;
    if (
      typeof signatureDataUrl !== "string" ||
      !signatureDataUrl.startsWith("data:image/")
    ) {
      return fail("Signature image is required", 400);
    }

    try {
      const { stored, downloadURL } = await uploadDoctorSignatureAdmin(
        uid,
        signatureDataUrl,
      );
      return ok({ signature: stored, downloadURL });
    } catch (err) {
      return fail(err?.message || "Signature upload failed", 400);
    }
  },
);
