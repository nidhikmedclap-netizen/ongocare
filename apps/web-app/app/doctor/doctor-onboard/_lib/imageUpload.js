export const DOCTOR_IMAGE_ACCEPT =
  "image/jpeg,image/png,image/heic,image/heif,.jpg,.jpeg,.png,.heic,.heif";

const ALLOWED_EXTS = new Set(["jpg", "jpeg", "png", "heic", "heif"]);
const ALLOWED_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/jpg",
  "image/heic",
  "image/heif",
]);

export const DOCTOR_IMAGE_FORMAT_HINT =
  "Please choose a JPG, PNG, or iPhone (HEIC) image.";

export function validateDoctorImageFile(file, maxMb) {
  if (!file) return null;

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const mime = (file.type || "").toLowerCase();
  const extOk = ALLOWED_EXTS.has(ext);
  const mimeOk = !mime || ALLOWED_MIMES.has(mime);

  if (!extOk || !mimeOk) {
    return DOCTOR_IMAGE_FORMAT_HINT;
  }

  const sizeMB = file.size / (1024 * 1024);
  if (sizeMB > maxMb) {
    return `File is too large (${sizeMB.toFixed(1)} MB). Max ${maxMb} MB.`;
  }

  return null;
}

export function isAllowedDoctorImageDataUrl(dataUrl) {
  if (typeof dataUrl !== "string") return false;
  return (
    dataUrl.startsWith("data:image/jpeg") ||
    dataUrl.startsWith("data:image/png") ||
    dataUrl.startsWith("data:image/heic") ||
    dataUrl.startsWith("data:image/heif")
  );
}

export function clearFileInput(inputRef) {
  if (inputRef?.current) inputRef.current.value = "";
}
