import { defineConfig } from '@playwright/test';
// Deliberately isolated from Atlas-backed account lifecycle tests and teardown.
export default defineConfig({
  testDir:'./tests/flashcard-e2e', workers:1, retries:0, reporter:'list',
  use:{baseURL:'http://127.0.0.1:3000',viewport:{width:390,height:844}},
  webServer:{command:'npm run dev -- --hostname 127.0.0.1',url:'http://127.0.0.1:3000',reuseExistingServer:!process.env.CI,timeout:60000},
});
