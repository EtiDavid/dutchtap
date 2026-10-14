import { defineConfig } from '@playwright/test';
// Set E2E_PORT to run beside another dev server that already uses port 3000.
const port = process.env.E2E_PORT || '3000';
const url = `http://127.0.0.1:${port}`;
// Deliberately isolated from Atlas-backed account lifecycle tests and teardown.
export default defineConfig({
  testDir:'./tests/flashcard-e2e', workers:1, retries:0, reporter:'list',
  // Existing learners are Dutch learners: start every test with Dutch chosen. The French tests override this to test the first-launch chooser.
  use:{baseURL:url,viewport:{width:390,height:844},storageState:{cookies:[],origins:[{origin:url,localStorage:[{name:'dutchtap:language:v1',value:'nl'}]}]}},
  webServer:{command:`npm run dev -- --hostname 127.0.0.1 --port ${port}`,url,reuseExistingServer:!process.env.CI,timeout:60000},
});
