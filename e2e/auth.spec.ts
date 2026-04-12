import { test, expect } from "@playwright/test";

test.describe("Authentication Flow", () => {
  test("unauthenticated user is redirected to login", async ({ page }) => {
    await page.goto("/map");
    await expect(page).toHaveURL(/\/login/);
  });

  test("login page shows OAuth buttons", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByText("BuilderMap")).toBeVisible();
    await expect(page.getByRole("button", { name: /GitHub/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Google/i })).toBeVisible();
  });

  test("logged-in user at root is redirected to map", async ({ page, context }) => {
    // This test requires a valid Supabase session — skip in CI without credentials
    test.skip(!process.env.TEST_USER_EMAIL, "Requires TEST_USER_EMAIL env var");
    // TODO: implement session cookie injection for authenticated tests
  });
});
