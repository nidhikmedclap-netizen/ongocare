// services/firebase/doctorProfileFields.js
//
// Shared parsing / sanitization for doctor profile payloads. Used by both
// the self-serve signup route (/api/doctor/signup) and the super-admin
// create route (/api/admin/doctors) so validation stays identical.

import { sanitizeStoredFile } from "@/lib/storage/metadata";
import {
  licenseStateKey,
  licenseStateTypeDuplicateMessage,
  licenseStateTypeKey,
  sanitizeLicenseNumber,
} from "@/app/weightloss-onboard/utils";
import {
  inferHomeStateFromLicenses,
  resolveHomeState,
  sanitizeHomeStateSelection,
} from "@/lib/doctor/homeState";
import { normalizePhoneForStorage } from "@/lib/phone/usPhone";

export function sanitizeLicenses(input) {
  if (!Array.isArray(input)) return [];
  return input
    .map((l) => ({
      state: typeof l?.state === "string" ? l.state.trim().toUpperCase() : "",
      licenseNumber: sanitizeLicenseNumber(
        typeof l?.licenseNumber === "string" ? l.licenseNumber : "",
      ),
      licenseType:
        typeof l?.licenseType === "string" ? l.licenseType.trim() : "",
    }))
    .filter((l) => l.state && l.licenseNumber);
}

/** Throws if the same state + license number appears twice in one submission. */
export function assertNoDuplicateLicenseNumbersInList(licenses) {
  const seen = new Set();
  for (const lic of licenses) {
    const key = licenseStateKey(lic.state, lic.licenseNumber);
    if (!key) continue;
    if (seen.has(key)) {
      throw new Error("Each license number must be unique within a state.");
    }
    seen.add(key);
  }
}

/** Throws if the same state + licenseType appears twice in one submission. */
export function assertNoDuplicateStateLicenseTypesInList(licenses) {
  const seen = new Set();
  for (const lic of licenses) {
    const key = licenseStateTypeKey(lic.state, lic.licenseType);
    if (!key) continue;
    if (seen.has(key)) {
      throw new Error(
        licenseStateTypeDuplicateMessage(lic.state, lic.licenseType),
      );
    }
    seen.add(key);
  }
}

export function sanitizeBanking(input) {
  if (!input || typeof input !== "object") return null;
  const routing = String(input.routingNumber || "").replace(/\D/g, "");
  const account = String(input.accountNumber || "").replace(/\D/g, "");
  if (!/^\d{9}$/.test(routing)) return null;
  if (!/^\d{6,17}$/.test(account)) return null;
  const accountType = input.accountType === "savings" ? "savings" : "checking";
  return {
    accountHolder: String(input.accountHolder || "").trim(),
    bankName: String(input.bankName || "").trim(),
    accountType,
    routingNumber: routing,
    accountNumber: account,
    accountNumberLast4: account.slice(-4),
  };
}

/**
 * Parse the clinical/profile portion of a doctor signup body.
 * Throws Error with a user-facing message on validation failure.
 */
export function parseDoctorProfileBody(body = {}) {
  const firstName =
    typeof body.firstName === "string" ? body.firstName.trim() : "";
  const lastName =
    typeof body.lastName === "string" ? body.lastName.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const bio = typeof body.bio === "string" ? body.bio.trim() : "";
  const licenses = sanitizeLicenses(body.licenses);
  const photoURL =
    typeof body.photoURL === "string" && body.photoURL.startsWith("http")
      ? body.photoURL
      : "";
  const prescriptionTemplate =
    typeof body.prescriptionTemplate === "string"
      ? body.prescriptionTemplate.trim().slice(0, 4000)
      : "";
  const headshot = sanitizeStoredFile(body.headshot);
  const signatureMeta = sanitizeStoredFile(body.signature);
  const signatureURL =
    typeof body.signatureURL === "string" && body.signatureURL.startsWith("http")
      ? body.signatureURL.trim().slice(0, 2048)
      : "";
  const signatureDataUrl =
    signatureURL
      ? ""
      : typeof body.signatureDataUrl === "string" &&
          body.signatureDataUrl.startsWith("data:image/")
        ? body.signatureDataUrl
        : "";
  const banking = sanitizeBanking(body.banking);

  if (!firstName || !lastName) throw new Error("Name is required.");
  let phoneNormalized = "";
  if (phone) {
    phoneNormalized = normalizePhoneForStorage(phone);
  } else {
    throw new Error("Phone is required.");
  }
  if (licenses.length === 0) {
    throw new Error("At least one license is required.");
  }
  assertNoDuplicateLicenseNumbersInList(licenses);
  assertNoDuplicateStateLicenseTypesInList(licenses);
  if (!banking) throw new Error("Valid US banking details are required.");

  const licensedStates = Array.from(new Set(licenses.map((l) => l.state)));
  const explicitHome =
    typeof body.homeState === "string" ? body.homeState.trim().toUpperCase() : "";
  let homeState;
  if (explicitHome) {
    homeState = sanitizeHomeStateSelection(explicitHome, licensedStates);
    if (!homeState) {
      throw new Error("Home state must be one of your licensed states.");
    }
  } else {
    homeState = resolveHomeState({ licenses }) || inferHomeStateFromLicenses(licenses);
  }

  return {
    firstName,
    lastName,
    phone: phoneNormalized,
    bio,
    licenses,
    homeState,
    photoURL,
    headshot,
    prescriptionTemplate,
    signatureURL,
    signature: signatureMeta,
    signatureDataUrl,
    banking,
  };
}
