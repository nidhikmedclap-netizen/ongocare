// app/api/storage/signed-url/route.js
//
// GET ?path=patients/{uid}/documents/photo-id.jpg
// Returns a short-lived signed URL for an authorized storage object.

import { getSignedStorageUrl } from "@/lib/firebase/admin";
import { assertStoragePathReadable } from "@/services/firebase/storageAccess";
import { fail, ok, withAuth } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withAuth(async (request, _ctx, auth) => {
  const path = request.nextUrl.searchParams.get("path") || "";
  try {
    await assertStoragePathReadable(
      {
        uid: auth.user.uid,
        role: auth.user.role || "patient",
        orgSlug: auth.orgSlug || auth.user.orgSlug || null,
      },
      path,
    );
    const url = await getSignedStorageUrl(path);
    return ok({ url, path });
  } catch (err) {
    if (err?.code === "STORAGE_PATH_INVALID") {
      return fail("Invalid file path.", 400);
    }
    if (err?.code === "STORAGE_FORBIDDEN") {
      return fail("Forbidden", 403);
    }
    throw err;
  }
});
