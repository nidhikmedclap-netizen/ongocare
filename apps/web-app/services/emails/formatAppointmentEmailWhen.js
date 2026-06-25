// Patient-facing date/time labels for appointment emails.

import {
  convertSlot,
  formatDoctorAppointmentWhen,
  resolvePatientTimezone,
} from "@/lib/time/timezone";

export function formatAppointmentEmailWhen(appointment, profile = {}) {
  const state =
    profile?.state ||
    profile?.formSnapshot?.state ||
    profile?.onboarding?.state;
  const patientTz = resolvePatientTimezone({ state });
  const doctorTz = appointment?.doctorTimezone || "America/New_York";

  const view = convertSlot(
    { date: appointment?.date, time: appointment?.time },
    doctorTz,
    patientTz,
  );

  if (view?.patient?.dayLabel && view?.patient?.timeLabel) {
    return {
      appointmentDate: view.patient.dayLabel,
      appointmentTime: `${view.patient.timeLabel} ${view.patient.abbr || ""}`.trim(),
    };
  }

  const when = formatDoctorAppointmentWhen(appointment);
  if (!when) {
    return {
      appointmentDate: appointment?.date || "—",
      appointmentTime: appointment?.time || "—",
    };
  }
  return {
    appointmentDate: when.dayLabel || appointment?.date || "—",
    appointmentTime: `${when.timeLabel || appointment?.time || ""} ${when.abbr || ""}`.trim(),
  };
}
