// app/[organization]/dashboard/doctor/layout.jsx
//
// Per-portal doctor dashboard shell.

import { notFound } from "next/navigation";
import { getOrganizationData } from "@/lib/getOrganizationData";
import { logoBrandingFromOrg } from "@/lib/branding/defaults";
import DoctorPortalShell from "./_DoctorPortalShell";

export default async function OrgDoctorLayout({ children, params }) {
  const org = await getOrganizationData(params.organization);
  if (!org) notFound();

  return (
    <DoctorPortalShell
      slug={org.slug}
      branding={logoBrandingFromOrg(org, `/${org.slug}`)}
    >
      {children}
    </DoctorPortalShell>
  );
}
