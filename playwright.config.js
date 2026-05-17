import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/browser",
  timeout: 90_000,
  workers: 1,
  reporter: [["list"]],
  webServer: {
    command: "npm run build && npm run preview -- --host 127.0.0.1 --port 4174",
    url: "http://127.0.0.1:4174/",
    reuseExistingServer: false,
    timeout: 120_000,
  },
  use: {
    ...devices["Desktop Chrome"],
    baseURL: "http://127.0.0.1:4174/",
    channel: process.env.PLAYWRIGHT_CHANNEL || "chrome",
    actionTimeout: 20_000,
    navigationTimeout: 30_000,
  },
});
