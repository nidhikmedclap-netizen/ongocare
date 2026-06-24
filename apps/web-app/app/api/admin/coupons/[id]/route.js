// app/api/admin/coupons/[id]/route.js
//
// PATCH  — update editable fields (active, discountPercent, maxDiscountDollars,
//          eligiblePlans, maxUses, expiresAtMs, orgSlug). SUPER-ADMIN ONLY.
// DELETE — hard-delete the coupon. SUPER-ADMIN ONLY.
//
// Code itself is intentionally NOT editable — renaming a live promo with
// redemptions in the wild breaks the audit trail; if you need a new code,
// create a new coupon.

import { deleteCoupon, updateCoupon } from "@/services/firebase/coupons";
import { fail, ok, withAuth } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const PATCH = withAuth(
  { role: "admin" },
  async (request, { params }, auth) => {
    if (!auth.isSuper) {
      return fail("Only super-admin can edit coupons", 403);
    }
    const id = params?.id;
    if (!id) return fail("Missing coupon id", 400);
    const body = await request.json().catch(() => ({}));
    try {
      const coupon = await updateCoupon(id, body);
      return ok({ coupon });
    } catch (err) {
      return fail(err?.message || "Could not update coupon", 400);
    }
  },
);

export const DELETE = withAuth(
  { role: "admin" },
  async (_request, { params }, auth) => {
    if (!auth.isSuper) {
      return fail("Only super-admin can delete coupons", 403);
    }
    const id = params?.id;
    if (!id) return fail("Missing coupon id", 400);
    try {
      await deleteCoupon(id);
      return ok();
    } catch (err) {
      return fail(err?.message || "Could not delete coupon", 400);
    }
  },
);
