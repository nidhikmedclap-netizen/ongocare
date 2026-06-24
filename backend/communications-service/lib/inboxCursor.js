const { Timestamp } = require("firebase-admin/firestore");

function encodeCursor(payload) {
  return Buffer.from(JSON.stringify(payload), "utf8")
    .toString("base64url");
}

function decodeCursor(raw, label = "cursor") {
  if (!raw || !String(raw).trim()) return null;
  try {
    const json = Buffer.from(String(raw).trim(), "base64url").toString("utf8");
    return JSON.parse(json);
  } catch (error) {
    const err = new Error(`invalid_${label}`);
    err.status = 400;
    throw err;
  }
}

function timestampToIso(value) {
  if (value == null) return null;
  if (typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function isoToTimestamp(iso) {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    const err = new Error("invalid_cursor");
    err.status = 400;
    throw err;
  }
  return Timestamp.fromDate(date);
}

function parseLimit(raw, defaultLimit, maxLimit) {
  const parsed = parseInt(String(raw ?? defaultLimit), 10);
  if (Number.isNaN(parsed) || parsed < 1) return defaultLimit;
  return Math.min(parsed, maxLimit);
}

module.exports = {
  encodeCursor,
  decodeCursor,
  timestampToIso,
  isoToTimestamp,
  parseLimit,
};
