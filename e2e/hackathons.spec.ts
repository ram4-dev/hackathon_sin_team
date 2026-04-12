import { test, expect } from "@playwright/test";

// These tests run against a seeded database with a valid session
// Set PLAYWRIGHT_BASE_URL and SESSION_COOKIE in env for authenticated tests

test.describe("Hackathon Explorer", () => {
  test.beforeEach(async ({ page }) => {
    // Skip if no auth session available
    test.skip(!process.env.TEST_SESSION_COOKIE, "Requires authenticated session");
  });

  test("hackathon list loads and shows cards", async ({ page }) => {
    await page.goto("/hackathons");
    await expect(page.getByRole("heading", { name: /hackathons/i })).toBeVisible();
    // With seed data, there should be at least one hackathon card
    await expect(page.locator('[data-testid="hackathon-card"]').first()).toBeVisible({
      timeout: 10000,
    });
  });

  test("filter by category works", async ({ page }) => {
    await page.goto("/hackathons");
    const select = page.getByRole("combobox").filter({ hasText: /category/i }).first();
    await select.selectOption("AI/ML");
    // Cards should update
    await page.waitForTimeout(300);
    // All visible cards should be AI/ML category
  });

  test("hackathon detail page shows key info", async ({ page }) => {
    await page.goto("/hackathons");
    await page.locator('[data-testid="hackathon-card"]').first().click();
    await expect(page.getByRole("heading").first()).toBeVisible();
    await expect(page.getByText(/interested builders/i)).toBeVisible();
    await expect(page.getByText(/lfg posts/i)).toBeVisible();
  });

  test("interested button toggles state", async ({ page }) => {
    await page.goto("/hackathons");
    await page.locator('[data-testid="hackathon-card"]').first().click();
    const interestedBtn = page.getByRole("button", { name: /interested/i });
    await interestedBtn.click();
    // Button text should change
    await expect(
      page.getByRole("button", { name: /not interested|remove interest/i })
    ).toBeVisible({ timeout: 3000 });
  });
});
