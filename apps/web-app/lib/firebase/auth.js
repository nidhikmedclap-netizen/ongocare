// lib/firebase/auth.js
//
// Firebase Authentication module.
//
// Used later for: email/password sign-in, social OAuth, magic links,
// password reset, custom claims, etc. For now this only exposes the singleton
// `auth` instance bound to our app so any future auth code can simply:
//
//   import { auth } from "@/lib/firebase/auth";
//   await signInWithEmailAndPassword(auth, email, password);
//
// We are NOT building any auth UI or sign-in flows yet.

import { getAuth } from "firebase/auth";
import { getFirebaseApp } from "./client";

export const auth = getAuth(getFirebaseApp());

export default auth;
