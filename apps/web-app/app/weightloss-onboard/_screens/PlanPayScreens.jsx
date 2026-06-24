"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { PAYMENT_STATUS } from "@/lib/billing/stripePayment";
import { hasPlanCheckout } from "@/lib/billing/patientPayment";
import { toastError, toastSuccess } from "@/lib/ui/notify";
import { PlanCard } from "../components";
import { bookOnboardingAppointment } from "../bookAppointment";
import { saveOnboardingProgress } from "../firebaseClient";
import { useOnboard, useScreenContent } from "./OnboardContext";

const sPlanDefaults = {
  label: "Choose your plan",
  ctaLabel: "Continue",
};

const sPayDefaults = {
  label: "Payment",
  question: "Secure your plan",
  subtitleTemplate: "Complete your one-time payment to activate your {plan}.",
  loadingText: "Preparing secure payment…",
};

const StripePayment = dynamic(() => import("../StripePayment"), {
  ssr: false,
  loading: () => (
    <div className="pay-loading">
      <div className="pay-spinner" />
      <span>Preparing secure payment…</span>
    </div>
  ),
});

function buildPaymentForm(form, receipt, paymentStatus, isCaptured, checkoutAt) {
  return {
    ...form,
    paid: isCaptured,
    paymentStatus,
    paymentIntentId: receipt.paymentIntentId || "",
    paymentAmount: receipt.amount ?? form.paymentAmount ?? null,
    paymentCurrency: receipt.currency || form.paymentCurrency || "",
    paymentBrand: receipt.brand || form.paymentBrand || "",
    paymentLast4: receipt.last4 || form.paymentLast4 || "",
    paymentExpMonth: receipt.expMonth ?? form.paymentExpMonth ?? null,
    paymentExpYear: receipt.expYear ?? form.paymentExpYear ?? null,
    paymentCardholder: receipt.cardholderName || form.paymentCardholder || "",
    couponCode: receipt.couponCode || form.couponCode || "",
    couponId: receipt.couponId || form.couponId || "",
    couponDiscountPercent: receipt.couponDiscountPercent ?? form.couponDiscountPercent ?? null,
    couponDiscountAmount: receipt.couponDiscountAmount ?? form.couponDiscountAmount ?? 0,
    paymentBaseAmount: receipt.baseAmount ?? receipt.amount ?? form.paymentBaseAmount ?? null,
    ...(isCaptured
      ? { paidAt: checkoutAt }
      : { paymentAuthorizedAt: checkoutAt }),
  };
}

function applyPaymentFields(updateField, paymentForm) {
  updateField("paid", paymentForm.paid);
  updateField("paymentStatus", paymentForm.paymentStatus);
  if (paymentForm.paidAt) updateField("paidAt", paymentForm.paidAt);
  if (paymentForm.paymentAuthorizedAt) {
    updateField("paymentAuthorizedAt", paymentForm.paymentAuthorizedAt);
  }
  updateField("paymentIntentId", paymentForm.paymentIntentId);
  updateField("paymentAmount", paymentForm.paymentAmount);
  updateField("paymentCurrency", paymentForm.paymentCurrency);
  updateField("paymentBrand", paymentForm.paymentBrand);
  updateField("paymentLast4", paymentForm.paymentLast4);
  updateField("paymentExpMonth", paymentForm.paymentExpMonth);
  updateField("paymentExpYear", paymentForm.paymentExpYear);
  updateField("paymentCardholder", paymentForm.paymentCardholder);
  updateField("couponCode", paymentForm.couponCode);
  updateField("couponId", paymentForm.couponId);
  updateField("couponDiscountPercent", paymentForm.couponDiscountPercent);
  updateField("couponDiscountAmount", paymentForm.couponDiscountAmount);
  updateField("paymentBaseAmount", paymentForm.paymentBaseAmount);
}

export function SPlan() {
  const { form, updateField, goTo, planScreenIsValid } = useOnboard();
  const c = useScreenContent("sPlan", sPlanDefaults);

  useEffect(() => {
    if (hasPlanCheckout(form)) {
      goTo("iConfirm");
    }
  }, [form, goTo]);

  return (
    <div className="sc">
      <div className="slabel">{c.label}</div>
      <PlanCard
        selectedPlanId={form.plan}
        onSelectPlan={(planId) => updateField("plan", planId)}
      />
      <button
        type="button"
        className="cta cta-plan"
        disabled={!planScreenIsValid}
        onClick={() => goTo("sPay")}
      >
        {c.ctaLabel}
      </button>
    </div>
  );
}

export function SPay() {
  const { form, updateField, goTo, selectedPlan, submitMauticOnComplete } = useOnboard();
  const c = useScreenContent("sPay", sPayDefaults);

  useEffect(() => {
    if (hasPlanCheckout(form)) {
      goTo("iConfirm");
    }
  }, [form, goTo]);

  const planSubtitle = (c.subtitleTemplate ?? "").replace(
    "{plan}",
    selectedPlan?.label ?? "plan",
  );

  return (
    <div className="sc">
      <div className="slabel">{c.label}</div>
      <div className="q">{c.question}</div>
      <div className="qs">{planSubtitle}</div>
      <StripePayment
        email={form.email}
        firstName={form.firstName}
        lastName={form.lastName}
        zip={form.zip}
        plan={form.plan}
        planLabel={selectedPlan?.label ?? ""}
        orgSlug={form.orgSlug || ""}
        onSuccess={async (receipt = {}) => {
          const paymentStatus =
            receipt.paymentStatus ||
            (receipt.stripeStatus === "requires_capture"
              ? PAYMENT_STATUS.AUTHORIZED
              : PAYMENT_STATUS.CAPTURED);
          const isCaptured = paymentStatus === PAYMENT_STATUS.CAPTURED;
          const checkoutAt = receipt.paidAt || Date.now();
          const paymentForm = buildPaymentForm(
            form,
            receipt,
            paymentStatus,
            isCaptured,
            checkoutAt,
          );

          applyPaymentFields(updateField, paymentForm);

          if (isCaptured) {
            toastSuccess("Payment successful", "Your plan payment was completed.");
          } else {
            toastSuccess(
              "Payment authorized",
              "Your card was authorized. You're all set to continue.",
            );
          }

          await saveOnboardingProgress(
            paymentForm,
            "sPay",
            undefined,
            form.orgSlug || "",
          );

          const booking = await bookOnboardingAppointment(
            paymentForm,
            receipt.paymentIntentId || "",
          );

          if (booking.reason === "slot_taken") {
            toastError(
              "Slot unavailable",
              "That time was just taken. We'll follow up to reschedule your consultation.",
            );
          } else if (!booking.ok && !booking.skipped) {
            // eslint-disable-next-line no-console
            console.warn("[booking] failed to create appointment record:", booking.message);
          }

          await saveOnboardingProgress(
            paymentForm,
            "iConfirm",
            "onboarded",
            form.orgSlug || "",
          );

          submitMauticOnComplete({ paid: isCaptured, paymentStatus }, "iConfirm");
          goTo("iConfirm");
        }}
      />
    </div>
  );
}
