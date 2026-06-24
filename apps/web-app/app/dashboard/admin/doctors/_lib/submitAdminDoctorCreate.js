// app/dashboard/admin/doctors/_lib/submitAdminDoctorCreate.js

import { auth } from "@/lib/firebase/auth";
import { formatPhoneDisplay } from "@/lib/phone/usPhone";
import {
  uploadAdminDoctorHeadshot,
  uploadAdminDoctorSignature,
} from "./uploadAdminDoctorAssets";
import { throwIfApiFailed } from "@/lib/ui/userErrorMessage";
import { availabilityToWeeklySchedule } from "@/app/doctor/doctor-onboard/_lib/constants";

function buildDoctorPayload({ form, signatureDataUrl, signatureURL, signature, orgSlug, status }) {
  return {
    email: form.email.trim().toLowerCase(),
    password: form.password,
    orgSlug: orgSlug || undefined,
    status: status || "active",
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
    prescriptionTemplate: "",
    signatureURL: signatureURL || "",
    signature: signature || null,
    signatureDataUrl: signatureURL ? "" : signatureDataUrl,
    banking: {
      accountHolder: form.banking.accountHolder.trim(),
      bankName: form.banking.bankName.trim(),
      accountType: form.banking.accountType,
      routingNumber: form.banking.routingNumber.trim(),
      accountNumber: form.banking.accountNumber.replace(/\s/g, ""),
    },
    availability: {
      slotDurationMinutes: form.slotDurationMinutes,
      weeklySchedule: availabilityToWeeklySchedule(form.availability),
    },
  };
}

export async function submitAdminDoctorCreate({
  form,
  photoFile,
  signatureDataUrl,
  orgSlug,
  status = "active",
  onStatus = () => {},
}) {
  onStatus("Creating doctor account…");
  const idToken = await auth.currentUser?.getIdToken();
  if (!idToken) throw new Error("Not signed in");

  const res = await fetch("/api/admin/doctors", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(
      buildDoctorPayload({ form, signatureDataUrl, signatureURL: "", signature: null, orgSlug, status }),
    ),
  });
  const data = await res.json();
  throwIfApiFailed(data, "create");

  const uid = data.uid;
  const headshot = photoFile
    ? await uploadAdminDoctorHeadshot({ uid, photoFile, onStatus })
    : null;
  const signature = signatureDataUrl
    ? await uploadAdminDoctorSignature({ uid, signatureDataUrl, onStatus })
    : null;

  const patchBody = {};
  if (headshot?.downloadURL) {
    patchBody.photoURL = headshot.downloadURL;
    patchBody.headshot = headshot.stored;
  }
  if (signature?.downloadURL) {
    patchBody.signatureURL = signature.downloadURL;
    patchBody.signature = signature.stored;
    patchBody.signatureDataUrl = "";
  } else if (signatureDataUrl) {
    patchBody.signatureDataUrl = signatureDataUrl;
  }

  if (Object.keys(patchBody).length > 0) {
    onStatus("Saving profile assets…");
    const patchRes = await fetch(`/api/admin/doctors/${uid}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify(patchBody),
    });
    const patchData = await patchRes.json();
    if (!patchData?.success) {
      // eslint-disable-next-line no-console
      console.warn("[admin-doctor-create] asset patch failed:", patchData?.message);
    }
  }

  return data;
}

export function mapAdminCreateError(err) {
  return err?.message || "Something went wrong. Please try again.";
}
