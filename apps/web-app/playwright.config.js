// playwright.config.js
//
// E2E auth tests for split-site (marketing :3000 + dashboard :3001).
// Start servers first: npm run dev:split
// Or let Playwright start them via webServer below.

const fs = require("fs");
const path = require("path");

/** Load .env.local so E2E_TEST_* vars work without exporting manually. */
function loadEnvLocal() {
  const file = path.join(__dirname, ".env.local");
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvLocal();

const marketingOrigin =
  process.env.E2E_MARKETING_ORIGIN ||
  process.env.NEXT_PUBLIC_MARKETING_ORIGIN ||
  "http://localhost:3000";

/** @type {import('@playwright/test').PlaywrightTestConfig} */
const config = {
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  timeout: 90_000,
  expect: { timeout: 20_000 },
  use: {
    baseURL: marketingOrigin,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
  ],
  globalSetup: require.resolve("./e2e/global-setup.js"),
  webServer:
    process.env.E2E_SKIP_WEBSERVER === "true"
      ? undefined
      : {
          command:
            process.platform === "win32"
              ? "npm.cmd run dev:split"
              : "npm run dev:split",
          url: marketingOrigin,
          reuseExistingServer: !process.env.CI,
          timeout: 240_000,
          stdout: "pipe",
          stderr: "pipe",
          cwd: __dirname,
        },
};

module.exports = config;
