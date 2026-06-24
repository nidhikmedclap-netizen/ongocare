// lib/billing/patientPayment.js
//
// Patient payment state for doctor visibility, dashboards, and admin views.
// Reads denormalized users/* summary first, then legacy onboarding fields.

import { PAYMENT_STATUS } from "@/lib/billing/stripePayment";

/**
 * Build a unified payment view from a user doc (preferred) or onboarding map.
 */
export function getPaymentSnapshot(source) {
  if (!source || typeof source !== "object") return {};

  if (
    source.planPaymentId ||
    source.paymentStatus ||
    source.paymentAmountCents != null ||
    source.hasPlanCheckout
  ) {
    const captured = source.paymentStatus === PAYMENT_STATUS.CAPTURED;
    return {
      paymentIntentId: source.planPaymentId || "",
      paymentAmount:
        typeof source.paymentAmountCents === "number"
          ? source.paymentAmountCents
          : null,
      paymentCurrency: source.paymentCurrency || "usd",
      paymentStatus: source.paymentStatus || PAYMENT_STATUS.NONE,
      paid: captured,
      paidAt: source.paidAtMs ?? null,
      paymentAuthorizedAt: source.paymentAuthorizedAtMs ?? null,
      paymentBrand: source.paymentBrand || "",
      paymentLast4: source.paymentLast4 || "",
      paymentExpMonth: source.paymentExpMonth ?? null,
      paymentExpYear: source.paymentExpYear ?? null,
      paymentCardholder: source.paymentCardholder || "",
      plan: source.plan || source.onboarding?.plan || "",
    };
  }

  if (source.onboarding && typeof source.onboarding === "object") {
    return { ...source.onboarding, plan: source.onboarding.plan || "" };
  }

  return source;
}

/** Resolve effective payment status from onboarding or user summary. */
export function resolvePaymentStatus(onb) {
  const snap = getPaymentSnapshot(onb);
  if (!snap || typeof snap !== "object") return PAYMENT_STATUS.NONE;
  const raw = snap.paymentStatus;
  if (raw === PAYMENT_STATUS.CAPTURED || raw === PAYMENT_STATUS.AUTHORIZED) {
    return raw;
  }
  if (raw === PAYMENT_STATUS.CANCELED) return PAYMENT_STATUS.CANCELED;
  if (snap.paid) return PAYMENT_STATUS.CAPTURED;
  return PAYMENT_STATUS.NONE;
}

/** Card authorized or fully captured — doctor roster + detail access. */
export function isVisibleToDoctor(onb) {
  const status = resolvePaymentStatus(onb);
  return (
    status === PAYMENT_STATUS.AUTHORIZED || status === PAYMENT_STATUS.CAPTURED
  );
}

/** Money captured — counts as fully paid in reports. */
export function isPaymentCaptured(onb) {
  return resolvePaymentStatus(onb) === PAYMENT_STATUS.CAPTURED;
}

/** Hold placed, not yet captured in Stripe. */
export function isPaymentAuthorized(onb) {
  return resolvePaymentStatus(onb) === PAYMENT_STATUS.AUTHORIZED;
}

/** Patient completed checkout (authorized or captured). */
export function hasPlanCheckout(onb) {
  return isVisibleToDoctor(onb);
}

/**
 * True when the patient dashboard should show resume-onboarding CTAs
 * (checkout not completed yet).
 */
export function needsOnboardingResume(profile) {
  return !hasPlanCheckout(mergePaymentIntoOnboarding(profile));
}

export function paymentStatusLabel(onb) {
  const status = resolvePaymentStatus(onb);
  if (status === PAYMENT_STATUS.CAPTURED) return "Paid";
  if (status === PAYMENT_STATUS.AUTHORIZED) return "Authorized";
  if (status === PAYMENT_STATUS.CANCELED) return "Canceled";
  return "Awaiting payment";
}

export function paymentStatusPillTone(onb) {
  const status = resolvePaymentStatus(onb);
  if (status === PAYMENT_STATUS.CAPTURED) return "ok";
  if (status === PAYMENT_STATUS.AUTHORIZED) return "warn";
  return "muted";
}

/** Shape compatible with dashboard components that read onboarding fields. */
export function mergePaymentIntoOnboarding(userData) {
  const onb = { ...(userData?.onboarding || {}) };
  const pay = getPaymentSnapshot(userData);
  if (!pay.paymentIntentId && pay.paymentStatus === PAYMENT_STATUS.NONE) {
    return onb;
  }
  return {
    ...onb,
    paymentIntentId: pay.paymentIntentId || onb.paymentIntentId || "",
    paymentAmount: pay.paymentAmount ?? onb.paymentAmount ?? null,
    paymentCurrency: pay.paymentCurrency || onb.paymentCurrency || "usd",
    paymentStatus: pay.paymentStatus || onb.paymentStatus || "",
    paid: pay.paid ?? onb.paid,
    paidAt: pay.paidAt ?? onb.paidAt,
    paymentAuthorizedAt: pay.paymentAuthorizedAt ?? onb.paymentAuthorizedAt,
    paymentBrand: pay.paymentBrand || onb.paymentBrand || "",
    paymentLast4: pay.paymentLast4 || onb.paymentLast4 || "",
    paymentExpMonth: pay.paymentExpMonth ?? onb.paymentExpMonth,
    paymentExpYear: pay.paymentExpYear ?? onb.paymentExpYear,
    paymentCardholder: pay.paymentCardholder || onb.paymentCardholder || "",
    plan: pay.plan || onb.plan || "",
  };
}
