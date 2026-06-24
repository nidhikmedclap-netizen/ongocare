import { auth } from "@/lib/firebase/auth";
import { buildAdminDoctorUpdatePayload } from "./doctorEditForm";
import { throwIfApiFailed } from "@/lib/ui/userErrorMessage";
import { readApiJson } from "@/lib/api/client";
import {
  uploadAdminDoctorHeadshot,
  uploadAdminDoctorSignature,
} from "./uploadAdminDoctorAssets";

export async function submitAdminDoctorUpdate({
  doctor,
  values,
  orgSlugs,
  photoFile,
  signatureUploadDataUrl,
  onStatus = () => {},
}) {
  onStatus("Saving changes…");
  const idToken = await auth.currentUser?.getIdToken();
  if (!idToken) throw new Error("Not signed in");

  const headshot = photoFile
    ? await uploadAdminDoctorHeadshot({ uid: doctor.uid, photoFile, onStatus })
    : null;

  const hasNewSignature = Boolean(signatureUploadDataUrl);
  const signature = hasNewSignature
    ? await uploadAdminDoctorSignature({
        uid: doctor.uid,
        signatureUploadDataUrl,
        onStatus,
      })
    : null;

  const body = buildAdminDoctorUpdatePayload({
    form: values,
    photoURL: headshot?.downloadURL || undefined,
    headshot: headshot?.stored || undefined,
    signatureURL: signature?.downloadURL || (hasNewSignature ? "" : undefined),
    signature: signature?.stored || undefined,
    signatureDataUrl: hasNewSignature
      ? signature?.downloadURL
        ? ""
        : signatureUploadDataUrl
      : undefined,
    orgSlugs,
    existingAvailability: doctor.availability,
  });

  const res = await fetch(`/api/admin/doctors/${doctor.uid}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(body),
  });
  const data = await readApiJson(res, "update");
  throwIfApiFailed(data, "update");
  return data;
}
