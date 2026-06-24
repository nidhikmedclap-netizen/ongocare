// e2e/auth/middleware.spec.js
//
// Unauthenticated route protection — no test credentials required.

const { test, expect } = require("@playwright/test");
const {
  marketingOrigin,
  dashboardOrigin,
  waitForServers,
} = require("../helpers/auth");

test.describe("Middleware — unauthenticated access", () => {
  test.beforeAll(async ({ request }) => {
    await waitForServers(request);
  });

  test("blocks dashboard patient route without session", async ({ page }) => {
    await page.goto(`${dashboardOrigin}/dashboard/patient`);

    await expect(page).toHaveURL(
      new RegExp(
        `${marketingOrigin.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/login`,
      ),
    );
    expect(page.url()).toContain("next=");
    expect(page.url()).toContain(encodeURIComponent("/dashboard/patient"));
  });

  test("redirects marketing /dashboard to login", async ({ page }) => {
    await page.goto(`${marketingOrigin}/dashboard/patient`);

    await expect(page).toHaveURL(/\/login/);
    expect(page.url()).toContain("next=");
  });

  test("redirects dashboard /login to marketing login", async ({ page }) => {
    await page.goto(`${dashboardOrigin}/login`);

    await expect(page).toHaveURL(
      new RegExp(`${marketingOrigin.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/login`),
    );
  });

  test("auth callback without handoff redirects to login", async ({ page }) => {
    await page.goto(`${dashboardOrigin}/auth/callback`);

    await expect(page).toHaveURL(/\/login/);
  });

  test("session status API returns 401 without cookie", async ({ request }) => {
    const res = await request.get(`${dashboardOrigin}/api/auth/session/status`);
    expect(res.status()).toBe(401);

    const body = await res.json();
    expect(body.success).toBe(false);
  });

  test("protected patient API returns 401 without auth", async ({ request }) => {
    const res = await request.get(`${dashboardOrigin}/api/patient/appointments`);
    expect(res.status()).toBe(401);
  });

  test("marketing login page is publicly accessible", async ({ page }) => {
    const res = await page.goto(`${marketingOrigin}/login`);
    expect(res?.status()).toBeLessThan(400);
    await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeVisible();
  });

  test("weightloss onboard is publicly accessible on marketing", async ({
    page,
  }) => {
    const res = await page.goto(`${marketingOrigin}/weightloss-onboard`);
    expect(res?.status()).toBeLessThan(400);
  });
});
