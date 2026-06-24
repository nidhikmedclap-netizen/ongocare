// app/api/admin/coupons/route.js
//
// GET  — list coupons visible to the caller (super = all; portal admin =
//        own portal + globals). Read-only for both roles.
// POST — create a new coupon. SUPER-ADMIN ONLY (portal admin → 403).
//
// All writes go through services/firebase/coupons.js which does field-by-
// field validation, so a buggy client can never write garbage.

import { createCoupon, listCoupons } from "@/services/firebase/coupons";
import { fail, ok, adminOrgScope, withAuth } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withAuth({ role: "admin" }, async (request, _ctx, auth) => {
  const orgSlug = adminOrgScope(auth, request);
  const coupons = await listCoupons(orgSlug, auth.isSuper);
  return ok({ coupons });
});

export const POST = withAuth({ role: "admin" }, async (request, _ctx, auth) => {
  if (!auth.isSuper) {
    return fail("Only super-admin can create coupons", 403);
  }
  const body = await request.json().catch(() => ({}));
  try {
    const coupon = await createCoupon(body, {
      uid: auth.decoded?.uid || auth.user?.uid || "",
      email: auth.user?.email || auth.decoded?.email || "",
    });
    return ok({ coupon });
  } catch (err) {
    return fail(err?.message || "Could not create coupon", 400);
  }
});
