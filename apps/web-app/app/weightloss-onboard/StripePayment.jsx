"use client";

import { useEffect, useMemo, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  CardCvcElement,
  CardExpiryElement,
  CardNumberElement,
  Elements,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import {
  isValidName,
  isValidZip,
  sanitizeName,
  sanitizeZip,
  NAME_LIMIT,
} from "./utils";
import { auth } from "@/lib/firebase/auth";
import { PAYMENT_STATUS } from "@/lib/billing/stripePayment";
import { toastError } from "@/lib/ui/notify";
import { siteFontFamily } from "@/lib/typography/site-font";

const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
const KEY_CONFIGURED =
  PUBLISHABLE_KEY.length > 0 && !PUBLISHABLE_KEY.includes("REPLACE_ME");

let stripePromise = null;
const getStripe = () => {
  if (!KEY_CONFIGURED) return null;
  if (!stripePromise) stripePromise = loadStripe(PUBLISHABLE_KEY);
  return stripePromise;
};

const ELEMENT_STYLE = {
  base: {
    fontFamily: siteFontFamily,
    fontSize: "16px",
    lineHeight: "24px",
    color: "#111",
    "::placeholder": { color: "#bbb" },
    iconColor: "#2D6A4F",
  },
  invalid: { color: "#c4302b", iconColor: "#c4302b" },
};

const formatAmount = (cents, currency) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);

