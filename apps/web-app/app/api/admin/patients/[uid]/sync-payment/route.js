// app/api/admin/patients/[uid]/sync-payment/route.js
//
// POST — refresh onboarding payment fields from Stripe for one patient.
// Use when Dashboard capture happened but the webhook did not update Firestore.

import { adminGetPatientDetail } from "@/services/firebase/users";
import { syncPatientPaymentByUid } from "@/services/firebase/patientPaymentSync";
import { fail, ok, adminOrgScope, withAuth } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = withAuth(
  { role: "admin" },
  async (request, { params }, auth) => {
    const uid = params?.uid;
    if (!uid) return fail("Missing uid", 400);

    try {
      await adminGetPatientDetail(uid, adminOrgScope(auth, request));
    } catch (err) {
      const msg = err?.message || "Not found";
      const status = msg.includes("different portal") ? 403 : 404;
      return fail(msg, status);
    }

    const result = await syncPatientPaymentByUid(uid);
    if (!result.ok) {
      return fail(`Could not sync payment (${result.reason}).`, 400);
    }

    const patient = await adminGetPatientDetail(uid, adminOrgScope(auth, request));
    return ok({ sync: result, patient });
  },
);
