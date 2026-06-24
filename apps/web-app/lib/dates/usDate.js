// U.S. display formatting for dates across the platform (MM/DD/YYYY).

export const US_DATE_LOCALE = "en-US";

const US_DATE_OPTIONS = {
  month: "2-digit",
  day: "2-digit",
  year: "numeric",
};

const US_TIME_OPTIONS = {
  hour: "numeric",
  minute: "2-digit",
};

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function parseToDate(input) {
  if (input == null || input === "") return null;
  if (input instanceof Date) {
    return Number.isNaN(input.getTime()) ? null : input;
  }
  if (typeof input === "number") {
    const d = new Date(input);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof input === "string") {
    if (ISO_DATE_RE.test(input)) {
      const [y, m, d] = input.split("-").map(Number);
      const parsed = new Date(y, m - 1, d);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
    const parsed = new Date(input);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

/** MM/DD/YYYY — accepts epoch ms, Date, ISO date, or parseable datetime string. */
export function formatUsDate(input, fallback = "—") {
  const date = parseToDate(input);
  if (!date) return fallback;
  return date.toLocaleDateString(US_DATE_LOCALE, US_DATE_OPTIONS);
}

/** Time only — e.g. 9:45 AM */
export function formatUsTime(input, fallback = "") {
  const date = parseToDate(input);
  if (!date) return fallback;
  return date.toLocaleTimeString(US_DATE_LOCALE, US_TIME_OPTIONS);
}

/** MM/DD/YYYY · 9:45 AM */
export function formatUsDateTime(input, separator = " · ", fallback = "—") {
  const date = parseToDate(input);
  if (!date) return fallback;
  return `${formatUsDate(date)}${separator}${formatUsTime(date)}`;
}

/** YYYY-MM-DD → MM/DD/YYYY */
export function formatIsoDateUs(iso, fallback = "—") {
  if (!iso || typeof iso !== "string") return fallback;
  if (!ISO_DATE_RE.test(iso)) return iso;
  return formatUsDate(iso, fallback);
}

/** MM/DD/YYYY HH:mm from separate ISO date + 24h time parts */
export function formatIsoDateTimeUs(isoDate, isoTime, fallback = "—") {
  if (!ISO_DATE_RE.test(isoDate || "") || !/^\d{2}:\d{2}$/.test(isoTime || "")) {
    return fallback;
  }
  const [y, m, d] = isoDate.split("-").map(Number);
  const [h, mn] = isoTime.split(":").map(Number);
  return formatUsDateTime(new Date(y, m - 1, d, h, mn), " · ", fallback);
}
