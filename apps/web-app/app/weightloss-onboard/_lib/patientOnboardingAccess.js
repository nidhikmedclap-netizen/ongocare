// Guards patient onboarding from reusing admin/doctor/superadmin sessions.

const ROLE_LABELS = {
  superadmin: "super-admin",
  admin: "admin",
  doctor: "doctor",
};

export function canReuseAuthSessionForPatientOnboarding(profile) {
  if (!profile?.role) return true;
  return profile.role === "patient";
}

export function wrongRoleOnboardingMessage(role) {
  const label = ROLE_LABELS[role] || role || "another account";
  return `You're signed in as ${label}. Sign out to create a new patient account.`;
}

export function authEmailMismatchMessage(signedInEmail, formEmail) {
  return `You're signed in as ${signedInEmail}. Sign out first, or use that email to continue.`;
}
