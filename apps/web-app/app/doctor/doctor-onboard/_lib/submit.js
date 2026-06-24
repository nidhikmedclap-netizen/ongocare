// app/doctor/doctor-onboard/_lib/submit.js
//
// Multi-step doctor signup: Auth → Storage uploads → API profile save.

import { timezoneForDoctorHomeState } from "@/lib/doctor/homeState";
import { formatPhoneDisplay } from "@/lib/phone/usPhone";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase/auth";
import {
  uploadDoctorHeadshot,
  uploadDoctorSignature,
} from "@/lib/storage/uploads";
import { throwIfApiFailed } from "@/lib/ui/userErrorMessage";
import { availabilityToWeeklySchedule } from "./constants";

export async function submitDoctorSignup({
  form,
  photoFile,
  signatureDataUrl,
  orgSlug = null,
  onStatus = () => {},
}) {
  onStatus("Creating your account…");
  const cred = await createUserWithEmailAndPassword(
    auth,
    form.email.trim().toLowerCase(),
    form.password,
  );
  const uid = cred.user.uid;

  const headshot = await uploadDoctorHeadshot({ uid, photoFile, onStatus });
  const signature = await uploadDoctorSignature({
    uid,
    signatureDataUrl,
    onStatus,
  });

  onStatus("Saving your profile…");
  const idToken = await cred.user.getIdToken();
  const res = await fetch("/api/doctor/signup", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(
      buildSignupPayload({
        form,
        headshot,
        signature,
        signatureDataUrl,
        orgSlug,
      }),
    ),
  });

  const data = await res.json();
  throwIfApiFailed(data, "Could not finish registration. Please try again.");
  return data;
}

function buildSignupPayload({
  form,
  headshot,
  signature,
  signatureDataUrl,
  orgSlug,
}) {
  return {
    orgSlug: orgSlug || undefined,
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    phone: form.phone.trim() ? formatPhoneDisplay(form.phone) : "",
    bio: form.bio.trim(),
    licenses: form.licenses.map((l) => ({
      state: l.state,
      licenseNumber: l.licenseNumber.trim(),
      licenseType: l.licenseType,
    })),
    homeState: form.homeState || form.licenses.find((l) => l.state)?.state || "",
    photoURL: headshot?.downloadURL || "",
    headshot: headshot?.stored || null,
    prescriptionTemplate: "",
    signatureURL: signature?.downloadURL || "",
    signature: signature?.stored || null,
    signatureDataUrl: signature?.downloadURL ? "" : signatureDataUrl,
    banking: {
      accountHolder: form.banking.accountHolder.trim(),
      bankName: form.banking.bankName.trim(),
      accountType: form.banking.accountType,
      routingNumber: form.banking.routingNumber.trim(),
      accountNumber: form.banking.accountNumber.replace(/\s/g, ""),
    },
    availability: {
      slotDurationMinutes: form.slotDurationMinutes,
      timezone: timezoneForDoctorHomeState(
        form.homeState || form.licenses.find((l) => l.state)?.state,
      ),
      weeklySchedule: availabilityToWeeklySchedule(form.availability),
    },
  };
}

export function mapSignupError(err) {
  const code = err?.code || "";
  if (code === "auth/email-already-in-use") {
    return "That email is already registered. Try signing in instead.";
  }
  if (code === "auth/weak-password") {
    return "Password is too weak. Try a longer one.";
  }
  return err?.message || "Something went wrong. Please try again.";
}
