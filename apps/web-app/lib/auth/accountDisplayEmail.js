// Prefer Firebase Auth email when it disagrees with Firestore — Auth reflects
// the credentials used to sign in; Firestore can lag after re-seeds or bad writes.

export function accountDisplayEmail(user, profile) {
  const authEmail = user?.email?.trim() || "";
  const profileEmail = profile?.email?.trim() || "";
  if (!authEmail && !profileEmail) return "";
  if (!profileEmail) return authEmail;
  if (!authEmail) return profileEmail;
  if (authEmail.toLowerCase() !== profileEmail.toLowerCase()) return authEmail;
  return profileEmail;
}
