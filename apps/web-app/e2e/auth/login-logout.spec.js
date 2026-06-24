// e2e/auth/login-logout.spec.js
//
// Full split-site login + logout flows. Requires E2E_TEST_EMAIL and
// E2E_TEST_PASSWORD in .env.local (or environment).

const { test, expect } = require("@playwright/test");
const {
  marketingOrigin,
  dashboardOrigin,
  hasTestCredentials,
  waitForServers,
  loginAsPatient,
  signOutFromDashboard,
  dashboardSessionCookie,
  SESSION_COOKIE_NAME,
} = require("../helpers/auth");

test.describe("Email login and logout", () => {
  test.beforeAll(async ({ request }) => {
    await waitForServers(request);
  });

  test.beforeEach(() => {
    test.skip(
      !hasTestCredentials(),
      "Set E2E_TEST_EMAIL and E2E_TEST_PASSWORD to run authenticated tests",
    );
  });

  test("email login creates session and opens patient dashboard", async ({
    page,
    context,
  }) => {
    await loginAsPatient(page);

    expect(page.url()).toMatch(
      new RegExp(`^${dashboardOrigin.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/dashboard/patient`),
    );

    const cookies = await context.cookies();
    const session = dashboardSessionCookie(cookies);
    expect(session, "Expected __session cookie on dashboard origin").toBeTruthy();
    expect(session.httpOnly).toBe(true);
    expect(session.sameSite).toBe("Lax");
    expect(session.path).toBe("/");
  });

  test("handoff and session API calls succeed during login", async ({ page }) => {
    const apiCalls = [];

    page.on("request", (req) => {
      const url = req.url();
      if (
        url.includes("/api/auth/handoff") ||
        url.includes("/auth/callback") ||
        url.includes("/api/auth/establish")
      ) {
        apiCalls.push(url);
      }
    });

    await loginAsPatient(page);

    expect(
      apiCalls.some((u) => u.includes("/api/auth/handoff")),
      "Expected POST /api/auth/handoff during login",
    ).toBe(true);
    expect(
      apiCalls.some((u) => u.includes("/auth/callback")),
      "Expected /auth/callback redirect during login",
    ).toBe(true);
  });

  test("logout clears session and blocks dashboard", async ({ page, context }) => {
    await loginAsPatient(page);
    await signOutFromDashboard(page);

    await expect(page).toHaveURL(/\/login/);

    const cookies = await context.cookies();
    const session = dashboardSessionCookie(cookies);
    expect(session, "Session cookie should be cleared after logout").toBeFalsy();

    await page.goto(`${dashboardOrigin}/dashboard/patient`);
    await expect(page).toHaveURL(/\/login/);
  });

  test("refresh dashboard after logout redirects to login", async ({
    page,
  }) => {
    await loginAsPatient(page);
    await signOutFromDashboard(page);

    await page.goto(`${dashboardOrigin}/dashboard/patient`);
    await expect(page).toHaveURL(/\/login/);

    await page.reload();
    await expect(page).toHaveURL(/\/login/);
  });

  test("direct URL to protected profile route blocked after logout", async ({
    page,
  }) => {
    await loginAsPatient(page);
    await signOutFromDashboard(page);

    await page.goto(`${dashboardOrigin}/dashboard/patient/profile`);
    await expect(page).toHaveURL(/\/login/);
  });

  test("bookmark navigation blocked after logout", async ({ page, context }) => {
    await loginAsPatient(page);

    const dashboardUrl = page.url();
    expect(dashboardUrl).toContain("/dashboard/patient");

    await signOutFromDashboard(page);

    const newPage = await context.newPage();
    await newPage.goto(dashboardUrl);
    await expect(newPage).toHaveURL(/\/login/);
    await newPage.close();
  });

  test("protected API returns 401 after logout", async ({ page, request }) => {
    await loginAsPatient(page);
    await signOutFromDashboard(page);

    const res = await request.get(`${dashboardOrigin}/api/patient/appointments`);
    expect(res.status()).toBe(401);
  });
});

test.describe("Session cookie attributes after login", () => {
  test.beforeEach(() => {
    test.skip(
      !hasTestCredentials(),
      "Set E2E_TEST_EMAIL and E2E_TEST_PASSWORD to run authenticated tests",
    );
  });

  test("__session cookie name and security flags", async ({ page, context }) => {
    await loginAsPatient(page);

    const cookies = await context.cookies(dashboardOrigin);
    const session = cookies.find((c) => c.name === SESSION_COOKIE_NAME);

    expect(session).toBeTruthy();
    expect(session.httpOnly).toBe(true);
    expect(session.secure).toBe(false);
    expect(session.sameSite).toBe("Lax");
    expect(session.expires).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });
});
