export const MIN_AGE_YEARS = 18;

export const MAX_UPLOAD_MB = 10;
export const ALLOWED_IMAGE_ACCEPT =
  "image/jpeg,image/png,image/heic,image/heif,image/webp";
export const ALLOWED_IMAGE_EXTS = ["jpg", "jpeg", "png", "heic", "heif", "webp"];

const ALLOWED_IMAGE_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/heic",
  "image/heif",
  "image/webp",
]);

export function validateImageUpload(file) {
  if (!file) return null;
  const sizeMB = file.size / (1024 * 1024);
  if (sizeMB > MAX_UPLOAD_MB) {
    return `File is too large (${sizeMB.toFixed(1)} MB). Max ${MAX_UPLOAD_MB} MB.`;
  }
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const mime = String(file.type || "").toLowerCase();
  const extOk = ALLOWED_IMAGE_EXTS.includes(ext);
  const mimeOk = ALLOWED_IMAGE_MIMES.has(mime);
  if (!extOk && !mimeOk) {
    return "Please upload a JPG, PNG, HEIC, or WEBP image.";
  }
  return null;
}

export const BMI_CATEGORY_CARDS = [
  { key: "under", name: "UNDER", range: "< 18.5" },
  { key: "healthy", name: "HEALTHY", range: "18.5 — 24.9" },
  { key: "over", name: "OVER", range: "25 — 29.9" },
  { key: "obese", name: "OBESE", range: "≥ 30" },
];

export const WEIGHT_GOAL_CARDS = [
  { value: "1–15 lbs.", desc: "Slim down. Tone up. Stay on track." },
  { value: "16–50 lbs.", desc: "Lose weight & keep it off — no more yo-yo cycles." },
  { value: "50+ lbs.", desc: "Bigger goal? We'll match you with the right plan." },
  { value: "I’m not sure yet", desc: "That's okay — we'll help you figure it out." },
];

export function getCurrentLbs(form) {
  if (form.bmiUnit === "imperial") {
    return parseFloat(form.weightLbs) || 0;
  }
  const kg = parseFloat(form.weightKg) || 0;
  return kg * 2.20462;
}

export function estimateLossLbs(form, currentLbs) {
  switch (form.s1) {
    case "1–15 lbs.":
      return 8;
    case "16–50 lbs.":
      return 33;
    case "50+ lbs.":
      return Math.min(Math.max(60, currentLbs * 0.18), 130);
    default:
      return Math.max(8, currentLbs * 0.1);
  }
}

/** iGood chart: projected loss = 20% of starting weight (goal = 80% of start). */
export function projectTwentyPercentLossLbs(currentLbs) {
  return Math.max(1, Math.round(currentLbs * 0.2));
}
