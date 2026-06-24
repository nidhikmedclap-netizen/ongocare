// Ascending / descending sort for appointment date+time fields.

export function appointmentSortKey({ date, time } = {}) {
  return `${date || ""}T${time || ""}`;
}

export function compareAppointmentsAsc(a, b) {
  return appointmentSortKey(a).localeCompare(appointmentSortKey(b));
}

export function sortAppointmentsAsc(list) {
  return [...list].sort(compareAppointmentsAsc);
}
