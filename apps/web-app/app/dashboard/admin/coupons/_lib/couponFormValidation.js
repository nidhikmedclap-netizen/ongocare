// Client-side validation for super-admin coupon create/edit forms.
// Mirrors server rules in services/firebase/coupons.js.

import { PLAN_IDS } from "@/lib/billing/plans";

const CODE_REGEX = /^[A-Z0-9_-]{3,32}$/;

export function couponFormFieldErrors(values, { isEdit = false } = {}) {
  const errors = {};

  if (!isEdit) {
    const code = String(values.code || "").trim().toUpperCase();
    if (!code) {
      errors.code = "Enter a coupon code.";
    } else if (!CODE_REGEX.test(code)) {
      errors.code =
        "Code must be 3–32 characters, letters, digits, hyphen, or underscore only.";
    }
  }

  const pctRaw = String(values.discountPercent ?? "").trim();
  if (!pctRaw) {
    errors.discountPercent = "Enter a discount percent.";
  } else {
    const pct = Number(pctRaw);
    if (!Number.isInteger(pct) || pct < 1 || pct > 100) {
      errors.discountPercent =
        "Discount percent must be a whole number between 1 and 100.";
    }
  }

  const maxDiscRaw = String(values.maxDiscountDollars ?? "").trim();
  if (maxDiscRaw) {
    const n = Number(maxDiscRaw);
    if (!Number.isFinite(n) || n <= 0) {
      errors.maxDiscountDollars =
        "Max discount must be a positive dollar amount, or leave blank.";
    } else if (Math.round(n * 100) < 1) {
      errors.maxDiscountDollars = "Max discount must be at least $0.01.";
    }
  }

  const plans = Array.isArray(values.eligiblePlans)
    ? values.eligiblePlans.filter((p) => PLAN_IDS.includes(p))
    : [];
  if (plans.length === 0) {
    errors.eligiblePlans = "Select at least one plan this coupon applies to.";
  }

  const maxUsesRaw = String(values.maxUses ?? "").trim();
  if (maxUsesRaw) {
    const n = Number(maxUsesRaw);
    if (!Number.isInteger(n) || n < 1) {
      errors.maxUses =
        "Max uses must be a whole number of 1 or higher, or leave blank.";
    }
  }

  const expiresRaw = String(values.expiresAtDate ?? "").trim();
  if (expiresRaw) {
    const ms = new Date(`${expiresRaw}T23:59:59Z`).getTime();
    if (!Number.isFinite(ms)) {
      errors.expiresAtDate = "Enter a valid expiry date.";
    } else if (ms <= Date.now()) {
      errors.expiresAtDate = "Expiry must be a future date.";
    }
  }

  return errors;
}

export function couponFormIsValid(errors) {
  return Object.keys(errors).length === 0;
}

export function couponFormSummaryError(errors) {
  const keys = Object.keys(errors);
  if (keys.length === 0) return "";
  if (keys.length === 1) return errors[keys[0]];
  return "Fix the highlighted fields below.";
}
