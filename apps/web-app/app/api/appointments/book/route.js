// app/api/appointments/book/route.js
//
// Called when the patient finalizes their booking (typically right after
// payment succeeds). Verifies the patient's ID token, confirms the chosen
// slot is still available, then creates the appointment in Firestore.

import { adminDb } from "@/lib/firebase/admin";
import {
  bookedSlotKeysForDoctor,
  createAppointmentAtomic,
} from "@/services/firebase/appointments";
import { getOrDefaultAvailability } from "@/services/firebase/availability";
import { getDoctor } from "@/services/firebase/doctors";
import { resolveDoctorTimezone } from "@/lib/time/timezone";
import { hasPlanCheckout, mergePaymentIntoOnboarding } from "@/lib/billing/patientPayment";
import { verifyPaymentIntentForUser } from "@/lib/billing/verifyPlanPayment";
import { fail, ok, withAuth } from "@/lib/api";
import { sendPatientAppointmentEmail } from "@/services/emails/sendPatientAppointmentEmail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = withAuth(
  { role: "patient" },
  async (request, _ctx, { decoded }) => {
  const body = await request.json().catch(() => ({}));
  const doctorUid = String(body.doctorUid || "");
  const date = String(body.date || "");
  const time = String(body.time || "");
  const type = String(body.type || "Initial consultation");

  if (!doctorUid || !date || !time) {
    return fail("doctorUid, date, and time are required.", 400);
  }

  const doctor = await getDoctor(doctorUid);
  if (!doctor) return fail("Doctor not found.", 404);
  if (doctor.status && doctor.status !== "active") {
    return fail("Doctor is not available for booking.", 400);
  }

  // Pull patient info from their users/{uid} doc so we can denormalize.
  const patientSnap = await adminDb.collection("users").doc(decoded.uid).get();
  const patient = patientSnap.exists ? patientSnap.data() : {};
  const paymentOk = hasPlanCheckout(mergePaymentIntoOnboarding(patient));
  if (!paymentOk) {
    const paymentIntentId = String(body.paymentIntentId || "").trim();
    if (!paymentIntentId) {
      return fail("Complete payment before booking an appointment.", 403);
    }
    try {
      await verifyPaymentIntentForUser(paymentIntentId, {
        uid: decoded.uid,
        email: decoded.email || patient.email || "",
      });
    } catch {
      return fail("Complete payment before booking an appointment.", 403);
    }
  }
  const patientName =
    [patient.firstName, patient.lastName].filter(Boolean).join(" ") ||
    decoded.email ||
    "Patient";

  // Race-condition guard — re-check the slot is still free.
  const booked = await bookedSlotKeysForDoctor(doctorUid);
  if (booked.has(`${date}|${time}`)) {
    return fail("That slot was just taken. Please pick another.", 409);
  }

  // Stamp the tenant from the patient's user doc — the patient's portal
  // is the source of truth for which tenant an appointment belongs to.
  // Falls back to the doctor's orgSlug if the patient's doc is missing it.
  const orgSlug = patient.orgSlug || null;

  // Capture the doctor's home-state timezone alongside the appointment so
  // patients in other timezones can convert the wall time on display.
  let doctorTimezone = resolveDoctorTimezone({ homeState: doctor.homeState });
  try {
    const availability = await getOrDefaultAvailability(doctorUid, {
      homeState: doctor.homeState,
    });
    doctorTimezone = resolveDoctorTimezone({
      homeState: doctor.homeState,
      availabilityTz: availability?.timezone,
      licensedStates: doctor.licensedStates,
    });
  } catch {
    // Fall back to home state — the rest of the booking should still go through.
  }

  try {
    const appointment = await createAppointmentAtomic({
      orgSlug,
      patientUid: decoded.uid,
      patientName,
      patientEmail: patient.email || decoded.email || "",
      doctorUid,
      doctorName: doctor.fullName,
      doctorTimezone,
      type,
      date,
      time,
      durationMinutes: 30,
      status: "scheduled",
    });
    try {
      await sendPatientAppointmentEmail({
        uid: decoded.uid,
        appointment,
      });
    } catch (emailErr) {
      // eslint-disable-next-line no-console
      console.error("[appointments/book] confirmation email failed:", emailErr);
    }
    return ok({ appointment });
  } catch (err) {
    if (err?.code === "SLOT_TAKEN") {
      return fail(err.message, 409);
    }
    throw err;
  }
},
);
