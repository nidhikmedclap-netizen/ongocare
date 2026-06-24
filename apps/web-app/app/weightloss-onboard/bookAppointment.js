"use client";

import { auth } from "@/lib/firebase/auth";

/** Book the consultation slot selected during onboarding (server-side). */
export async function bookOnboardingAppointment(form, paymentIntentId = "") {
  if (!form.doctorUid || !form.slotDate || !form.slotTime) {
    return { ok: true, skipped: true };
  }
  const idToken = await auth.currentUser?.getIdToken();
  if (!idToken) return { ok: false, reason: "auth" };

  const res = await fetch("/api/appointments/book", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({
      doctorUid: form.doctorUid,
      date: form.slotDate,
      time: form.slotTime,
      type: "Initial consultation",
      paymentIntentId: paymentIntentId || form.paymentIntentId || "",
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 409) {
    return { ok: false, reason: "slot_taken", message: data?.message };
  }
  if (!res.ok || !data?.success) {
    return { ok: false, reason: "error", message: data?.message };
  }
  return { ok: true };
}
