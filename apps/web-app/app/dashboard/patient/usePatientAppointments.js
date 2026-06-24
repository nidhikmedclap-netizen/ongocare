"use client";

import { useEffect, useMemo, useState } from "react";
import { auth } from "@/lib/firebase/auth";
import {
  decoratePatientAppointments,
  filterPastPatientAppointments,
  filterUpcomingPatientAppointments,
  mergePatientAppointmentList,
} from "@/lib/appointments/patientAppointmentViews";
import { detectClientTimezone, resolvePatientTimezone } from "@/lib/time/timezone";
import { throwIfApiFailed, userErrorMessage } from "@/lib/ui/userErrorMessage";

export function usePatientAppointments({ user, profile, onb }) {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");
  const [browserTz, setBrowserTz] = useState(null);

  useEffect(() => {
    setBrowserTz(detectClientTimezone());
  }, []);

  const patientTz = useMemo(
    () =>
      resolvePatientTimezone({
        state: profile?.state || onb?.state,
        browserTz,
      }),
    [profile?.state, onb?.state, browserTz],
  );

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const idToken = await auth.currentUser?.getIdToken();
        const res = await fetch("/api/patient/appointments", {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        const data = await res.json();
        if (cancelled) return;
        throwIfApiFailed(data, "load");
        setRows(data.appointments || []);
        setError("");
      } catch (e) {
        if (!cancelled) {
          setError(userErrorMessage(e, "load"));
          setRows([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const list = useMemo(
    () => mergePatientAppointmentList(rows, onb),
    [rows, onb],
  );

  const decorated = useMemo(
    () => decoratePatientAppointments(list, patientTz),
    [list, patientTz],
  );

  const nowMs = Date.now();
  const upcoming = useMemo(
    () => filterUpcomingPatientAppointments(decorated, nowMs),
    [decorated, nowMs],
  );
  const past = useMemo(
    () => filterPastPatientAppointments(decorated, nowMs),
    [decorated, nowMs],
  );

  return {
    loading: rows === null,
    error,
    patientTz,
    upcoming,
    past,
    nextAppointment: upcoming[0] || null,
  };
}
