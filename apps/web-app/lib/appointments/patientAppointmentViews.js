// Shared patient appointment list shaping for dashboard + appointments page.

import {
  appointmentInstantMs,
  convertSlot,
} from "@/lib/time/timezone";
import { sortAppointmentsAsc } from "@/lib/appointments/sort";

export function buildPatientAppointmentFallback(onb) {
  if (!onb) return null;
  const date = onb.slotDate || "";
  const time = onb.slotTime || "";
  if (!date && !time && !onb.slot && !onb.doctor) return null;
  let d = date;
  let t = time;
  if (!d && !t && typeof onb.slot === "string" && onb.slot.includes("|")) {
    [d, t] = onb.slot.split("|");
  }
  return {
    id: "legacy",
    doctorName: onb.doctor || "",
    type: "Initial consultation",
    date: d || "",
    time: t || "",
    doctorTimezone: onb.doctorTimezone || "America/New_York",
    status: "scheduled",
  };
}

export function mergePatientAppointmentList(rows, onb) {
  if (rows && rows.length > 0) return rows;
  const fallback = buildPatientAppointmentFallback(onb);
  return fallback ? [fallback] : [];
}

export function decoratePatientAppointments(list, patientTz) {
  return list.map((a) => {
    const view = convertSlot(
      { date: a.date, time: a.time },
      a.doctorTimezone || "America/New_York",
      patientTz,
    );
    return {
      ...a,
      view,
      instantMs:
        view?.instantMs ??
        appointmentInstantMs(a.date, a.time, a.doctorTimezone),
    };
  });
}

export function filterUpcomingPatientAppointments(decorated, nowMs = Date.now()) {
  const upcoming = decorated.filter((a) => {
    return (
      a.status !== "cancelled" &&
      a.status !== "completed" &&
      a.instantMs &&
      a.instantMs >= nowMs
    );
  });
  return sortAppointmentsAsc(upcoming);
}

export function filterPastPatientAppointments(decorated, nowMs = Date.now()) {
  return decorated.filter((a) => {
    return (
      a.status === "completed" ||
      a.status === "cancelled" ||
      (a.instantMs && a.instantMs < nowMs)
    );
  });
}

export function patientAppointmentStatusDisplay(status) {
  if (status === "cancelled") {
    return { label: "Cancelled", pillClass: "pillWarn" };
  }
  if (status === "completed") {
    return { label: "Completed", pillClass: "pillNeutral" };
  }
  return { label: "Scheduled", pillClass: "pillOk" };
}
