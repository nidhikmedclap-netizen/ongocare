"use client";

import { usePathname } from "next/navigation";

/** `/dashboard/patient` or `/{slug}/dashboard/patient` from the current path. */
export function usePatientDashboardBase() {
  const pathname = usePathname();
  const match = pathname.match(/^(\/[^/]+)?\/dashboard\/patient/);
  return match ? match[0] : "/dashboard/patient";
}
