// app/api/media/image/route.js
//
// Proxies Firebase Storage images for print/PDF (avoids browser CORS blocks).

import { assertStoragePathReadable } from "@/services/firebase/storageAccess";
import { fail, withAuth } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function storagePathFromUrl(raw) {
  if (!raw || typeof raw !== "string") return null;
  try {
    const url = new URL(raw);
    if (url.hostname !== "firebasestorage.googleapis.com") return null;
    const match = url.pathname.match(/\/o\/(.+)$/);
    if (!match) return null;
    return decodeURIComponent(match[1].split("?")[0]);
  } catch {
    return null;
  }
}

function isAllowedStorageUrl(raw) {
  return !!storagePathFromUrl(raw);
}

export const GET = withAuth(async (request, _ctx, auth) => {
  const raw = request.nextUrl.searchParams.get("url");
  const path = storagePathFromUrl(raw);
  if (!path || !isAllowedStorageUrl(raw)) {
    return fail("Invalid or disallowed image URL", 400);
  }

  try {
    await assertStoragePathReadable(auth.user, path);
  } catch {
    return fail("Forbidden", 403);
  }

  const res = await fetch(raw);
  if (!res.ok) {
    return fail("Could not load image", 502);
  }

  const buf = await res.arrayBuffer();
  return new Response(buf, {
    headers: {
      "Content-Type": res.headers.get("content-type") || "image/png",
      "Cache-Control": "private, max-age=3600",
    },
  });
});
