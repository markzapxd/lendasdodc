import { expect, test } from "@playwright/test";

test("starter page loads in a real browser", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading")).toContainText("To get started");
});
