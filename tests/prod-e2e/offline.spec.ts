import { test, expect, type Page } from '@playwright/test';

const guest = (page: Page) => page.route('**/api/auth/me', route => route.fulfill({ status: 401, json: { error: 'Not signed in' } }));
async function controlled(page: Page) {
  await page.goto('/flashcards');
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));
  // the first page load is not controlled; reload so the active worker serves (and caches) the next one
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
}

test('the worker registers, replaces old caches, and keeps visited pages and sessions working offline', async ({ page, context }) => {
  await guest(page);
  // an old-format cache from the previous worker is deleted when the new worker activates
  await page.goto('/flashcards');
  await page.evaluate(() => caches.open('dutchtap-v2').then(c => c.put('/stale', new Response('old'))));
  await controlled(page);
  await expect.poll(() => page.evaluate(async () => (await caches.keys()).sort())).toEqual(expect.arrayContaining(['dutchtap-pages-v3']));
  expect(await page.evaluate(async () => (await caches.keys()).includes('dutchtap-v2'))).toBe(false);

  // visit the pages, then lose the connection
  for (const path of ['/quiz', '/vocabulary', '/flashcards']) { await page.goto(path); await page.waitForLoadState('load'); }
  await context.setOffline(true);

  await page.goto('/flashcards');
  await expect(page.getByRole('heading', { name: 'Flashcards' })).toBeVisible();
  await page.goto('/quiz');
  await expect(page.getByRole('heading', { name: 'Quiz', exact: true })).toBeVisible();

  // a session can be created and used offline, and is still there after an offline refresh
  await page.goto('/flashcards');
  await page.getByRole('button', { name: 'Create session' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Create session' }).click();
  await expect(page.getByTestId('session-name')).toBeVisible();
  await page.getByRole('button', { name: 'Next sentence' }).click();
  const position = await page.getByTestId('study-position').innerText();
  await page.reload(); // offline: served from the saved dashboard shell, state from this device
  await expect(page.getByTestId('study-position')).toHaveText(position);

  // a page that was never visited falls back to the saved dashboard instead of failing blankly
  await page.goto('/sentences/shopping-01');
  await expect(page.getByRole('heading', { name: 'Flashcards' })).toBeVisible();
  await context.setOffline(false);
});

test('the worker file itself is never cached, so a new version can be found', async ({ request }) => {
  const response = await request.get('/sw.js');
  expect(response.headers()['cache-control']).toMatch(/no-cache|no-store/);
  expect(response.headers()['service-worker-allowed']).toBe('/');
});
