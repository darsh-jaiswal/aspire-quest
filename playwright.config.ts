import { defineConfig, devices } from "@playwright/test";

/**
 * E2E config.
 *
 * `reuseExistingServer` is true everywhere, not just in dev: this project's
 * dev server is routinely already running (see README — port 3000 is
 * frequently in use), and CI gets a cold start from the same command either
 * way. Pointed at `next start` rather than `next dev` so what ships is what
 * gets tested.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",

  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },

  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],

  webServer: {
    command: "npm run build && npm run start",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
