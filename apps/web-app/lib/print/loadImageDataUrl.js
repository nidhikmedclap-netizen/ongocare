// lib/print/loadImageDataUrl.js

function isFirebaseStorageUrl(url) {
  return url.includes("firebasestorage.googleapis.com");
}

/**
 * @param {string} url
 * @param {{ authToken?: string }} [options]
 */
export async function loadImageDataUrl(url, { authToken } = {}) {
  const src = String(url ?? "").trim();
  if (!src) return "";
  if (src.startsWith("data:image/")) return src;

  const useProxy = isFirebaseStorageUrl(src) && authToken;
  const fetchUrl = useProxy
    ? `/api/media/image?url=${encodeURIComponent(src)}`
    : src;
  const headers = useProxy ? { Authorization: `Bearer ${authToken}` } : {};

  const res = await fetch(fetchUrl, { headers });
  if (!res.ok) throw new Error("Could not load signature image.");
  const blob = await res.blob();
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read signature image."));
    reader.readAsDataURL(blob);
  });
}
