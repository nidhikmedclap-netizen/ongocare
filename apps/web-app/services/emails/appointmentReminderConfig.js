// Shared appointment reminder timing (cron + booking).

export const APPOINTMENT_REMINDER_BEFORE_MINUTES = 2;
export const APPOINTMENT_REMINDER_BEFORE_MS =
  APPOINTMENT_REMINDER_BEFORE_MINUTES * 60 * 1000;
/** ±30s tolerance when matching the 2-minute mark (cron runs every minute). */
export const APPOINTMENT_REMINDER_WINDOW_MS = 30 * 1000;
