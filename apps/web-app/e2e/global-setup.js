// e2e/global-setup.js
//
// After Playwright's webServer starts marketing (:3000), wait for dashboard (:3001).

const { dashboardOrigin, marketingOrigin } = require("./helpers/auth");

async function ping(url, timeoutMs = 5000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      redirect: "manual",
      signal: controller.signal,
    });
    return res.status < 500;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

async function waitForOrigin(label, origin, path = "/") {
  const url = `${origin}${path}`;
  const maxAttempts = 90;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    if (await ping(url)) {
      // eslint-disable-next-line no-console
      console.log(`[e2e setup] ${label} ready at ${url}`);
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  throw new Error(
    `[e2e setup] ${label} not ready at ${url} after ${maxAttempts * 2}s. Run: npm run dev:split`,
  );
}

module.exports = async function globalSetup() {
  await waitForOrigin("Marketing", marketingOrigin, "/login");
  await waitForOrigin("Dashboard", dashboardOrigin, "/auth/callback");
};
