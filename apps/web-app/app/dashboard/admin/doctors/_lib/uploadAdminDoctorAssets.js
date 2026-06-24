import { auth } from "@/lib/firebase/auth";
import { readApiJson } from "@/lib/api/client";
import { throwIfApiFailed } from "@/lib/ui/userErrorMessage";

export async function uploadAdminDoctorHeadshot({ uid, photoFile, onStatus }) {
  if (!uid || !photoFile) return null;

  onStatus?.("Uploading headshot…");
  const idToken = await auth.currentUser?.getIdToken();
  if (!idToken) throw new Error("Not signed in");

  const body = new FormData();
  body.append("file", photoFile);

  const res = await fetch(`/api/admin/doctors/${uid}/headshot`, {
    method: "POST",
    headers: { Authorization: `Bearer ${idToken}` },
    body,
  });
  const data = await readApiJson(res, "upload");
  throwIfApiFailed(data, "upload");
  return { stored: data.headshot, downloadURL: data.downloadURL };
}

export async function uploadAdminDoctorSignature({
  uid,
  signatureDataUrl,
  onStatus,
}) {
  if (!uid || !signatureDataUrl) return null;

  onStatus?.("Uploading signature…");
  const idToken = await auth.currentUser?.getIdToken();
  if (!idToken) throw new Error("Not signed in");

  const res = await fetch(`/api/admin/doctors/${uid}/signature`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ signatureDataUrl }),
  });
  const data = await readApiJson(res, "upload");
  throwIfApiFailed(data, "upload");
  return { stored: data.signature, downloadURL: data.downloadURL };
}
