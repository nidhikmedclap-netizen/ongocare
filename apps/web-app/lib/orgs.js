// lib/orgs.js
//
// Client-safe org-slug constants. `services/firebase/users.js` re-exports
// `DEFAULT_ORG_SLUG` for server code, but importing that module from a
// "use client" file pulls in firebase-admin and breaks the build. This
// tiny module keeps the constant available to both sides without dragging
// any Node-only dependencies along.

export const DEFAULT_ORG_SLUG = "ongo";
