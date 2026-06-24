const { Timestamp } = require("firebase-admin/firestore");

const PRESETS = new Set(["today", "7d", "30d", "custom"]);

function startOfUtcDay(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function parseIsoDate(value, label) {
  const text = String(value || "").trim();
  if (!text) return null;
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) {
    const error = new Error(`invalid_${label}`);
    error.status = 400;
    throw error;
  }
  return date;
}

function parseAnalyticsRange(query = {}) {
  const preset = String(query.range || query.preset || "7d").trim().toLowerCase();
  if (!PRESETS.has(preset)) {
    const error = new Error("invalid_range");
    error.status = 400;
    throw error;
  }

  const now = new Date();
  let from;
  let to = now;

  if (preset === "today") {
    from = startOfUtcDay(now);
  } else if (preset === "7d") {
    from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (preset === "30d") {
    from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  } else {
    from = parseIsoDate(query.from, "from");
    to = parseIsoDate(query.to || query.until, "to") || now;
    if (!from) {
      const error = new Error("from_required_for_custom_range");
      error.status = 400;
      throw error;
    }
    if (from.getTime() > to.getTime()) {
      const error = new Error("invalid_range_bounds");
      error.status = 400;
      throw error;
    }
  }

  return {
    preset,
    from,
    to,
    fromIso: from.toISOString(),
    toIso: to.toISOString(),
    fromTimestamp: Timestamp.fromDate(from),
    toTimestamp: Timestamp.fromDate(to),
  };
}

function timestampMillis(value) {
  if (value == null) return null;
  if (typeof value.toMillis === "function") return value.toMillis();
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.getTime();
}

function isWithinRange(value, range) {
  const millis = timestampMillis(value);
  if (millis == null) return false;
  return millis >= range.from.getTime() && millis <= range.to.getTime();
}

module.exports = {
  PRESETS,
  parseAnalyticsRange,
  timestampMillis,
  isWithinRange,
};
