// app/[organization]/dashboard/admin/layout.jsx
//
// Per-portal admin dashboard shell. Server component just to validate the
// org slug and forward branding into the client shell — role-gating and
// the sidebar still live client-side, same as the default dashboard.

import { notFound } from "next/navigation";
import { getOrganizationData } from "@/lib/getOrganizationData";
import { logoBrandingFromOrg } from "@/lib/branding/defaults";
import AdminPortalShell from "./_AdminPortalShell";

export default async function OrgAdminLayout({ children, params }) {
  const org = await getOrganizationData(params.organization);
  if (!org) notFound();

  return (
    <AdminPortalShell
      slug={org.slug}
      branding={logoBrandingFromOrg(org, `/${org.slug}`)}
    >
      {children}
    </AdminPortalShell>
  );
}
