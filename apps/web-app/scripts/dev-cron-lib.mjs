// Shared helpers for local cron simulator scripts.

import fs from "node:fs";
import path from "node:path";

export function loadDotenv(filepath) {
  if (!fs.existsSync(filepath)) return;
  for (const line of fs.readFileSync(filepath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    process.env[key] = val.replace(/\\n/g, "\n");
  }
}

/** Dashboard dev server is 3001; marketing is 3000 — try both by default. */
export function resolveCronBaseUrls() {
  const explicit = String(process.env.CRON_LOCAL_URL || "").trim();
  if (explicit) {
    return [explicit.replace(/\/$/, "")];
  }
  const ports = String(process.env.CRON_LOCAL_PORTS || "3001,3000")
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  return ports.map((port) => `http://localhost:${port}`);
}

export async function callCronEndpoint({ label, path, secret, baseUrls }) {
  const at = new Date().toISOString();
  let lastError = null;

  for (const baseUrl of baseUrls) {
    const url = `${baseUrl}${path}`;
    console.log(`\n[${label}] ▶ tick at ${at} → GET ${url}`);

    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${secret}` },
      });
      const body = await res.json().catch(() => ({}));

      if (res.status === 401) {
        console.error(`[${label}] ✗ Unauthorized — check CRON_SECRET in .env.local`);
        return { ok: false };
      }

      if (!res.ok || !body.success) {
        console.error(`[${label}] ✗ failed on ${baseUrl}`, res.status, body.message || body);
        lastError = body.message || res.status;
        continue;
      }

      const s = body.summary || {};
      console.log(`[${label}] ✓ cron ran OK on ${baseUrl}`, {
        scanned: s.scanned,
        eligible: s.eligible,
        sent: s.sent,
        skipped: s.skipped,
        failed: s.failed,
      });
      console.log(`[${label}] (see npm run dev terminal for full logs)`);
      return { ok: true, baseUrl, summary: s };
    } catch (err) {
      lastError = err?.message || err;
      console.error(`[${label}] ✗ ${baseUrl} unreachable —`, lastError);
    }
  }

  console.error(
    `[${label}] ✗ all targets failed. Start dev server: npm run dev:dashboard (3001) or npm run dev (3000)`,
  );
  return { ok: false, error: lastError };
}
