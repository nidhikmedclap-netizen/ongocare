// lib/firebase/storage.js
//
// Firebase Cloud Storage module.
//
// Used later for: user-uploaded images (e.g. progress photos, ID docs),
// PDF reports, anything binary that doesn't belong in Firestore.
// Cloudinary currently handles marketing image uploads — Firebase Storage is
// intended for *private* user assets governed by Security Rules.
//
//   import { storage } from "@/lib/firebase/storage";
//   import { ref, uploadBytes } from "firebase/storage";

import { getStorage } from "firebase/storage";
import { getFirebaseApp } from "./client";

export const storage = getStorage(getFirebaseApp());

export default storage;