function PaymentForm({
  email,
  defaultFirstName,
  defaultLastName,
  defaultZip,
  amountCents,
  baseCents,
  discountCents,
  appliedCoupon,
  currency,
  clientSecret,
  planLabel,
  monthly,
  months,
  onSuccess,
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [firstName, setFirstName] = useState(defaultFirstName || "");
  const [lastName, setLastName] = useState(defaultLastName || "");
  const [zip, setZip] = useState(() => sanitizeZip(defaultZip || ""));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [zipError, setZipError] = useState("");
  const [cardBrand, setCardBrand] = useState("unknown");

  useEffect(() => {
    setFirstName(defaultFirstName || "");
  }, [defaultFirstName]);

  useEffect(() => {
    setLastName(defaultLastName || "");
  }, [defaultLastName]);

  useEffect(() => {
    setZip(sanitizeZip(defaultZip || ""));
  }, [defaultZip]);

  const cardholderName = `${firstName.trim()} ${lastName.trim()}`.trim();

  const formattedFinal = formatAmount(amountCents, currency);
  const formattedBase =
    baseCents != null && baseCents !== amountCents
      ? formatAmount(baseCents, currency)
      : null;
  const ready = stripe !== null && elements !== null;
  const zipValid = isValidZip(zip);
  const nameValid = isValidName(firstName) && isValidName(lastName);
  const canSubmit =
    ready && !submitting && nameValid && zipValid;

  const isAmex = cardBrand === "amex";
  const cvcPlaceholder = isAmex ? "1234" : "123";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    if (!isValidZip(zip)) {
      setZipError(
        "Enter a valid US ZIP code (5 digits or 5+4, e.g. 90210 or 90210-1234).",
      );
      return;
    }
    const cardNumber = elements.getElement(CardNumberElement);
    if (!cardNumber) return;

    setSubmitting(true);
    setError(null);

    const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
      clientSecret,
      {
        payment_method: {
          card: cardNumber,
          billing_details: {
            name: cardholderName,
            email,
            address: { postal_code: zip.trim() },
          },
        },
      }
    );

    if (stripeError) {
      const message = stripeError.message ?? "Your card could not be processed.";
      setError(message);
      toastError("Payment failed", message);
      setSubmitting(false);
      return;
    }

    if (
      paymentIntent?.status === "succeeded" ||
      paymentIntent?.status === "requires_capture"
    ) {
      let details = null;
      try {
        const idToken = await auth.currentUser?.getIdToken();
        const res = await fetch("/api/stripe/payment-details", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
          },
          body: JSON.stringify({ paymentIntentId: paymentIntent.id }),
        });
        const data = await res.json();
        if (data?.success) details = data;
      } catch {
        // Non-fatal: checkout completed; receipt enrichment is optional.
      }
      const paymentStatus =
        details?.paymentStatus ||
        (paymentIntent.status === "requires_capture"
          ? PAYMENT_STATUS.AUTHORIZED
          : PAYMENT_STATUS.CAPTURED);
      onSuccess({
        paymentIntentId: paymentIntent.id,
        stripeStatus: paymentIntent.status,
        paymentStatus,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        paidAt: Date.now(),
        cardholderName,
        couponCode: appliedCoupon?.code || "",
        couponId: appliedCoupon?.id || "",
        couponDiscountPercent: appliedCoupon?.discountPercent || null,
        couponDiscountAmount: discountCents || 0,
        baseAmount: baseCents || paymentIntent.amount,
        ...(details || {}),
      });
      return;
    }

    setError("Payment did not complete. Please try again.");
    setSubmitting(false);
  };

  return (
    <form className="pay-form" onSubmit={handleSubmit}>
      <div className="pay-summary">
        <div className="pay-summary-row">
          <span>{planLabel} plan</span>
          <strong style={{ textDecoration: formattedBase ? "line-through" : "none", opacity: formattedBase ? 0.6 : 1 }}>
            {formattedBase ?? formattedFinal}
          </strong>
        </div>
        {appliedCoupon && discountCents > 0 && (
          <div className="pay-summary-row" style={{ color: "#2D6A4F" }}>
            <span>Promo <strong>{appliedCoupon.code}</strong> ({appliedCoupon.discountPercent}% coupon)</span>
            <strong>−{formatAmount(discountCents, currency)}</strong>
          </div>
        )}
        {formattedBase && (
          <div className="pay-summary-row" style={{ borderTop: "1px solid rgba(0,0,0,0.08)", paddingTop: 6, marginTop: 4 }}>
            <span>Total today</span>
            <strong>{formattedFinal}</strong>
          </div>
        )}
        <div className="pay-summary-note">
          {months === 1
            ? `$${monthly} · 1-month program · charged today.`
            : `$${monthly} · ${months}-month program · one-time charge today.`}
        </div>
      </div>

      <label className="pay-label">Name on card</label>
      <div className="r2">
        <input
          className="inp"
          style={{ margin: 0 }}
          type="text"
          placeholder="First name"
          autoComplete="cc-given-name"
          value={firstName}
          onChange={(e) => setFirstName(sanitizeName(e.target.value))}
          maxLength={NAME_LIMIT}
        />
        <input
          className="inp"
          style={{ margin: 0 }}
          type="text"
          placeholder="Last name"
          autoComplete="cc-family-name"
          value={lastName}
          onChange={(e) => setLastName(sanitizeName(e.target.value))}
          maxLength={NAME_LIMIT}
        />
      </div>

      <label className="pay-label">Card number</label>
      <p className="pay-card-hint">
        {isAmex
          ? "American Express: 15 digits (4 · 6 · 5)."
          : "Visa and Mastercard: groups of 4. Spacing adjusts to your card type."}
      </p>
      <div className="pay-field pay-field-card">
        <CardNumberElement
          options={{
            style: ELEMENT_STYLE,
            showIcon: true,
            disableLink: true,
            placeholder: "Card number",
          }}
          onChange={(event) => {
            if (event.brand) setCardBrand(event.brand);
          }}
        />
      </div>

      <div className="r2">
        <div>
          <label className="pay-label">Expiry</label>
          <div className="pay-field">
            <CardExpiryElement options={{ style: ELEMENT_STYLE }} />
          </div>
        </div>
        <div>
          <label className="pay-label">CVC</label>
          <div className="pay-field">
            <CardCvcElement
              options={{
                style: ELEMENT_STYLE,
                placeholder: cvcPlaceholder,
              }}
            />
          </div>
        </div>
      </div>

      <label className="pay-label">ZIP / Postal code</label>
      <input
        className="inp"
        type="text"
        inputMode="numeric"
        placeholder="ZIP code"
        value={zip}
        onChange={(e) => {
          setZip(sanitizeZip(e.target.value));
          setZipError("");
        }}
        autoComplete="postal-code"
        maxLength={10}
      />
      {zipError || (zip.length > 0 && !zipValid) ? (
        <div className="field-err">
          {zipError ||
            "Enter a valid US ZIP code (5 digits or 5+4, e.g. 90210 or 90210-1234)."}
        </div>
      ) : null}

      {error && <div className="field-err">{error}</div>}

      <div className="pay-secure">
        🔒 Payments are encrypted and processed securely by Stripe.
      </div>

      <p className="pay-auth-note">
        Payment will authorize initially and after that it will be charged.
      </p>

      <button type="submit" className="cta cta-pay" disabled={!canSubmit}>
        {submitting ? "Processing…" : `Pay ${formattedFinal}`}
      </button>
    </form>
  );
}

