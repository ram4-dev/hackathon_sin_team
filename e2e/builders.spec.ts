import { test, expect } from "@playwright/test";

test.describe("Builder Explorer", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!process.env.TEST_SESSION_COOKIE, "Requires authenticated session");
  });

  test("builder list loads with filters", async ({ page }) => {
    await page.goto("/builders");
    await expect(page.getByRole("heading", { name: /builders/i })).toBeVisible();
    await expect(page.getByPlaceholder(/search builders/i)).toBeVisible();
  });

  test("search filter narrows results", async ({ page }) => {
    await page.goto("/builders");
    const searchInput = page.getByPlaceholder(/search builders/i);
    await searchInput.fill("zzz_nonexistent_builder_xyz");
    await expect(page.getByText(/no builders match/i)).toBeVisible({ timeout: 2000 });
  });

  test("builder profile page loads", async ({ page }) => {
    await page.goto("/builders");
    const firstCard = page.locator("a[href^='/builders/']").first();
    if ((await firstCard.count()) === 0) {
      test.skip(true, "No builders in database");
    }
    await firstCard.click();
    await expect(page.getByRole("heading").first()).toBeVisible();
  });

  test("contact dropdown shows available links", async ({ page }) => {
    await page.goto("/builders");
    const firstCard = page.locator("a[href^='/builders/']").first();
    if ((await firstCard.count()) === 0) {
      test.skip(true, "No builders in database");
    }
    await firstCard.click();
    const contactBtn = page.getByRole("button", { name: /contact/i });
    await contactBtn.click();
    // Dropdown should appear with at least one contact option
    await expect(page.getByRole("menu")).toBeVisible();
  });
});
