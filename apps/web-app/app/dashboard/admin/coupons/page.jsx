// app/dashboard/admin/coupons/page.jsx
//
// Coupons table — list, create, edit, delete, toggle active.
//
// Visibility rules (matching the API):
//   - Super-admin   : sees every coupon across portals; can create/edit/
//                     delete and toggle active.
//   - Portal admin  : sees coupons for their own portal + global ones;
//                     EVERYTHING is read-only. The Create button isn't
//                     rendered, and per-row actions are hidden.
//
// We reuse the existing admin.module.css table primitives so the page
// looks identical in chrome to the doctors / patients / appointments
// tables — that's the design system contract for /dashboard/admin/*.

"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuthUser } from "@/lib/auth/useAuthUser";
import { useAdminApi } from "../useAdminApi";
import { formatUsDate } from "@/lib/dates/usDate";
import { formatMoney } from "@/lib/billing/money";
import { PLAN_IDS, PLAN_SHORT_LABELS } from "@/lib/billing/plans";
import { PORTAL_SELECT_OPTIONS, portalDisplayName } from "@/lib/orgs/portalLabels";
import styles from "../../patient/dashboard.module.css";
import admin from "../admin.module.css";
import AdminModalShell from "../_components/AdminModalShell";
import AdminFormField from "../_components/AdminFormField";
import TablePagination from "../../_components/TablePagination";
import { usePagination } from "@/lib/ui/usePagination";
import { confirmAction, toastApiError, toastSuccess } from "@/lib/ui/notify";
import { throwIfApiFailed, userErrorMessage } from "@/lib/ui/userErrorMessage";
import {
  couponFormFieldErrors,
  couponFormIsValid,
  couponFormSummaryError,
} from "./_lib/couponFormValidation";

const DEFAULT_ELIGIBLE_PLANS = ["3m", "6m"];

function formatCouponMaxDiscount(cents) {
  if (cents == null) return "—";
  return formatMoney(cents, "usd");
}

function formatCouponPlans(plans) {
  if (!plans?.length || plans.length === PLAN_IDS.length) return "All plans";
  return plans.map((p) => PLAN_SHORT_LABELS[p] || p).join(", ");
}

