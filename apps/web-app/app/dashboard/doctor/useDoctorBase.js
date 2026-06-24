"use client";

import { usePathname } from "next/navigation";

/** `/dashboard/doctor` or `/{slug}/dashboard/doctor` from the current path. */
export function useDoctorDashboardBase() {
  const pathname = usePathname();
  const match = pathname.match(/^(\/[^/]+)?\/dashboard\/doctor/);
  return match ? match[0] : "/dashboard/doctor";
}
