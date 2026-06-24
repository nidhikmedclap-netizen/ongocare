// e2e/helpers/auth.js
//
// Shared helpers for split-site authentication E2E tests.

const marketingOrigin =
  process.env.E2E_MARKETING_ORIGIN ||
  process.env.NEXT_PUBLIC_MARKETING_ORIGIN ||
  "http://localhost:3000";

const dashboardOrigin =
  process.env.E2E_DASHBOARD_ORIGIN ||
  process.env.NEXT_PUBLIC_DASHBOARD_ORIGIN ||
  "http://localhost:3001";

const SESSION_COOKIE_NAME = "__session";

function hasTestCredentials() {
  return Boolean(process.env.E2E_TEST_EMAIL && process.env.E2E_TEST_PASSWORD);
}

function testCredentials() {
  return {
    email: process.env.E2E_TEST_EMAIL || "",
    password: process.env.E2E_TEST_PASSWORD || "",
  };
}

/** Wait until both split-site dev servers respond. */
async function waitForServers(request) {
  const marketing = await request.get(`${marketingOrigin}/login`, {
    timeout: 15_000,
  });
  if (!marketing.ok()) {
    throw new Error(
      `Marketing server not ready at ${marketingOrigin} (status ${marketing.status()})`,
    );
  }

  const dashboard = await request.get(`${dashboardOrigin}/auth/callback`, {
    timeout: 15_000,
    maxRedirects: 0,
  });
  if (dashboard.status() >= 500) {
    throw new Error(
      `Dashboard server error at ${dashboardOrigin} (status ${dashboard.status()})`,
    );
  }
}

/** Sign in on marketing and land on the patient dashboard. */
async function loginAsPatient(page) {
  const { email, password } = testCredentials();

  await page.goto(`${marketingOrigin}/login`);
  await page.getByPlaceholder("you@example.com").fill(email);
  await page.getByPlaceholder("Password").fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();

  await page.waitForURL(
    (url) =>
      url.origin === new URL(dashboardOrigin).origin &&
      url.pathname.startsWith("/dashboard/patient"),
    { timeout: 60_000 },
  );
}

/** Accept the native confirm() dialog used by confirmSignOut. */
function acceptSignOutDialog(page) {
  page.once("dialog", (dialog) => dialog.accept());
}

async function signOutFromDashboard(page) {
  acceptSignOutDialog(page);
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await page.waitForURL(
    (url) =>
      url.origin === new URL(marketingOrigin).origin &&
      url.pathname.includes("/login"),
    { timeout: 30_000 },
  );
}

function getSessionCookie(cookies) {
  return cookies.find(
    (cookie) =>
      cookie.name === SESSION_COOKIE_NAME &&
      cookie.domain.includes("localhost"),
  );
}

function dashboardSessionCookie(cookies) {
  const origin = new URL(dashboardOrigin);
  return cookies.find(
    (cookie) =>
      cookie.name === SESSION_COOKIE_NAME &&
      (cookie.domain === "localhost" || cookie.domain === origin.hostname),
  );
}

module.exports = {
  marketingOrigin,
  dashboardOrigin,
  SESSION_COOKIE_NAME,
  hasTestCredentials,
  testCredentials,
  waitForServers,
  loginAsPatient,
  acceptSignOutDialog,
  signOutFromDashboard,
  getSessionCookie,
  dashboardSessionCookie,
};
