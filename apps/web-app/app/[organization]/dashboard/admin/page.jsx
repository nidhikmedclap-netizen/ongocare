// Per-portal admin overview — same component as /dashboard/admin.
// Branding + tenant scoping comes from the parent layout (see
// _AdminPortalShell). The page itself is portal-agnostic; data is filtered
// server-side by the API based on the signed-in admin's orgSlug.
export { default } from "@/app/dashboard/admin/page";
