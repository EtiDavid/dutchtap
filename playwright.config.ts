import { defineConfig } from "@playwright/test";

try {
  // Node 20.6+; loads MONGODB_URI etc. for global-teardown's cleanup script.
  process.loadEnvFile(".env.local");
} catch {
  // .env.local absent (e.g. CI) — tests that need it will skip/fail loudly instead.
}

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3000",
    viewport: { width: 390, height: 844 },
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  globalTeardown: "./tests/e2e/global-teardown.ts",
});