/**
 * Promo-code input rendered above the card fields. Validates with
 * /api/coupons/validate, then asks the parent to RE-CREATE the
 * PaymentIntent with the coupon applied. We could try to mutate the PI
 * amount in place, but recreating is simpler and matches what Stripe
 * recommends for one-shot payments.
 *
 * Props:
 *   - applied: { code, discountPercent, id } | null
 *   - onApply(code)   → request the parent to recreate the PI with this code
 *   - onRemove()      → request the parent to recreate the PI without a code
 *   - disabled        → e.g. while the PI is currently being created
 */
function CouponInput({ applied, plan, orgSlug, onApply, onRemove, disabled }) {
  const [open, setOpen] = useState(!!applied);
  const [code, setCode] = useState(applied?.code || "");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  // Keep the input in sync if the parent clears the applied coupon
  // (e.g., because the plan changed and we tossed it out).
  useEffect(() => {
    if (!applied) setCode("");
    else setCode(applied.code);
  }, [applied]);

  const apply = async () => {
    const cleaned = code.trim().toUpperCase();
    if (!cleaned) return;
    setBusy(true);
    setErr("");
    try {
      // payment-intent re-validates server-side; skip duplicate /validate call.
      await onApply(cleaned);
    } catch (e) {
      setErr(e?.message || "Could not apply code.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setCode("");
    setErr("");
    await onRemove();
  };

  if (applied) {
    return (
      <div className="coupon-applied" role="status">
        <div>
          <strong>{applied.code}</strong> applied · {applied.discountPercent}% coupon
        </div>
        <button
          type="button"
          className="coupon-remove"
          onClick={remove}
          disabled={disabled || busy}
        >
          Remove
        </button>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        className="coupon-toggle"
        onClick={() => setOpen(true)}
        disabled={disabled}
      >
        Have a promo code?
      </button>
    );
  }

  return (
    <div className="coupon-row">
      <input
        className="inp coupon-input"
        type="text"
        placeholder="Promo code"
        value={code}
        onChange={(e) =>
          setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, "").slice(0, 32))
        }
        autoComplete="off"
        spellCheck={false}
        disabled={disabled || busy}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            apply();
          }
        }}
      />
      <button
        type="button"
        className="coupon-apply"
        onClick={apply}
        disabled={disabled || busy || !code.trim()}
      >
        {busy ? "Checking…" : "Apply"}
      </button>
      {err && (
        <div className="field-err coupon-err">{err}</div>
      )}
    </div>
  );
}

