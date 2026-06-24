// lib/auth/googleSignIn.js
//
// Client-side Google OAuth via Firebase Auth.

"use client";

import {
  GoogleAuthProvider,
  getAdditionalUserInfo,
  signInWithPopup,
} from "firebase/auth";
import { auth } from "@/lib/firebase/auth";

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

/**
 * Open Google account picker and sign in through Firebase.
 * @returns {Promise<{ uid: string, email: string, isNew: boolean }>}
 */
export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  const email = result.user.email?.trim().toLowerCase() || "";
  if (!email) {
    throw Object.assign(new Error("Google did not return an email address."), {
      code: "auth/no-email",
    });
  }
  const isNew = Boolean(getAdditionalUserInfo(result)?.isNewUser);
  return { uid: result.user.uid, email, isNew };
}

export function mapGoogleSignInError(err) {
  const code = err?.code || "";
  if (code === "auth/popup-closed-by-user") {
    return "Google sign-in was cancelled.";
  }
  if (code === "auth/popup-blocked") {
    return "Pop-up blocked. Allow pop-ups for this site and try again.";
  }
  if (code === "auth/account-exists-with-different-credential") {
    return (
      "An account with this email already exists using email and password. " +
      "Sign in with your password instead."
    );
  }
  if (code === "auth/cancelled-popup-request") {
    return "Google sign-in was interrupted. Please try again.";
  }
  if (
    code === "auth/network-request-failed" ||
    String(err?.message || "").toLowerCase().includes("quota")
  ) {
    return "Firebase is temporarily unavailable. Try again later.";
  }
  return err?.message || "Could not sign in with Google. Please try again.";
}
