import path from "node:path";
import { defineConfig, devices } from "@playwright/test";
import { testEnv } from "./tests/support/test-env.mjs";

const isCI = Object.hasOwn(process.env, "CI");
const webPort = testEnv.WEB_PORT;
const { BASE_URL, E2E_BASE_URL } = process.env;
const baseURL = BASE_URL ?? E2E_BASE_URL ?? `http://localhost:${webPort}`;
const useLocalWebServer =
  baseURL.startsWith("http://localhost") || baseURL.startsWith("http://127.0.0.1");

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
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chrome", use: { ...devices["Pixel 5"] } },
  ],
  ...(useLocalWebServer
    ? {
        webServer: {
          command: `pnpm dev --port ${webPort}`,
          port: webPort,
          reuseExistingServer: !isCI,
          timeout: 120_000,
        },
      }
    : {}),
});
