import { expect, test, type Page } from '@playwright/test';
import { asGuest } from './helpers';

const GUEST = 'dutchtap:grammar-mixed:v1';
const USER = 'dutchtap:grammar-mixed:v1:user:anna';
type Stat = { seen: number; right: number; streak: number; lastWrong: boolean; at?: string };

/** An in-memory stand-in for /api/grammar-mixed with the server's newer-wins rule. Never touches Atlas. */
async function account(page: Page, server: Map<string, Stat>, options: { failPost?: () => boolean } = {}) {
  await page.route('**/api/auth/me', route => route.fulfill({ json: { username: 'anna', lifetimeScore: 0, totalCorrect: 0, totalWrong: 0 } }));
  await page.route('**/api/flashcards**', route => route.fulfill({ json: { reviews: {} } }));
  await page.route('**/api/learning-sessions**', route => route.fulfill({ json: { sessions: [] } }));
  await page.route('**/api/grammar-mixed', async route => {
    if (route.request().method() === 'POST') {
      if (options.failPost?.()) return route.fulfill({ status: 500, json: { error: 'down' } });
      for (const { id, stat } of route.request().postDataJSON().records) { const old = server.get(id); if (!old || (old.at ?? '') <= stat.at) server.set(id, stat); }
      return route.fulfill({ json: { ok: true } });
    }
    return route.fulfill({ json: { progress: Object.fromEntries(server) } });
  });
}
const answerOne = async (page: Page) => { await page.getByTestId('mixed-option').first().click(); await expect(page.getByTestId('mixed-feedback')).toBeVisible(); };

test('a signed-in answer is saved on the device and in the account, and another device sees it', async ({ page, browser }) => {
  const server = new Map<string, Stat>();
  await account(page, server);
  await page.goto('/grammar/mixed');
  await expect(page.getByTestId('mixed-situation')).toBeVisible();
  await answerOne(page);
  await expect.poll(() => server.size).toBe(1);
  const [id, stat] = [...server][0];
  expect(stat.at).toBeTruthy();
  expect(await page.evaluate(k => Object.keys(JSON.parse(localStorage.getItem(k) || '{}')), USER)).toEqual([id]);
  // The guest key is untouched by a signed-in answer.
  expect(await page.evaluate(k => localStorage.getItem(k), GUEST)).toBeNull();

  const second = await browser.newContext();
  const phone = await second.newPage();
  await account(phone, server);
  await phone.goto('/grammar/mixed');
  await expect(phone.getByTestId('mixed-situation')).toBeVisible();
  expect(await phone.evaluate(k => Object.keys(JSON.parse(localStorage.getItem(k) || '{}')), USER)).toEqual([id]);
  await second.close();
});

test('answers saved on this device while offline are sent the next time the page opens', async ({ page }) => {
  const server = new Map<string, Stat>();
  let down = true;
  await account(page, server, { failPost: () => down });
  await page.goto('/grammar/mixed');
  await answerOne(page);
  await expect(page.getByTestId('mixed-next')).toBeVisible();
  expect(server.size).toBe(0);
  down = false;
  await page.reload();
  await expect(page.getByTestId('mixed-situation')).toBeVisible();
  await expect.poll(() => server.size).toBe(1);
});

test('guest answers stay separate until the learner adds them to the account', async ({ page }) => {
  const server = new Map<string, Stat>();
  await page.addInitScript(([k, v]) => { if (!localStorage.getItem(k)) localStorage.setItem(k, v); }, [GUEST, JSON.stringify({ 'mx-omdat-front': { seen: 2, right: 2, streak: 2, lastWrong: false, at: '2026-10-01T10:00:00.000Z' } })]);
  await account(page, server);
  await page.goto('/grammar/mixed');
  await page.getByTestId('mixed-situation').waitFor();
  expect(server.size).toBe(0);
  for (let i = 0; i < 8; i++) { await answerOne(page); await page.getByTestId('mixed-next').click(); }
  await page.getByTestId('mixed-copy-guest').click();
  await expect.poll(() => server.has('mx-omdat-front')).toBe(true);
  expect(await page.evaluate(k => localStorage.getItem(k) !== null, GUEST)).toBe(true);
});

test('a guest still practises with no account calls', async ({ page }) => {
  await asGuest(page);
  let calls = 0;
  await page.route('**/api/grammar-mixed', route => { calls++; return route.fulfill({ status: 401, json: {} }); });
  await page.goto('/grammar/mixed');
  await answerOne(page);
  expect(await page.evaluate(k => Object.keys(JSON.parse(localStorage.getItem(k) || '{}')).length, GUEST)).toBe(1);
  expect(calls).toBe(0);
});
