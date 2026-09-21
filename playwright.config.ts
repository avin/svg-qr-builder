import { defineConfig, devices } from "@playwright/test";

const devServerPort = process.env.PORT || "8888";
const baseURL = `https://localhost:${devServerPort}`;

export default defineConfig({
  testDir: "./e2e",

  fullyParallel: true,

  forbidOnly: true,

  retries: 0,

  workers: process.env.CI ? 1 : undefined,

  reporter: "html",

  webServer: {
    command: "npm run dev",
    url: baseURL,
    ignoreHTTPSErrors: true,
    reuseExistingServer: !process.env.CI,
  },

  use: {
    baseURL,

    ignoreHTTPSErrors: true,

    trace: "retain-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
