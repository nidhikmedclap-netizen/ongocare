/**
 * Single entry point for resolving an organization (tenant) by slug.
 *
 * Today this reads from a static registry. Tomorrow it can be swapped to
 * pull from Firestore, a CMS, or an internal API — consumers don't need
 * to change, since the return shape is fixed.
 *
 * The function is `async` on purpose so the eventual database/remote
 * implementation can land without a breaking refactor.
 */

import { organizations, organizationSlugs } from "@/data/organizations";

export async function getOrganizationData(slug) {
  if (!slug) return null;
  const org = organizations[slug];
  return org ?? null;
}

export function listOrganizationSlugs() {
  return organizationSlugs;
}

export function isValidOrganizationSlug(slug) {
  return Boolean(slug) && Object.prototype.hasOwnProperty.call(organizations, slug);
}
