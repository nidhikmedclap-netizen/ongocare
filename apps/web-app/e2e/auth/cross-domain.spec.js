// e2e/auth/cross-domain.spec.js
//
// Split-site cross-domain redirect chain verification.

const { test, expect } = require("@playwright/test");
const {
  marketingOrigin,
  dashboardOrigin,
  hasTestCredentials,
  waitForServers,
  loginAsPatient,
} = require("../helpers/auth");

test.describe("Cross-domain split-site flow", () => {
  test.beforeAll(async ({ request }) => {
    await waitForServers(request);
  });

  test("login starts on marketing origin", async ({ page }) => {
    test.skip(
      !hasTestCredentials(),
      "Set E2E_TEST_EMAIL and E2E_TEST_PASSWORD",
    );

    await page.goto(`${marketingOrigin}/login`);
    expect(new URL(page.url()).origin).toBe(marketingOrigin);

    await page.getByPlaceholder("you@example.com").fill(process.env.E2E_TEST_EMAIL);
    await page.getByPlaceholder("Password").fill(process.env.E2E_TEST_PASSWORD);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();

    await page.waitForURL(/\/auth\/callback/, { timeout: 30_000 });
    expect(new URL(page.url()).origin).toBe(dashboardOrigin);
  });

  test("ends on dashboard origin after handoff", async ({ page }) => {
    test.skip(
      !hasTestCredentials(),
      "Set E2E_TEST_EMAIL and E2E_TEST_PASSWORD",
    );

    await loginAsPatient(page);

    expect(new URL(page.url()).origin).toBe(dashboardOrigin);
    expect(page.url()).toContain("/dashboard/patient");
  });

  test("dashboard host redirects public marketing pages to marketing origin", async ({
    page,
  }) => {
    await page.goto(`${dashboardOrigin}/weightloss-onboard`);
    await expect(page).toHaveURL(
      new RegExp(
        `${marketingOrigin.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/weightloss-onboard`,
      ),
    );
  });

  test("marketing host cannot serve dashboard routes", async ({ page }) => {
    await page.goto(`${marketingOrigin}/dashboard/patient`);
    await expect(page).toHaveURL(/\/login/);
    expect(page.url()).not.toContain(":3001");
  });
});
