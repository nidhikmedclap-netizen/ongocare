// app/api/admin/doctors/[uid]/route.js
//
// PATCH — update an individual doctor's status / priority / editable
//         profile fields. Used for approve/reject and priority bumps.
// DELETE — disabled; doctor accounts cannot be removed.

import {
  adminGetDoctorDetail,
  adminReassignDoctorPortal,
  adminSetDoctorPortals,
  adminUpdateDoctor,
} from "@/services/firebase/doctors";
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
      const doctor = await adminGetDoctorDetail(uid, adminOrgScope(auth, request), {
        revealFullBanking: auth.isSuper,
        maskOtherPortals: !auth.isSuper,
      });
      return ok({ doctor });
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
    const uid = params?.uid;
    if (!uid) return fail("Missing uid", 400);
    const body = await request.json().catch(() => ({}));

    // Portal admins may only change priority (patient-picker order).
    // Everything else — status, profile, visit payment, portal — is super-admin.
    if (!auth.isSuper) {
      const keys = Object.keys(body);
      if (keys.length !== 1 || !Object.prototype.hasOwnProperty.call(body, "priority")) {
        return fail(SUPERADMIN_MUTATION_DENIED, 403);
      }
      try {
        const scope = adminOrgScope(auth, request);
        await adminUpdateDoctor(uid, { priority: body.priority }, scope);
      } catch (err) {
        return fail(err?.message || "Update failed", 400);
      }
      invalidateUserDocCache(uid);
      return ok();
    }

    if (Object.prototype.hasOwnProperty.call(body, "priority")) {
      const scope = adminOrgScope(auth, request);
      if (!scope) {
        return fail("Select a portal before setting doctor priority.", 400);
      }
    }

    try {
      if (Object.prototype.hasOwnProperty.call(body, "orgSlugs")) {
        await adminSetDoctorPortals(uid, body.orgSlugs);
        const { orgSlugs: _s, orgSlug: _o, ...rest } = body;
        if (Object.keys(rest).length === 0) return ok();
        await adminUpdateDoctor(uid, rest, adminOrgScope(auth, request));
        return ok();
      }
      if (Object.prototype.hasOwnProperty.call(body, "orgSlug")) {
        await adminReassignDoctorPortal(uid, body.orgSlug);
        const { orgSlug: _o, ...rest } = body;
        if (Object.keys(rest).length === 0) return ok();
        await adminUpdateDoctor(uid, rest, adminOrgScope(auth, request));
        return ok();
      }
      await adminUpdateDoctor(uid, body, adminOrgScope(auth, request));
    } catch (err) {
      return fail(err?.message || "Update failed", 400);
    }
    invalidateUserDocCache(uid);
    return ok();
  },
);

export const DELETE = withAuth(
  { role: "admin" },
  async () => fail("Doctor accounts cannot be deleted.", 403),
);