export default function AdminCouponsPage() {
  const { role } = useAuthUser();
  const { fetchAdmin, portalKey } = useAdminApi();
  const isSuper = role === "superadmin";

  const [coupons, setCoupons] = useState(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState(null);
  const [busyId, setBusyId] = useState("");

  const refresh = async () => {
    try {
      const res = await fetchAdmin("/api/admin/coupons");
      const data = await res.json();
      throwIfApiFailed(data, "load");
      setCoupons(Array.isArray(data.coupons) ? data.coupons : []);
      setError("");
    } catch (e) {
      setError(userErrorMessage(e, "load"));
      setCoupons([]);
    }
  };

  useEffect(() => {
    refresh();
  }, [portalKey]);

  const filtered = useMemo(() => {
    if (!coupons) return [];
    const q = query.trim().toLowerCase();
    if (!q) return coupons;
    return coupons.filter((c) =>
      c.code.toLowerCase().includes(q) ||
      (c.orgSlug ? portalDisplayName(c.orgSlug) : "Global").toLowerCase().includes(q),
    );
  }, [coupons, query]);

  const pagination = usePagination(filtered, { resetDeps: [query] });

  const callApi = async (method, path, body) => {
    const res = await fetchAdmin(path, {
      method,
      ...(body
        ? {
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }
        : {}),
    });
    const data = await res.json();
    throwIfApiFailed(data, "generic");
    return data;
  };

  const createCoupon = async (input) => {
    await callApi("POST", "/api/admin/coupons", input);
    await refresh();
    toastSuccess("Coupon created");
  };

  const updateCoupon = async (id, fields) => {
    setBusyId(id);
    try {
      await callApi("PATCH", `/api/admin/coupons/${id}`, fields);
      await refresh();
      toastSuccess("Coupon updated");
    } catch (e) {
      setError(toastApiError(e, { fallback: "update" }));
      throw e;
    } finally {
      setBusyId("");
    }
  };

  const deleteCoupon = async (coupon) => {
    const ok = await confirmAction({
      title: "Delete coupon?",
      description: `Delete "${coupon.code}"? This cannot be undone.`,
      confirmLabel: "Delete",
      cancelLabel: "Cancel",
      destructive: true,
    });
    if (!ok) return;
    setBusyId(coupon.id);
    try {
      await callApi("DELETE", `/api/admin/coupons/${coupon.id}`);
      await refresh();
      toastSuccess("Coupon deleted");
    } catch (e) {
      setError(toastApiError(e, { fallback: "delete" }));
    } finally {
      setBusyId("");
    }
  };

  return (
    <>
      <header className={styles.pageHeader}>
        <div>
          <div className={styles.kicker}>Coupons</div>
          <h1 className={styles.pageTitle}>Promotion codes</h1>
          <p className={styles.pageSubtitle}>
            {isSuper
              ? "Generate, edit, and retire promo codes. Patients can apply an active code on the payment step to discount their plan."
              : "Read-only list of promo codes available on your portal. Only the super-admin can create or edit codes."}
          </p>
        </div>
        {isSuper && (
          <button
            type="button"
            className={`${admin.btnGhost} ${admin.btnApprove}`}
            onClick={() => setShowCreate(true)}
          >
            + New coupon
          </button>
        )}
      </header>

      <div className={admin.tableCard}>
        <div className={admin.tableToolbar}>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by code or portal…"
            className={admin.searchInput}
          />
          <span className={admin.tableMeta}>
            {coupons === null
              ? "Loading…"
              : `${filtered.length} of ${coupons.length}`}
          </span>
        </div>

        {error && (
          <div
            role="alert"
            style={{
              padding: "10px 20px",
              color: "#b3261e",
              background: "#fde7e2",
              fontSize: 13,
              borderBottom: "1px solid var(--color-border)",
            }}
          >
            {error}
          </div>
        )}

        <div className={admin.tableScroll}>
          <table className={admin.table}>
            <thead>
              <tr>
                <th>Code</th>
                <th>Discount</th>
                <th>Max off</th>
                <th>Plans</th>
                <th>Portal</th>
                <th>Uses</th>
                <th>Expires</th>
                <th>Status</th>
                {isSuper && <th style={{ textAlign: "right" }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {pagination.paginatedItems.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div className={admin.cellName} style={{ fontFamily: 'var(--font-site)' }}>
                      {c.code}
                    </div>
                    {c.createdByEmail && (
                      <div className={admin.cellSub}>{c.createdByEmail}</div>
                    )}
                  </td>
                  <td>
                    <strong>{c.discountPercent}%</strong>
                  </td>
                  <td>
                    <span className={admin.cellSub}>
                      {formatCouponMaxDiscount(c.maxDiscountCents)}
                    </span>
                  </td>
                  <td>
                    <span className={admin.cellSub}>
                      {formatCouponPlans(c.eligiblePlans)}
                    </span>
                  </td>
                  <td>
                    <span className={admin.cellSub}>
                      {c.orgSlug ? portalDisplayName(c.orgSlug) : "Global"}
                    </span>
                  </td>
                  <td>
                    <span className={admin.cellSub}>
                      {c.usesCount}
                      {c.maxUses != null ? ` / ${c.maxUses}` : " / ∞"}
                    </span>
                  </td>
                  <td>
                    <span className={admin.cellSub}>
                      {c.expiresAtMs ? formatUsDate(c.expiresAtMs) : "—"}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`${admin.statusPill} ${
                        c.active ? admin.statusActive : admin.statusDeactivated
                      }`}
                    >
                      {c.active ? "active" : "inactive"}
                    </span>
                  </td>
                  {isSuper && (
                    <td style={{ textAlign: "right" }}>
                      <div className={admin.rowActions}>
                        <button
                          type="button"
                          className={admin.btnGhost}
                          disabled={busyId === c.id}
                          onClick={() => {
                            updateCoupon(c.id, { active: !c.active }).catch(() => {});
                          }}
                        >
                          {c.active ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          type="button"
                          className={admin.btnGhost}
                          disabled={busyId === c.id}
                          onClick={() => setEditing(c)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className={`${admin.btnGhost} ${admin.btnDanger}`}
                          disabled={busyId === c.id}
                          onClick={() => deleteCoupon(c)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {filtered.length === 0 && coupons !== null && (
                <tr>
                  <td colSpan={isSuper ? 9 : 8}>
                    <div className={admin.emptyState}>
                      <div className={admin.emptyStateTitle}>
                        {coupons.length === 0
                          ? "No coupons yet"
                          : "No coupons match your search"}
                      </div>
                      {coupons.length === 0
                        ? isSuper
                          ? "Click \u201c+ New coupon\u201d to create your first promo code."
                          : "Super-admin hasn't generated any codes yet."
                        : "Try clearing the search."}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <TablePagination {...pagination} />
      </div>

      {isSuper && showCreate && (
        <CouponFormModal
          mode="create"
          onClose={() => setShowCreate(false)}
          onSubmit={async (input) => {
            await createCoupon(input);
            setShowCreate(false);
          }}
        />
      )}

      {isSuper && editing && (
        <CouponFormModal
          mode="edit"
          coupon={editing}
          onClose={() => setEditing(null)}
          onSubmit={async (input) => {
            await updateCoupon(editing.id, input);
            setEditing(null);
          }}
        />
      )}
    </>
  );
}

/* ─── Create / edit modal ────────────────────────────────────────────── */

const formAlertStyle = {
  color: "#b3261e",
  background: "#fde7e2",
  padding: "8px 12px",
  borderRadius: 8,
  fontSize: 13,
  margin: "0 0 12px",
};

function CouponFormModal({ mode, coupon, onClose, onSubmit }) {
  const isEdit = mode === "edit";
  const [code, setCode] = useState(coupon?.code || "");
  const [discountPercent, setDiscountPercent] = useState(
    coupon?.discountPercent ? String(coupon.discountPercent) : "",
  );
  const [maxDiscountDollars, setMaxDiscountDollars] = useState(
    coupon?.maxDiscountCents != null
      ? String(coupon.maxDiscountCents / 100)
      : "",
  );
  const [eligiblePlans, setEligiblePlans] = useState(() => {
    if (coupon?.eligiblePlans?.length) return [...coupon.eligiblePlans];
    if (isEdit) return [...PLAN_IDS];
    return [...DEFAULT_ELIGIBLE_PLANS];
  });
  const [orgSlug, setOrgSlug] = useState(coupon?.orgSlug || "");
  const [maxUses, setMaxUses] = useState(
    coupon?.maxUses != null ? String(coupon.maxUses) : "",
  );
  const [expiresAtDate, setExpiresAtDate] = useState(
    coupon?.expiresAtMs
      ? new Date(coupon.expiresAtMs).toISOString().slice(0, 10)
      : "",
  );
  const [active, setActive] = useState(coupon ? coupon.active : true);
  const [saving, setSaving] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [err, setErr] = useState("");

  const formValues = useMemo(
    () => ({
      code,
      discountPercent,
      maxDiscountDollars,
      eligiblePlans,
      maxUses,
      expiresAtDate,
    }),
    [code, discountPercent, maxDiscountDollars, eligiblePlans, maxUses, expiresAtDate],
  );

  const fieldErrors = useMemo(
    () => couponFormFieldErrors(formValues, { isEdit }),
    [formValues, isEdit],
  );

  const clearBannerError = () => {
    setErr("");
  };

  const togglePlan = (planId) => {
    clearBannerError();
    setEligiblePlans((prev) => {
      if (prev.includes(planId)) {
        const next = prev.filter((p) => p !== planId);
        return next.length ? next : prev;
      }
      return [...prev, planId].sort(
        (a, b) => PLAN_IDS.indexOf(a) - PLAN_IDS.indexOf(b),
      );
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setShowErrors(true);

    const errors = couponFormFieldErrors(formValues, { isEdit });
    if (!couponFormIsValid(errors)) {
      setErr(couponFormSummaryError(errors));
      return;
    }

    setSaving(true);

    const payload = {
      discountPercent: Number(discountPercent),
      maxDiscountDollars:
        maxDiscountDollars === "" ? null : Number(maxDiscountDollars),
      eligiblePlans,
      orgSlug,
      maxUses: maxUses === "" ? null : Number(maxUses),
      expiresAtMs: expiresAtDate
        ? new Date(`${expiresAtDate}T23:59:59Z`).getTime()
        : null,
      active,
    };
    if (!isEdit) payload.code = code.trim().toUpperCase();

    try {
      await onSubmit(payload);
    } catch (e2) {
      setShowErrors(true);
      setErr(userErrorMessage(e2, isEdit ? "update" : "create"));
      setSaving(false);
    }
  };

  return (
    <AdminModalShell
      title={isEdit ? `Edit ${coupon?.code}` : "New coupon"}
      subtitle={
        isEdit
          ? "Code itself can't be renamed — delete and recreate if you need a different code."
          : "3–32 characters · letters, digits, hyphen, underscore · auto-uppercased."
      }
      onClose={onClose}
      onSubmit={submit}
      footer={
        <div className={admin.modalActions}>
          <button
            type="button"
            className={admin.btnGhost}
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={`${admin.btnGhost} ${admin.btnApprove}`}
            disabled={saving}
          >
            {saving ? "Saving…" : isEdit ? "Save changes" : "Create coupon"}
          </button>
        </div>
      }
    >
        {err && (
          <div role="alert" style={formAlertStyle}>
            {err}
          </div>
        )}

        {!isEdit && (
          <AdminFormField
            label="Code"
            required
            hint={showErrors ? fieldErrors.code : undefined}
            hintTone={showErrors && fieldErrors.code ? "warn" : undefined}
          >
            <input
              value={code}
              onChange={(e) => {
                clearBannerError();
                setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ""));
              }}
              maxLength={32}
              className={admin.modalInput}
              style={{ fontFamily: "var(--font-site)", letterSpacing: 1 }}
              placeholder="WELCOME20"
              aria-invalid={showErrors && !!fieldErrors.code}
            />
          </AdminFormField>
        )}

        <AdminFormField
          label="Discount percent (1–100)"
          required
          hint={showErrors ? fieldErrors.discountPercent : undefined}
          hintTone={showErrors && fieldErrors.discountPercent ? "warn" : undefined}
        >
          <input
            type="text"
            inputMode="numeric"
            value={discountPercent}
            onChange={(e) => {
              clearBannerError();
              const cleaned = e.target.value.replace(/\D/g, "").slice(0, 3);
              setDiscountPercent(cleaned);
            }}
            className={admin.modalInput}
            placeholder="20"
            aria-invalid={showErrors && !!fieldErrors.discountPercent}
          />
        </AdminFormField>

        <AdminFormField
          label="Max discount ($, blank = no cap)"
          hint={
            showErrors && fieldErrors.maxDiscountDollars
              ? fieldErrors.maxDiscountDollars
              : "Caps the dollar amount off after the percent is applied."
          }
          hintTone={showErrors && fieldErrors.maxDiscountDollars ? "warn" : undefined}
        >
          <input
            type="text"
            inputMode="decimal"
            value={maxDiscountDollars}
            onChange={(e) => {
              clearBannerError();
              const cleaned = e.target.value.replace(/[^\d.]/g, "");
              setMaxDiscountDollars(cleaned);
            }}
            className={admin.modalInput}
            placeholder="e.g. 100"
            aria-invalid={showErrors && !!fieldErrors.maxDiscountDollars}
          />
        </AdminFormField>

        <AdminFormField
          label="Eligible plans"
          required
          hint={showErrors ? fieldErrors.eligiblePlans : undefined}
          hintTone={showErrors && fieldErrors.eligiblePlans ? "warn" : undefined}
        >
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 4 }}>
            {PLAN_IDS.map((planId) => (
              <label
                key={planId}
                className={admin.modalLabel}
                style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
              >
                <input
                  type="checkbox"
                  checked={eligiblePlans.includes(planId)}
                  onChange={() => togglePlan(planId)}
                />
                {PLAN_SHORT_LABELS[planId]}
              </label>
            ))}
          </div>
        </AdminFormField>

        <AdminFormField label="Portal">
          <select
            value={orgSlug || ""}
            onChange={(e) => {
              clearBannerError();
              setOrgSlug(e.target.value);
            }}
            className={admin.modalInput}
          >
            <option value="">Global (all portals)</option>
            {PORTAL_SELECT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </AdminFormField>

        <AdminFormField
          label="Max uses (blank = unlimited)"
          hint={showErrors ? fieldErrors.maxUses : undefined}
          hintTone={showErrors && fieldErrors.maxUses ? "warn" : undefined}
        >
          <input
            type="text"
            inputMode="numeric"
            value={maxUses}
            onChange={(e) => {
              clearBannerError();
              const cleaned = e.target.value.replace(/\D/g, "").slice(0, 6);
              setMaxUses(cleaned);
            }}
            className={admin.modalInput}
            placeholder="e.g. 100"
            aria-invalid={showErrors && !!fieldErrors.maxUses}
          />
        </AdminFormField>

        <AdminFormField
          label="Expires (blank = never)"
          hint={showErrors ? fieldErrors.expiresAtDate : undefined}
          hintTone={showErrors && fieldErrors.expiresAtDate ? "warn" : undefined}
        >
          <input
            type="date"
            value={expiresAtDate}
            onChange={(e) => {
              clearBannerError();
              setExpiresAtDate(e.target.value);
            }}
            min={new Date().toISOString().slice(0, 10)}
            className={admin.modalInput}
            aria-invalid={showErrors && !!fieldErrors.expiresAtDate}
          />
        </AdminFormField>

        <AdminFormField label="Active">
          <label
            className={admin.modalLabel}
            style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
          >
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
            />
            Active
          </label>
        </AdminFormField>
    </AdminModalShell>
  );
}
