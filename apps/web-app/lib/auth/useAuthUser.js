// lib/auth/useAuthUser.js
//
// Re-export from AuthProvider so existing imports keep working.
// The provider must wrap the app (see components/Providers.jsx).

export { useAuthUser } from "./AuthProvider";