export default function StripePayment({
  email,
  firstName,
  lastName,
  zip,
  plan,
  planLabel,
  orgSlug,
  onSuccess,
}) {
  const stripeP = useMemo(() => getStripe(), []);
  const cardholderName = `${String(firstName || "").trim()} ${String(lastName || "").trim()}`.trim();
  const [clientSecret, setClientSecret] = useState(null);
  const [amountCents, setAmountCents] = useState(0);
  const [baseCents, setBaseCents] = useState(0);
  const [discountCents, setDiscountCents] = useState(0);
  const [currency, setCurrency] = useState("usd");
  const [monthly, setMonthly] = useState(0);
  const [months, setMonths] = useState(1);
  const [error, setError] = useState(null);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  // `creating` is true while we're (re)creating a PaymentIntent. Disables
  // the coupon controls so the user can't fire two requests in flight.
  const [creating, setCreating] = useState(false);

  // Create / re-create the PaymentIntent. Called on initial mount and
  // every time the patient applies or removes a coupon. We deliberately
  // don't bake the coupon into the dependency array of an effect because
  // we want the user's explicit "Apply" action to drive the call, not a
  // re-render side-effect.
  const buildIntent = async (couponCode) => {
    if (!KEY_CONFIGURED) {
      setError("Stripe is not configured yet — add your test keys to .env.");
      return null;
    }
    if (!plan) {
      setError("No plan selected.");
      return null;
    }
    setCreating(true);
    setError(null);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/stripe/payment-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({
          email,
          name: cardholderName,
          plan,
          orgSlug,
          firebaseUid: auth.currentUser?.uid || "",
          ...(couponCode ? { couponCode } : {}),
        }),
      });
      const data = await res.json();
      if (!data.success || !data.clientSecret) {
        const message = data.message ?? "Could not start payment.";
        if (couponCode) throw new Error(message);
        setError(message);
        return null;
      }
      setClientSecret(data.clientSecret);
      if (typeof data.amount === "number") setAmountCents(data.amount);
      if (typeof data.baseAmount === "number") setBaseCents(data.baseAmount);
      if (typeof data.discountAmount === "number") setDiscountCents(data.discountAmount);
      if (typeof data.currency === "string") setCurrency(data.currency);
      if (typeof data.monthly === "number") setMonthly(data.monthly);
      if (typeof data.months === "number") setMonths(data.months);
      setAppliedCoupon(data.coupon || null);
      return data;
    } catch (e) {
      if (couponCode) throw e;
      const message = e instanceof Error ? e.message : "Network error.";
      setError(message);
      return null;
    } finally {
      setCreating(false);
    }
  };

  // Initial PI creation (and reset when plan/email/name change).
  // We intentionally drop any applied coupon here — if the plan changes,
  // the price changes, and the coupon should be re-applied freshly.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const data = await buildIntent(null);
      if (cancelled || !data) return;
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, cardholderName, plan]);

  const handleApplyCoupon = async (code) => {
    await buildIntent(code);
  };

  const handleRemoveCoupon = async () => {
    await buildIntent(null);
  };

  if (error) {
    return <div className="field-err pay-fatal">{error}</div>;
  }

  if (!stripeP || !clientSecret) {
    return (
      <div className="pay-loading">
        <div className="pay-spinner" />
        <span>Preparing secure payment…</span>
      </div>
    );
  }

  return (
    <>
      <CouponInput
        applied={appliedCoupon}
        plan={plan}
        orgSlug={orgSlug}
        onApply={handleApplyCoupon}
        onRemove={handleRemoveCoupon}
        disabled={creating}
      />
      <Elements
        // Re-mount Elements when the clientSecret changes (i.e., after we
        // recreate the PI for a coupon). Stripe's <Elements> caches the
        // first clientSecret it sees, so without the key it would keep
        // confirming against the original (no-discount) PaymentIntent.
        key={clientSecret}
        stripe={stripeP}
      >
        <PaymentForm
          email={email}
          defaultFirstName={firstName}
          defaultLastName={lastName}
          defaultZip={zip}
          amountCents={amountCents}
          baseCents={baseCents}
          discountCents={discountCents}
          appliedCoupon={appliedCoupon}
          currency={currency}
          clientSecret={clientSecret}
          planLabel={planLabel}
          monthly={monthly}
          months={months}
          onSuccess={onSuccess}
        />
      </Elements>
    </>
  );
}
