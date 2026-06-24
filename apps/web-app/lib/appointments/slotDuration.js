// Consultation slot length — aligned with patient-facing "10–30 minutes" copy.

export const SLOT_DURATION_MIN = 10;
export const SLOT_DURATION_MAX = 30;
export const SLOT_DURATION_DEFAULT = 30;

/** Allowed slot lengths doctors can pick in onboarding and dashboard. */
export const SLOT_OPTIONS = [10, 15, 20, 30];

/**
 * Normalize stored slot duration to an allowed value (10–30 min).
 * Legacy values above 30 clamp to 30; unknown values snap to the nearest option.
 */
export function normalizeSlotDurationMinutes(value) {
  const sd = Number(value);
  if (!Number.isFinite(sd)) return SLOT_DURATION_DEFAULT;
  const rounded = Math.round(sd);
  if (SLOT_OPTIONS.includes(rounded)) return rounded;
  if (rounded < SLOT_DURATION_MIN) return SLOT_DURATION_MIN;
  if (rounded > SLOT_DURATION_MAX) return SLOT_DURATION_MAX;
  return SLOT_OPTIONS.reduce((best, opt) =>
    Math.abs(opt - rounded) < Math.abs(best - rounded) ? opt : best,
    SLOT_DURATION_DEFAULT,
  );
}
