// app/api/admin/patients/[uid]/route.js
//
// PATCH — edit a patient profile fields (not status).
// DELETE — disabled; patient accounts cannot be removed.

import {
  adminGetPatientDetail,
  adminUpdatePatient,
} from "@/services/firebase/users";
import { SUPERADMIN_MUTATION_DENIED } from "@/lib/admin/access";
import { fail, ok, adminOrgScope, withAuth, invalidateUserDocCache } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withAuth(
  { role: "admin" },
  async (request, { params }, auth) => {
    const uid = params?.uid;
    if (!uid) return fail("Missing uid", 400);
    try {
      const patient = await adminGetPatientDetail(uid, adminOrgScope(auth, request));
      return ok({ patient });
    } catch (err) {
      const msg = err?.message || "Not found";
      const status = msg.includes("different portal") ? 403 : 404;
      return fail(msg, status);
    }
  },
);

export const PATCH = withAuth(
  { role: "admin" },
  async (request, { params }, auth) => {
    if (!auth.isSuper) {
      return fail(SUPERADMIN_MUTATION_DENIED, 403);
    }
    const uid = params?.uid;
    if (!uid) return fail("Missing uid", 400);
    const body = await request.json().catch(() => ({}));
    try {
      // scopedOrgSlug returns the admin's orgSlug, or null for a
      // superadmin (which lets the service skip the tenant check).
      await adminUpdatePatient(uid, body, adminOrgScope(auth, request));
    } catch (err) {
      return fail(err?.message || "Update failed", 400);
    }
    invalidateUserDocCache(uid);
    return ok();
  },
);

export const DELETE = withAuth(
  { role: "admin" },
  async () => fail("Patient accounts cannot be deleted.", 403),
);
