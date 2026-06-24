// lib/billing/money.js
//
// Shared money + plan labels for billing UI (client and server safe).

import { formatUsDate } from "@/lib/dates/usDate";

export const PLAN_LABELS = {
  "1m": "1-month program",
  "3m": "3-month program",
  "6m": "6-month program",
};

export function toPaidAtMs(value) {
  if (value == null) return null;
  if (typeof value === "number") return value;
  if (typeof value?.toMillis === "function") return value.toMillis();
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function formatMoney(cents, currency = "usd") {
  if (cents == null || !Number.isFinite(cents)) return "—";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: String(currency).toUpperCase(),
    }).format(cents / 100);
  } catch {
    return `$${(cents / 100).toFixed(2)}`;
  }
}

export function formatPaidDate(ms) {
  return formatUsDate(ms);
}
