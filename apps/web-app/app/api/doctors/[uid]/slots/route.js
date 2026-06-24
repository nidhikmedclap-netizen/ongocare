// app/api/doctors/[uid]/slots/route.js
//
// Public endpoint returning every available slot for a given doctor over
// the next ~3 weeks. Used by the patient-facing booking screen.
//
// "Available" means: inside a weeklySchedule window, not on a blocked date,
// not in the past, and not already booked by another patient.

import {
  getOrDefaultAvailability,
  generateSlots,
} from "@/services/firebase/availability";
import { bookedSlotKeysForDoctor } from "@/services/firebase/appointments";
import { getDoctor } from "@/services/firebase/doctors";
import { resolveDoctorTimezone } from "@/lib/time/timezone";
import { fail, ok, withErrorHandling } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withErrorHandling(async (_request, { params }) => {
  const { uid } = params || {};
  if (!uid) return fail("Missing uid", 400);

  const doctor = await getDoctor(uid);
  if (!doctor) return fail("Doctor not found", 404);
  if (doctor.status && doctor.status !== "active") {
    return fail("Doctor not found", 404);
  }

  const [availability, booked] = await Promise.all([
    getOrDefaultAvailability(uid, { homeState: doctor.homeState }),
    bookedSlotKeysForDoctor(uid),
  ]);

  const slots = generateSlots(availability, booked, 21, { includeBooked: true });
  const timezone = resolveDoctorTimezone({
    homeState: doctor.homeState,
    availabilityTz: availability.timezone,
    licensedStates: doctor.licensedStates,
  });
  return ok({
    doctor: {
      uid: doctor.uid,
      fullName: doctor.fullName,
      firstName: doctor.firstName,
      lastName: doctor.lastName,
      photoURL: doctor.photoURL || "",
      licensedStates: doctor.licensedStates || [],
      homeState: doctor.homeState || "",
    },
    slotDurationMinutes: availability.slotDurationMinutes,
    timezone,
    slots,
  });
});
