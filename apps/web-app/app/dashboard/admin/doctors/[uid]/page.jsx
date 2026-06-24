"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuthUser } from "@/lib/auth/useAuthUser";
import { useAdminApi, useAdminDashboardBase } from "../../useAdminApi";
import AdminDoctorDetail from "../../_components/AdminDoctorDetail";
import AdminDoctorEditModal from "../_components/AdminDoctorEditModal";
import admin from "../../admin.module.css";
import styles from "../../../patient/dashboard.module.css";
import { portalDisplayName } from "@/lib/orgs/portalLabels";
import { throwIfApiFailed, userErrorMessage } from "@/lib/ui/userErrorMessage";

export default function AdminDoctorDetailPage() {
  const { uid } = useParams();
  const adminBase = useAdminDashboardBase();
  const { role, profile } = useAuthUser();
  const isSuper = role === "superadmin";
  const { fetchAdmin, isFiltered, portalKey } = useAdminApi();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);

  const loadDoctor = useCallback(async () => {
    if (!uid) return;
    setLoading(true);
    try {
      const res = await fetchAdmin(`/api/admin/doctors/${uid}`);
      const data = await res.json();
      throwIfApiFailed(data, "load");
      setDoctor(data.doctor);
      setError("");
    } catch (e) {
      setError(userErrorMessage(e, "load"));
      setDoctor(null);
    } finally {
      setLoading(false);
    }
  }, [uid, fetchAdmin]);

  useEffect(() => {
    loadDoctor();
  }, [loadDoctor]);

  if (loading) {
    return (
      <section className={styles.card}>
        <p style={{ color: "var(--color-text-muted)", margin: 0 }}>Loading doctor…</p>
      </section>
    );
  }

  if (error || !doctor) {
    return (
      <section className={styles.card}>
        <p style={{ color: "#b45309", margin: 0 }}>{error || "Doctor not found."}</p>
      </section>
    );
  }

  return (
    <>
      {isSuper && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
          <button
            type="button"
            className={admin.btnGhost}
            onClick={() => setEditing(true)}
          >
            Edit full profile
          </button>
        </div>
      )}

      <AdminDoctorDetail
        doctor={doctor}
        backHref={`${adminBase}/doctors`}
        readOnly={!isSuper}
        showPortal={isSuper}
        priorityPortalLabel={
          isSuper && isFiltered
            ? portalDisplayName(portalKey)
            : !isSuper
              ? portalDisplayName(profile?.orgSlug || doctor.orgSlugs?.[0])
              : ""
        }
      />

      {editing && (
        <AdminDoctorEditModal
          doctor={doctor}
          onClose={() => setEditing(false)}
          onSaved={loadDoctor}
        />
      )}
    </>
  );
}
