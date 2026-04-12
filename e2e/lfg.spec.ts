import { test, expect } from "@playwright/test";

test.describe("LFG - Team Formation", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!process.env.TEST_SESSION_COOKIE, "Requires authenticated session");
  });

  test("LFG page shows Looking for Team and Looking for Members tabs", async ({
    page,
  }) => {
    await page.goto("/lfg");
    await expect(page.getByRole("tab", { name: /looking for team/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /looking for members/i })).toBeVisible();
  });

  test("create LFG post - looking for team", async ({ page }) => {
    await page.goto("/lfg/new");
    await expect(page.getByRole("heading", { name: /create/i })).toBeVisible();

    // Fill form
    await page.getByLabel(/title/i).fill("Backend dev looking for team at ETHGlobal");
    await page.getByLabel(/description/i).fill("Experienced Go developer, 3+ years");

    // Select type
    const typeSelect = page.getByRole("combobox").first();
    await typeSelect.selectOption("looking_for_team");

    // Select modality
    const modalitySelect = page.getByLabel(/modality/i);
    await modalitySelect.selectOption("remote");

    await page.getByRole("button", { name: /create post/i }).click();

    // Should redirect to /lfg after success
    await expect(page).toHaveURL(/\/lfg/, { timeout: 5000 });
  });

  test("create LFG post - looking for members", async ({ page }) => {
    await page.goto("/lfg/new");

    const typeSelect = page.getByRole("combobox").first();
    await typeSelect.selectOption("looking_for_members");

    // Roles needed section should appear
    await expect(page.getByText(/roles needed/i)).toBeVisible();
  });
});
