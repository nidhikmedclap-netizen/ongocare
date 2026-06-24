"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuthUser } from "@/lib/auth/useAuthUser";
import { useAdminApi, useAdminDashboardBase } from "../../useAdminApi";
import AdminPatientDetail from "../../_components/AdminPatientDetail";
import styles from "../../../patient/dashboard.module.css";
import { throwIfApiFailed, userErrorMessage } from "@/lib/ui/userErrorMessage";

export default function AdminPatientDetailPage() {
  const { uid } = useParams();
  const adminBase = useAdminDashboardBase();
  const { role } = useAuthUser();
  const isSuper = role === "superadmin";
  const { fetchAdmin } = useAdminApi();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [syncingPayment, setSyncingPayment] = useState(false);

  const loadPatient = useCallback(async () => {
    const res = await fetchAdmin(`/api/admin/patients/${uid}`);
    const data = await res.json();
    throwIfApiFailed(data, "load");
    setPatient(data.patient);
    setError("");
  }, [fetchAdmin, uid]);

  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        await loadPatient();
      } catch (e) {
        if (!cancelled) {
          setError(userErrorMessage(e, "load"));
          setPatient(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [uid, loadPatient]);

  const syncPayment = async () => {
    if (!uid) return;
    setSyncingPayment(true);
    try {
      const res = await fetchAdmin(`/api/admin/patients/${uid}/sync-payment`, {
        method: "POST",
      });
      const data = await res.json();
      throwIfApiFailed(data, "sync");
      setPatient(data.patient);
      setError("");
    } catch (e) {
      setError(userErrorMessage(e, "sync"));
    } finally {
      setSyncingPayment(false);
    }
  };

  if (loading) {
    return (
      <section className={styles.card}>
        <p style={{ color: "var(--color-text-muted)", margin: 0 }}>Loading patient…</p>
      </section>
    );
  }

  if (error || !patient) {
    return (
      <section className={styles.card}>
        <p style={{ color: "#b45309", margin: 0 }}>{error || "Patient not found."}</p>
      </section>
    );
  }

  return (
    <AdminPatientDetail
      patient={patient}
      backHref={`${adminBase}/patients`}
      readOnly={!isSuper}
      showPortal={isSuper}
      transactionsHref={`${adminBase}/transactions`}
      onSyncPayment={isSuper ? syncPayment : undefined}
      syncingPayment={syncingPayment}
    />
  );
}
