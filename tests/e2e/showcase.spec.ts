import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { expect, test } from "@playwright/test";

const evidenceDir = path.resolve(".omo/evidence/lendas-do-dc/task-6-lendas-do-dc/showcase");
const sections = [
  /Colors/i,
  /Typography/i,
  /Spacing/i,
  /Buttons/i,
  /Inputs/i,
  /Textarea/i,
  /Select/i,
  /Dialog/i,
  /AlertDialog/i,
  /Toast/i,
  /Avatar/i,
  /Badge/i,
  /Skeleton/i,
  /Progress/i,
  /EmptyState/i,
  /ErrorState/i,
  /Layout primitives/i,
] as const;

test.beforeAll(async () => {
  await mkdir(evidenceDir, { recursive: true });
});

test.describe("Primitive Showcase", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dev/showcase");
  });

  test("renders all sections and interactive overlay states", async ({ page }) => {
    for (const section of sections) {
      await expect(page.getByRole("heading", { name: section })).toBeVisible();
    }

    await page.getByRole("button", { name: "Abrir diálogo" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeHidden();

    await page.getByRole("button", { name: "Apagar rascunho" }).click();
    await expect(page.getByRole("alertdialog")).toBeVisible();
    await page.getByRole("button", { name: "Cancelar" }).click();
    await expect(page.getByRole("alertdialog")).toBeHidden();

    await page.getByRole("button", { name: "Aviso success" }).click();
    await expect(page.getByText("Publicado")).toBeVisible();
  });

  test("buttons are keyboard accessible", async ({ page }) => {
    const button = page.getByRole("button", { name: /Primary/i });
    await button.focus();
    await expect(button).toHaveCSS("outline-style", "solid");
    await expect(button).toHaveCSS("outline-width", "2px");
  });

  for (const viewport of [
    { name: "375", width: 375, height: 812 },
    { name: "768", width: 768, height: 1024 },
    { name: "1280", width: 1280, height: 720 },
  ] as const) {
    test(`responsive at ${viewport.name}px`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.reload();
      const dimensions = await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      }));
      expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
      await page.screenshot({
        path: path.join(evidenceDir, `showcase-${viewport.name}.png`),
        fullPage: true,
      });
    });
  }

  test("records basic accessibility scan", async ({ page }) => {
    const violations = await page.evaluate(() => {
      const controls = Array.from(
        document.querySelectorAll("button, input, textarea, [role=combobox]"),
      );
      return controls
        .filter(
          (control) =>
            !control.getAttribute("aria-label") &&
            !control.getAttribute("id") &&
            !control.textContent?.trim(),
        )
        .map((control) => ({ tag: control.tagName, role: control.getAttribute("role") }));
    });
    await writeFile(
      path.join(evidenceDir, "accessibility-violations.json"),
      JSON.stringify({ violations }, null, 2),
    );
    expect(violations).toEqual([]);
  });
});
