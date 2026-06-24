// app/[organization]/dashboard/patient/layout.jsx
//
// Per-portal patient dashboard shell.

import { notFound } from "next/navigation";
import { getOrganizationData } from "@/lib/getOrganizationData";
import { logoBrandingFromOrg } from "@/lib/branding/defaults";
import PatientPortalShell from "./_PatientPortalShell";

export default async function OrgPatientLayout({ children, params }) {
  const org = await getOrganizationData(params.organization);
  if (!org) notFound();

  return (
    <PatientPortalShell
      slug={org.slug}
      branding={logoBrandingFromOrg(org, `/${org.slug}`)}
    >
      {children}
    </PatientPortalShell>
  );
}
