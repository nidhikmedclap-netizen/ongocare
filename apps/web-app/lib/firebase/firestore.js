// lib/firebase/firestore.js
//
// Cloud Firestore module.
//
// Used later for: storing user profiles, onboarding submissions, weight logs,
// any structured app data. No collections or schemas are created here yet —
// this file just exposes the singleton `db` instance so future data-layer
// code can import it cleanly:
//
//   import { db } from "@/lib/firebase/firestore";
//   import { collection, getDocs } from "firebase/firestore";
//
// Collection definitions and CRUD helpers will live under
// /services/firebase/* when we actually start persisting data.

import { getFirestore } from "firebase/firestore";
import { getFirebaseApp } from "./client";

export const db = getFirestore(getFirebaseApp());

export default db;
