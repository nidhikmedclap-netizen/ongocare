// app/api/doctor/patients/[uid]/route.js
//
// Full patient details for the signed-in doctor. We strictly verify the
// patient is assigned to THIS doctor before returning anything sensitive.
//
// Returns the user's top-level profile, the full onboarding map, and the
// list of appointments between this patient and this doctor.

import { adminDb } from "@/lib/firebase/admin";
import {
  isVisibleToDoctor,
  mergePaymentIntoOnboarding,
} from "@/lib/billing/patientPayment";
import { fail, ok, withAuth } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withAuth(
  { role: "doctor", activeDoctor: true },
  async (_request, { params }, { user }) => {
    const { uid } = params || {};
    if (!uid) return fail("Missing uid", 400);

    const userSnap = await adminDb.collection("users").doc(uid).get();
    if (!userSnap.exists || userSnap.data()?.role !== "patient") {
      return fail("Not found", 404);
    }

    const data = userSnap.data();
    const onb = data.onboarding || {};
    if (onb.doctorUid !== user.uid) return fail("Forbidden", 403);
    if (!isVisibleToDoctor(data)) return fail("Not found", 404);

    // Pull appointments between this patient and this doctor.
    const apptSnap = await adminDb
      .collection("appointments")
      .where("patientUid", "==", uid)
      .where("doctorUid", "==", user.uid)
      .get();

    const appointments = apptSnap.docs
      .map((d) => {
        const a = d.data();
        return {
          id: d.id,
          date: a.date || "",
          time: a.time || "",
          type: a.type || "",
          status: a.status || "scheduled",
          notes: a.notes || "",
          durationMinutes: a.durationMinutes || 30,
          prescriptionIssued: !!a.prescriptionIssued,
          prescriptionType: a.prescriptionType || "",
          prescriptionMedicationId: a.prescriptionMedicationId || "",
          prescriptionStrengthId: a.prescriptionStrengthId || "",
          prescriptionText: a.prescriptionText || "",
          prescriptionSignatureURL: a.prescriptionSignatureURL || "",
          cancelRemark: a.cancelRemark || "",
        };
      })
      .sort((a, b) => `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`));

    const patient = {
      uid,
      email: data.email || "",
      firstName: data.firstName || "",
      lastName: data.lastName || "",
      fullName:
        [data.firstName, data.lastName].filter(Boolean).join(" ") ||
        data.email ||
        "Patient",
      phone: data.phone || "",
      dob: data.dob || "",
      status: data.status || "incomplete",
      consentHIPAA: !!data.consentHIPAA,
      consentTelehealth: !!data.consentTelehealth,
      emailVerified: !!data.emailVerified,
      createdAtMs:
        typeof data.createdAt?.toMillis === "function"
          ? data.createdAt.toMillis()
          : null,
      onboarding: mergePaymentIntoOnboarding(data),
      appointments,
    };

    return ok({ patient });
  },
);
