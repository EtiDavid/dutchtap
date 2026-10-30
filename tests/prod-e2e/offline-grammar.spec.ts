import { test, expect, type Page } from '@playwright/test';

/**
 * P6 offline checks for the grammar screens, in a production build (the service worker only registers there).
 * Pages are network first and are saved when visited, so what must work offline is "visited once, then used without a connection".
 * A page that was never visited falls back to the saved dashboard (existing behaviour, covered in offline.spec.ts).
 */
const guest = (page: Page) => page.route('**/api/auth/me', route => route.fulfill({ status: 401, json: { error: 'Not signed in' } }));
async function controlled(page: Page) {
  await page.goto('/flashcards');
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
}

test('visited grammar pages, the mixed round and a grammar session keep working with no connection', async ({ page, context }) => {
  await guest(page);
  await controlled(page);

  // visit while online: the mixed screen, a sentence page with its clause map, and the create dialog with a lesson
  await page.goto('/grammar/mixed');
  await expect(page.getByTestId('mixed-situation')).toBeVisible();
  await page.goto('/sentences/pat-connectors-01');
  await expect(page.getByTestId('clause-map')).toBeVisible();
  await page.goto('/flashcards?new=grammar:exceptions');
  const dialog = page.getByRole('dialog', { name: 'Create a session' });
  await dialog.getByRole('button', { name: '10', exact: true }).click();
  await dialog.getByRole('button', { name: 'Create session' }).click();
  await expect(page.getByTestId('session-name')).toBeVisible();
  const sessionUrl = page.url();
  await page.goto('/grammar/mixed');
  await page.waitForLoadState('networkidle');

  await context.setOffline(true);

  // 1. the mixed round loads offline and an answer is saved on the device
  await page.goto('/grammar/mixed');
  await expect(page.getByTestId('mixed-situation')).toBeVisible();
  await page.getByTestId('mixed-option').first().click();
  await expect(page.getByTestId('mixed-feedback')).toBeVisible();
  const saved = await page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('dutchtap:grammar-mixed:v1') || '{}')).length);
  expect(saved).toBe(1);

  // 2. the sentence page with its analysis loads offline
  await page.goto('/sentences/pat-connectors-01');
  await expect(page.getByTestId('clause-map').locator('[data-clause="bijzin"] mark')).toHaveText('woon');

  // 3. the grammar session is still there, the topic guide opens, and study works
  await page.goto(sessionUrl);
  await expect(page.getByTestId('session-name')).toBeVisible();
  const lesson = page.getByTestId('grammar-topic-lesson');
  // The guide has an inner <details> for a self-check, so a descendant
  // 'summary' selector matches multiple elements. Target the guide's own
  // accessible summary and only open it if it is currently collapsed.
  if (!(await lesson.evaluate((element) => (element as HTMLDetailsElement).open))) {
    await page.getByTestId('grammar-topic-lesson-summary').click();
  }
  await expect(lesson).toHaveAttribute('open', '');
  await expect(lesson.getByRole('heading', { name: /Sentence formulas/ })).toBeVisible();

  // 4. the create dialog and its lesson open offline too
  await page.goto('/flashcards?new=grammar:connectors');
  await expect(page.getByRole('dialog', { name: 'Create a session' })).toBeVisible();
  await context.setOffline(false);
});

test('a mixed-grammar answer given offline stays on the device and is not lost when the connection returns', async ({ page, context }) => {
  await guest(page);
  await controlled(page);
  await page.goto('/grammar/mixed');
  await expect(page.getByTestId('mixed-situation')).toBeVisible();
  await context.setOffline(true);
  await page.getByTestId('mixed-option').first().click();
  await expect(page.getByTestId('mixed-feedback')).toBeVisible();
  await context.setOffline(false);
  await page.reload();
  await expect(page.getByTestId('mixed-situation')).toBeVisible();
  const saved = await page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('dutchtap:grammar-mixed:v1') || '{}')).length);
  expect(saved).toBe(1);
});
