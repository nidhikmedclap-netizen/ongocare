// app/dashboard/patient/plan/page.jsx
//
// Plan & billing — shows the patient's selected program, the card they paid
// with (brand + last4 + expiry, sourced server-side from Stripe at payment
// time, never re-read from the card itself), when they paid, and when their
// program ends. If the user hasn't paid yet, we show a CTA that sends them
// back into the onboarding payment screen.

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthUser } from "@/lib/auth/useAuthUser";
import { onboardingResumePathFromProfile } from "@/lib/onboarding/resumePath";
import {
  hasPlanCheckout,
  isPaymentAuthorized,
  isPaymentCaptured,
  mergePaymentIntoOnboarding,
  paymentStatusLabel,
} from "@/lib/billing/patientPayment";
import { auth } from "@/lib/firebase/auth";
import { formatUsDate, formatUsDateTime, formatUsTime } from "@/lib/dates/usDate";
import { userErrorMessage } from "@/lib/ui/userErrorMessage";
import styles from "../dashboard.module.css";

const PLAN_LABELS = {
  "1m": "1-month program",
  "3m": "3-month program",
  "6m": "6-month program",
};
const PLAN_DURATION_DAYS = { "1m": 30, "3m": 90, "6m": 180 };
const PLAN_MONTHS = { "1m": 1, "3m": 3, "6m": 6 };

