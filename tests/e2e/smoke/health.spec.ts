import { expect, test } from "@playwright/test";

test("homepage loads", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
});

test("health endpoint responds", async ({ page }) => {
  // Placeholder for actual health check
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
});
