"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuthUser } from "@/lib/auth/useAuthUser";
import { useAdminApi, useAdminDashboardBase } from "../../useAdminApi";
import AdminAppointmentDetail from "../../_components/AdminAppointmentDetail";
import styles from "../../../patient/dashboard.module.css";
import { throwIfApiFailed, userErrorMessage } from "@/lib/ui/userErrorMessage";

export default function AdminAppointmentDetailPage() {
  const { id } = useParams();
  const adminBase = useAdminDashboardBase();
  const { role } = useAuthUser();
  const isSuper = role === "superadmin";
  const { fetchAdmin } = useAdminApi();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAppointment = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetchAdmin(`/api/admin/appointments/${id}`);
      const data = await res.json();
      throwIfApiFailed(data, "load");
      setAppointment(data.appointment);
      setError("");
    } catch (e) {
      setError(userErrorMessage(e, "load"));
      setAppointment(null);
    } finally {
      setLoading(false);
    }
  }, [fetchAdmin, id]);

  useEffect(() => {
    loadAppointment();
  }, [loadAppointment]);

  if (loading) {
    return (
      <section className={styles.card}>
        <p style={{ color: "var(--color-text-muted)", margin: 0 }}>Loading appointment…</p>
      </section>
    );
  }

  if (error || !appointment) {
    return (
      <section className={styles.card}>
        <p style={{ color: "#b45309", margin: 0 }}>{error || "Appointment not found."}</p>
      </section>
    );
  }

  return (
    <AdminAppointmentDetail
      appointment={appointment}
      backHref={`${adminBase}/appointments`}
      adminBase={adminBase}
      showPortal={isSuper}
    />
  );
}