export default function PatientPlanPage() {
  const { profile, user } = useAuthUser();
  const onb = mergePaymentIntoOnboarding(profile);
  const resumeHref = onboardingResumePathFromProfile(profile);
  const history = usePaymentHistory(user);

  const planKey = onb.plan || "";
  const planLabel = PLAN_LABELS[planKey] || null;
  const checkoutComplete = hasPlanCheckout(onb);
  const isPaid = isPaymentCaptured(onb);
  const isAuthorized = isPaymentAuthorized(onb);
  const payLabel = paymentStatusLabel(onb);

  const paidAtMs = toMillis(
    isPaid ? onb.paidAt : isAuthorized ? onb.paymentAuthorizedAt : onb.paidAt,
  );
  const durationDays = PLAN_DURATION_DAYS[planKey] || 0;
  const expiresAtMs =
    paidAtMs && durationDays ? paidAtMs + durationDays * 86400000 : null;
  const daysLeft =
    expiresAtMs != null
      ? Math.max(0, Math.ceil((expiresAtMs - Date.now()) / 86400000))
      : null;
  const totalDays = durationDays || null;
  const progressPct =
    paidAtMs && totalDays
      ? Math.min(
          100,
          Math.max(
            0,
            Math.round(((Date.now() - paidAtMs) / (totalDays * 86400000)) * 100),
          ),
        )
      : 0;

  const paymentFallback =
    checkoutComplete && onb.paymentAmount != null
      ? [
          {
            id: onb.paymentIntentId || "current",
            amount: onb.paymentAmount,
            currency: onb.paymentCurrency,
            paidAt: paidAtMs,
            plan: planKey,
            brand: onb.paymentBrand,
            last4: onb.paymentLast4,
          },
        ]
      : [];

  const paymentRows =
    history.payments?.length > 0 ? history.payments : paymentFallback;
  const paymentTotalCents = sumPaymentAmounts(paymentRows);
  const paymentCurrency =
    history.currency || paymentRows[0]?.currency || onb.paymentCurrency;
  const paymentCount = paymentRows.length;

  return (
    <>
      <header className={styles.pageHeader}>
        <div>
          <div className={styles.kicker}>Patient · Plan & billing</div>
          <h1 className={styles.pageTitle}>Plan & billing</h1>
          <p className={styles.pageSubtitle}>
            Your active program, payment method, and receipt.
          </p>
        </div>
      </header>

      {!checkoutComplete && (
        <section
          className={styles.card}
          style={{
            borderColor: "#f59e0b",
            background: "linear-gradient(180deg, #fff8eb, var(--color-surface))",
            marginBottom: 16,
          }}
        >
          <div className={styles.cardEyebrow} style={{ color: "#b45309" }}>
            Awaiting payment
          </div>
          <h2 className={styles.cardTitle}>
            Finish your payment to activate {planLabel || "your plan"}.
          </h2>
          <p
            style={{
              margin: "6px 0 14px",
              color: "var(--color-text-muted)",
              fontSize: 14,
            }}
          >
            Once your card is authorized, your program clock starts and your
            consultation is locked in.
          </p>
          <Link href={resumeHref} className={styles.ctaPrimary}>
            Complete payment
          </Link>
        </section>
      )}

      {isAuthorized && (
        <section
          className={styles.card}
          style={{
            borderColor: "#f59e0b",
            background: "linear-gradient(180deg, #fff8eb, var(--color-surface))",
            marginBottom: 16,
          }}
        >
          <div className={styles.cardEyebrow} style={{ color: "#b45309" }}>
            Payment authorized
          </div>
          <h2 className={styles.cardTitle}>
            Your plan is active — final capture is pending.
          </h2>
          <p
            style={{
              margin: "6px 0 0",
              color: "var(--color-text-muted)",
              fontSize: 14,
            }}
          >
            Your card has been authorized for {planLabel || "your program"}. You
            can book and attend visits while our team completes processing.
          </p>
        </section>
      )}

      <div className={styles.statRow}>
        <StatTile
          icon={<CardIcon />}
          tone={checkoutComplete ? (isPaid ? "green" : "amber") : "amber"}
          label="Current plan"
          value={planLabel || "Not selected"}
          sub={
            checkoutComplete ? (
              <span
                className={`${styles.pill} ${isPaid ? styles.pillOk : styles.pillWarn}`}
              >
                {payLabel}
              </span>
            ) : (
              <span className={`${styles.pill} ${styles.pillWarn}`}>
                Awaiting payment
              </span>
            )
          }
        />
        <StatTile
          icon={<CalendarIcon />}
          tone="slate"
          label="Started"
          value={paidAtMs ? formatUsDate(paidAtMs) : "—"}
          sub={paidAtMs ? formatUsTime(paidAtMs) : checkoutComplete ? "—" : "Once you pay"}
        />
        <StatTile
          icon={<ClockIcon />}
          tone="green"
          label="Ends"
          value={expiresAtMs ? formatUsDate(expiresAtMs) : "—"}
          sub={
            daysLeft != null
              ? daysLeft === 0
                ? "Ends today"
                : `${daysLeft} day${daysLeft === 1 ? "" : "s"} left`
              : "—"
          }
        />
        <StatTile
          icon={<ReceiptIcon />}
          tone="coral"
          label="Total spending"
          value={
            history.loading
              ? "…"
              : paymentCount > 0
                ? formatAmount(paymentTotalCents, paymentCurrency)
                : "—"
          }
          sub={
            history.loading
              ? "Loading…"
              : paymentCount > 0
                ? `${paymentCount} payment${paymentCount === 1 ? "" : "s"} on file`
                : "No payments yet"
          }
        />
      </div>

      <div className={styles.colSplit}>
        {/* Plan details */}
        <section className={`${styles.card} ${styles.cardHover}`}>
          <div className={styles.cardEyebrow}>
            <CardIcon /> Plan details
          </div>
          <h2 className={styles.cardTitle} style={{ marginBottom: 4 }}>
            {planLabel || "No plan selected"}
          </h2>
          {planKey && (
            <div style={{ color: "var(--color-text-muted)", fontSize: 14 }}>
              {PLAN_MONTHS[planKey]}-month treatment program
            </div>
          )}

          {paidAtMs && totalDays != null && (
            <div className={styles.progressWrap} style={{ marginTop: 18 }}>
              <div className={styles.progressTrack}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <div className={styles.progressMeta}>
                <span>
                  {daysLeft === 0
                    ? "Plan ends today"
                    : `${daysLeft} of ${totalDays} days remaining`}
                </span>
                <span>{progressPct}%</span>
              </div>
            </div>
          )}

          <div className={styles.row} style={{ marginTop: 14 }}>
            <span className={styles.rowLabel}>Program</span>
            <span className={styles.rowValue}>{planLabel || "—"}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.rowLabel}>Status</span>
            <span className={styles.rowValue}>
              {isPaid ? (
                <span className={`${styles.pill} ${styles.pillOk}`}>Active</span>
              ) : (
                <span className={`${styles.pill} ${styles.pillWarn}`}>
                  Awaiting payment
                </span>
              )}
            </span>
          </div>
          <div className={styles.row}>
            <span className={styles.rowLabel}>Started</span>
            <span className={styles.rowValue}>
              {paidAtMs ? formatUsDateTime(paidAtMs) : "—"}
            </span>
          </div>
          <div className={styles.row}>
            <span className={styles.rowLabel}>Ends</span>
            <span className={styles.rowValue}>
              {expiresAtMs ? formatUsDateTime(expiresAtMs) : "—"}
            </span>
          </div>
        </section>

        {/* Payment method */}
        <section className={`${styles.card} ${styles.cardHover}`}>
          <div className={styles.cardEyebrow}>
            <LockIcon /> Payment method
          </div>

          {isPaid && onb.paymentLast4 ? (
            <>
              <div className={styles.creditCard}>
                <div className={styles.creditCardBrand}>
                  {formatBrand(onb.paymentBrand)}
                </div>
                <div className={styles.creditCardNumber}>
                  •••• •••• •••• {onb.paymentLast4}
                </div>
                <div className={styles.creditCardMeta}>
                  <div>
                    <div className={styles.creditCardLabel}>Cardholder</div>
                    <div className={styles.creditCardValue}>
                      {onb.paymentCardholder || "—"}
                    </div>
                  </div>
                  <div>
                    <div className={styles.creditCardLabel}>Expires</div>
                    <div className={styles.creditCardValue}>
                      {formatExpiry(onb.paymentExpMonth, onb.paymentExpYear)}
                    </div>
                  </div>
                </div>
              </div>

              <p
                style={{
                  margin: "12px 0 0",
                  fontSize: 12,
                  color: "var(--color-text-soft)",
                }}
              >
                Stored securely by Stripe. We only keep the last four digits.
              </p>
            </>
          ) : (
            <div className={styles.empty}>
              <div className={styles.emptyIllus}>
                <LockIcon />
              </div>
              <div className={styles.emptyTitle}>No payment on file</div>
              <div className={styles.emptyBody}>
                Once you complete payment, your card details will appear here.
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Payment history */}
      <PaymentHistorySection
        history={history}
        rows={paymentRows}
        currency={paymentCurrency}
      />
    </>
  );
}

