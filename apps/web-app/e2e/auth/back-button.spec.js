// e2e/auth/back-button.spec.js
//
// Browser back / navigation after logout.

const { test, expect } = require("@playwright/test");
const {
  dashboardOrigin,
  hasTestCredentials,
  waitForServers,
  loginAsPatient,
  signOutFromDashboard,
} = require("../helpers/auth");

test.describe("Back button after logout", () => {
  test.beforeAll(async ({ request }) => {
    await waitForServers(request);
  });

  test.beforeEach(() => {
    test.skip(
      !hasTestCredentials(),
      "Set E2E_TEST_EMAIL and E2E_TEST_PASSWORD",
    );
  });

  test("back from login does not restore dashboard without session", async ({
    page,
  }) => {
    await loginAsPatient(page);

    const dashboardUrl = page.url();
    await signOutFromDashboard(page);

    await page.goto(dashboardUrl);
    await expect(page).toHaveURL(/\/login/);

    await page.goBack();
    await expect(page).toHaveURL(/\/login/);
  });

  test("multiple back presses stay off dashboard", async ({ page }) => {
    await loginAsPatient(page);
    await page.goto(`${dashboardOrigin}/dashboard/patient/profile`);
    await expect(page).toHaveURL(/\/dashboard\/patient\/profile/);

    await signOutFromDashboard(page);
    await expect(page).toHaveURL(/\/login/);

    await page.goBack();
    await page.goBack();

    expect(page.url()).toMatch(/\/login/);
    expect(page.url()).not.toContain("/dashboard/patient");
  });
});
