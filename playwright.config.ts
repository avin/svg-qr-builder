import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",

  fullyParallel: true,

  forbidOnly: true,

  retries: 0,

  workers: process.env.CI ? 1 : undefined,

  reporter: "html",

  webServer: {
    command: "npm run dev",
    url: "https://localhost:8888",
    ignoreHTTPSErrors: true,
    reuseExistingServer: !process.env.CI,
  },

  use: {
    baseURL: "https://localhost:8888",

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
