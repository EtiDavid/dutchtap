import { defineConfig } from '@playwright/test';
// Production-mode checks (the service worker only registers in a production build). Builds and serves the app on its own port.
const port = process.env.PROD_PORT || '3200';
const url = `http://127.0.0.1:${port}`;
export default defineConfig({
  testDir: './tests/prod-e2e', workers: 1, retries: 0, reporter: 'list',
  use: { baseURL: url, viewport: { width: 390, height: 844 } },
  webServer: { command: `npm run build && npx next start -H 127.0.0.1 -p ${port}`, url, reuseExistingServer: false, timeout: 300_000 },
});
