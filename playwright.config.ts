import path from "node:path";
import { defineConfig, devices } from "@playwright/test";
import { testEnv } from "./tests/support/test-env.mjs";

const isCI = Object.hasOwn(process.env, "CI");
const webPort = testEnv.WEB_PORT;

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  ...(isCI ? { workers: 1 } : {}),
  reporter: [
    ["html", { outputFolder: path.join(testEnv.EVIDENCE_DIR, "playwright-report") }],
    ["json", { outputFile: path.join(testEnv.EVIDENCE_DIR, "e2e-results.json") }],
  ],
  use: {
    baseURL: `http://localhost:${webPort}`,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chrome", use: { ...devices["Pixel 5"] } },
  ],
  webServer: {
    command: `pnpm build && pnpm start -- -p ${webPort}`,
    port: webPort,
    reuseExistingServer: !isCI,
    timeout: 120_000,
  },
});
