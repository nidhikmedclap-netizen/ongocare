#!/usr/bin/env node
//
// Local dev: call the onboarding cron API every minute.
//
// Usage (with npm run dev:dashboard on 3001 or npm run dev on 3000):
//   npm run dev:cron-onboarding

import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  callCronEndpoint,
  loadDotenv,
  resolveCronBaseUrls,
} from "./dev-cron-lib.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

loadDotenv(path.join(projectRoot, ".env.local"));

const secret = String(process.env.CRON_SECRET || "").trim();
const baseUrls = resolveCronBaseUrls();
const intervalMs = Number(process.env.CRON_LOCAL_INTERVAL_MS || 60_000);
const label = "dev-cron-onboarding";

if (!secret) {
  console.error(`[${label}] CRON_SECRET missing in apps/web-app/.env.local`);
  process.exit(1);
}

async function tick() {
  await callCronEndpoint({
    label,
    path: "/api/cron/onboarding-process",
    secret,
    baseUrls,
  });
}

console.log(`[${label}] Local every-minute cron simulator started`);
console.log(`[${label}] interval:`, intervalMs / 1000, "seconds");
console.log(`[${label}] targets:`, baseUrls.join(", "));
console.log(`[${label}] Press Ctrl+C to stop\n`);

await tick();
setInterval(tick, intervalMs);
