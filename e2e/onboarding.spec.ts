import { test, expect } from "@playwright/test";

test.describe("Onboarding Flow", () => {
  test("onboarding page shows step 1 by default", async ({ page }) => {
    // Only accessible if user is logged in but hasn't completed onboarding
    test.skip(!process.env.TEST_NEW_USER_SESSION, "Requires new user session");

    await page.goto("/onboarding");
    await expect(page.getByText(/step 1/i)).toBeVisible();
    await expect(page.getByLabel(/username/i)).toBeVisible();
  });

  test("onboarding step 1 requires username before proceeding", async ({ page }) => {
    test.skip(!process.env.TEST_NEW_USER_SESSION, "Requires new user session");

    await page.goto("/onboarding");
    const nextBtn = page.getByRole("button", { name: /next/i });
    // Button should be disabled without username
    await expect(nextBtn).toBeDisabled();

    await page.getByLabel(/username/i).fill("testbuilder");
    await expect(nextBtn).toBeEnabled();
  });

  test("location detect button is present in step 2", async ({ page }) => {
    test.skip(!process.env.TEST_NEW_USER_SESSION, "Requires new user session");

    await page.goto("/onboarding");
    await page.getByLabel(/username/i).fill("testbuilder");
    await page.getByRole("button", { name: /next/i }).click();

    await expect(page.getByRole("button", { name: /detect.*location/i })).toBeVisible();
    await expect(page.getByLabel(/city/i)).toBeVisible();
  });

  test("stack and roles are multi-selectable in step 3", async ({ page }) => {
    test.skip(!process.env.TEST_NEW_USER_SESSION, "Requires new user session");

    await page.goto("/onboarding");
    // Navigate to step 3
    await page.getByLabel(/username/i).fill("testbuilder");
    await page.getByRole("button", { name: /next/i }).click();
    await page.getByRole("button", { name: /next/i }).click();

    // Should see stack badges
    await expect(page.getByText("React")).toBeVisible();
    await expect(page.getByText("backend")).toBeVisible();
  });
});