function PaymentHistorySection({ history, rows, currency }) {
  const hasRows = rows.length > 0;
  const totalCents = sumPaymentAmounts(rows);

  return (
    <section className={styles.card} style={{ marginTop: 16 }}>
      <div className={styles.cardEyebrow}>
        <ReceiptIcon /> Payment history
      </div>
      <h2 className={styles.cardTitle} style={{ marginBottom: 4 }}>
        {history.loading
          ? "Loading…"
          : hasRows
            ? `Total spending · ${formatAmount(totalCents, currency) || "—"}`
            : "No payments yet"}
      </h2>
      <p
        style={{
          margin: "4px 0 14px",
          color: "var(--color-text-muted)",
          fontSize: 13.5,
        }}
      >
        {history.loading
          ? "Pulling your latest payments from Stripe…"
          : history.error
            ? "We couldn't reach Stripe — showing what we have on file."
            : hasRows
              ? `${rows.length} successful payment${rows.length === 1 ? "" : "s"} on file.`
              : "Once you complete a payment, it'll appear here."}
      </p>

      {hasRows && (
        <div className={styles.historyTable}>
          <div className={`${styles.historyRow} ${styles.historyHead}`}>
            <span>Date</span>
            <span>Plan</span>
            <span>Card</span>
            <span style={{ textAlign: "right" }}>Amount</span>
          </div>
          {rows.map((p) => (
            <div key={p.id} className={styles.historyRow}>
              <span data-label="Date">{p.paidAt ? formatUsDate(p.paidAt) : "—"}</span>
              <span data-label="Plan">{PLAN_LABELS[p.plan] || p.plan || "—"}</span>
              <span data-label="Card">
                {p.last4
                  ? `${formatBrand(p.brand)} •••• ${p.last4}`
                  : "—"}
              </span>
              <span
                data-label="Amount"
                style={{
                  textAlign: "right",
                  fontVariantNumeric: "tabular-nums",
                  fontWeight: 600,
                }}
              >
                {formatAmount(p.amount, p.currency || currency) || "—"}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function sumPaymentAmounts(rows) {
  return rows.reduce(
    (sum, r) => sum + (typeof r.amount === "number" ? r.amount : 0),
    0,
  );
}

function usePaymentHistory(user) {
  const [state, setState] = useState({
    loading: true,
    error: null,
    totalCents: null,
    currency: null,
    count: null,
    payments: [],
  });

  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setState({
        loading: false,
        error: null,
        totalCents: null,
        currency: null,
        count: null,
        payments: [],
      });
      return;
    }

    (async () => {
      try {
        const idToken = await auth.currentUser?.getIdToken();
        if (!idToken) throw new Error("not signed in");
        const res = await fetch("/api/stripe/payment-history", {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        const data = await res.json();
        if (cancelled) return;
        if (!data?.success) {
          setState((p) => ({
            ...p,
            loading: false,
            error: userErrorMessage(data, "load"),
          }));
          return;
        }
        setState({
          loading: false,
          error: null,
          totalCents: data.totalCents ?? 0,
          currency: data.currency || "usd",
          count: data.count ?? 0,
          payments: data.payments || [],
        });
      } catch (e) {
        if (cancelled) return;
        setState((p) => ({
          ...p,
          loading: false,
          error: userErrorMessage(e, "load"),
        }));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  return state;
}

/* ─── Helpers ────────────────────────────────────────────────────────── */

function StatTile({ icon, tone, label, value, sub }) {
  const toneClass =
    {
      green: styles.statIconGreen,
      coral: styles.statIconCoral,
      slate: styles.statIconSlate,
      amber: styles.statIconAmber,
    }[tone] || styles.statIconSlate;
  return (
    <div className={styles.stat}>
      <div className={`${styles.statIcon} ${toneClass}`}>{icon}</div>
      <div className={styles.statBody}>
        <div className={styles.statLabel}>{label}</div>
        <div className={styles.statValue}>{value}</div>
        <div className={styles.statSub}>{sub}</div>
      </div>
    </div>
  );
}

function toMillis(value) {
  if (value == null) return null;
  if (typeof value === "number") return value;
  if (typeof value?.toMillis === "function") return value.toMillis();
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatAmount(amountCents, currency) {
  if (amountCents == null || !currency) return "";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: String(currency).toUpperCase(),
    }).format(amountCents / 100);
  } catch {
    return `$${(amountCents / 100).toFixed(2)}`;
  }
}

function formatBrand(brand) {
  if (!brand) return "Card";
  const map = {
    visa: "Visa",
    mastercard: "Mastercard",
    amex: "American Express",
    discover: "Discover",
    diners: "Diners Club",
    jcb: "JCB",
    unionpay: "UnionPay",
  };
  return map[brand] || brand.charAt(0).toUpperCase() + brand.slice(1);
}

function formatExpiry(month, year) {
  if (!month || !year) return "—";
  const mm = String(month).padStart(2, "0");
  const yy = String(year).slice(-2);
  return `${mm}/${yy}`;
}

/* ─── Icons ──────────────────────────────────────────────────────────── */
function iconProps(size = 16) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };
}

function CardIcon() {
  return (
    <svg {...iconProps(20)}>
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <line x1="3" y1="11" x2="21" y2="11" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg {...iconProps(20)}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg {...iconProps(20)}>
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 16 14" />
    </svg>
  );
}

function ReceiptIcon() {
  return (
    <svg {...iconProps(20)}>
      <path d="M5 3h14v18l-3-2-3 2-3-2-3 2-2-2z" />
      <line x1="8" y1="9" x2="16" y2="9" />
      <line x1="8" y1="13" x2="16" y2="13" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg {...iconProps(20)}>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 018 0v3" />
    </svg>
  );
}
