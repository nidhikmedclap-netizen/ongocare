// app/api/mautic/route.js
//
// Server-side proxy for Mautic standalone form submissions. Avoids CORS
// by POSTing from the server instead of the browser.

import { NextResponse } from "next/server";
import { fail, withErrorHandling } from "@/lib/api";

const MAUTIC_BASE_URL = "https://mautic.taskor.io";

export const POST = withErrorHandling(async (req) => {
  const body = await req.json().catch(() => ({}));
  const formId = typeof body.formId === "number" ? body.formId : null;
  const payload =
    body.payload && typeof body.payload === "object" ? body.payload : null;

  if (!formId) return fail("Missing formId.", 400);
  if (!payload || typeof payload.email !== "string" || !payload.email) {
    return fail("Missing email.", 400);
  }

  const formData = new URLSearchParams();
  formData.set("mauticform[formId]", String(formId));
  formData.set("mauticform[messenger]", "1");
  formData.set("mauticform[return]", "");

  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined || value === null || value === "") continue;
    formData.set(`mauticform[${key}]`, String(value));
  }

  const res = await fetch(`${MAUTIC_BASE_URL}/form/submit?formId=${formId}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formData.toString(),
    redirect: "manual",
  });

  // Mautic returns 3xx on a successful form post (it would normally
  // redirect to a thank-you page), so 2xx and 3xx both count as success.
  const success = res.ok || (res.status >= 300 && res.status < 400);
  return NextResponse.json({ success, status: res.status });
});
