const { Timestamp } = require("firebase-admin/firestore");

function pickString(body, ...keys) {
  for (const key of keys) {
    const value = body && body[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value).trim();
    }
  }
  return null;
}

function pickInt(body, ...keys) {
  const raw = pickString(body, ...keys);
  if (raw === null) return null;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : null;
}

function parseTwilioTimestamp(value) {
  const raw = value != null ? String(value).trim() : "";
  if (!raw) return null;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;
  return Timestamp.fromDate(date);
}

function isAnsweredStatus(status) {
  const s = String(status || "").trim().toLowerCase();
  return s === "in-progress" || s === "answered";
}

function isCompletedStatus(status) {
  return String(status || "").trim().toLowerCase() === "completed";
}

function secondsBetween(earlier, later) {
  if (!earlier || !later) return null;
  const a = earlier.toDate ? earlier.toDate() : new Date(earlier);
  const b = later.toDate ? later.toDate() : new Date(later);
  const diff = Math.round((b.getTime() - a.getTime()) / 1000);
  return diff >= 0 ? diff : null;
}

module.exports = {
  pickString,
  pickInt,
  parseTwilioTimestamp,
  isAnsweredStatus,
  isCompletedStatus,
  secondsBetween,
};
