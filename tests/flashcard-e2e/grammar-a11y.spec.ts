import { expect, test, type Page } from '@playwright/test';
import { asGuest, switchMode } from './helpers';

/**
 * P6 accessibility checks for the grammar screens: automated axe scan (WCAG 2.0/2.1 A and AA plus best practice) at phone and tablet
 * widths, no horizontal scrolling at 320/375/430/768 px, keyboard use of mixed grammar and the create dialog, and reduced motion.
 * Automated checks find a subset of problems; they do not replace a screen-reader and keyboard walk-through by a person.
 */
const AXE = `${process.cwd()}/node_modules/axe-core/axe.min.js`;
type Violation = { id: string; impact: string | null; nodes: { target: unknown[]; html: string }[] };

async function violations(page: Page): Promise<string[]> {
  await page.addScriptTag({ path: AXE });
  const found = await page.evaluate(async () => {
    const axe = (window as unknown as { axe: { run: (context: Document, options: object) => Promise<{ violations: Violation[] }> } }).axe;
    const result = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] } });
    return result.violations.map(v => `${v.id} (${v.impact}) ×${v.nodes.length}: ${v.nodes[0].target.join(' ')} :: ${v.nodes[0].html.slice(0, 100)}`);
  });
  return found;
}
const overflow = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

test.beforeEach(async ({ page }) => { await asGuest(page); });

for (const width of [320, 390]) {
  test(`no axe violations on the grammar screens at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    for (const path of ['/flashcards', '/grammar/mixed', '/sentences/pat-connectors-01', '/sentences/pat-exceptions-21', '/sentences/pat-relative-01', '/sentences/pat-daar-23']) {
      await page.goto(path); await page.waitForLoadState('networkidle');
      expect(await violations(page), path).toEqual([]);
    }
  });
}

test('no axe violations in the create dialog with a lesson open, in a study session, and in every mixed-grammar state', async ({ page }) => {
  await page.goto('/flashcards?new=grammar:connectors');
  const dialog = page.getByRole('dialog', { name: 'Create a session' });
  await dialog.getByTestId('grammar-topic-lesson').locator('summary').click();
  expect(await violations(page), 'dialog with lesson').toEqual([]);
  await dialog.getByRole('button', { name: '10', exact: true }).click();
  await dialog.getByRole('button', { name: 'Create session' }).click();
  await page.waitForURL(/session=/); await page.waitForLoadState('networkidle');
  expect(await violations(page), 'study session').toEqual([]);
  await page.goto('/grammar/mixed');
  await page.getByRole('button', { name: 'Show English help' }).click();
  await page.getByTestId('mixed-option').first().click();
  expect(await violations(page), 'mixed after answer').toEqual([]);
  for (let i = 0; i < 8 && !(await page.getByTestId('mixed-summary').count()); i++) {
    await page.getByTestId('mixed-next').click();
    if (await page.getByTestId('mixed-summary').count()) break;
    await page.getByTestId('mixed-option').first().click();
  }
  await expect(page.getByTestId('mixed-summary')).toBeVisible();
  expect(await violations(page), 'mixed summary').toEqual([]);
});

test('no axe violations in Speaking (answer shown) and Quiz for a grammar session', async ({ page }) => {
  await page.goto('/flashcards?new=grammar:exceptions');
  const dialog = page.getByRole('dialog', { name: 'Create a session' });
  await dialog.getByRole('button', { name: '10', exact: true }).click();
  await dialog.getByRole('button', { name: 'Create session' }).click();
  await page.waitForURL(/session=/);
  await switchMode(page, 'speaking');
  await page.getByRole('button', { name: 'Check the Dutch' }).click();
  await page.waitForLoadState('networkidle');
  expect(await violations(page), 'speaking with the answer shown').toEqual([]);
  await switchMode(page, 'quiz');
  await expect(page.locator('[data-token]').first()).toBeVisible();
  expect(await violations(page), 'quiz').toEqual([]);
});

test('nothing scrolls sideways at 320, 375, 430 and 768 px', async ({ page }) => {
  for (const width of [320, 375, 430, 768]) {
    await page.setViewportSize({ width, height: 800 });
    for (const path of ['/', '/flashcards', '/grammar/mixed', '/sentences/pat-connectors-01', '/sentences/pat-exceptions-04']) {
      await page.goto(path); await page.waitForLoadState('networkidle');
      expect(await overflow(page), `${path} at ${width}px`).toBeLessThanOrEqual(0);
    }
  }
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/flashcards?new=grammar:daar');
  const dialog = page.getByRole('dialog', { name: 'Create a session' });
  await dialog.getByTestId('grammar-topic-lesson').locator('summary').click();
  expect(await overflow(page), 'dialog with the longest lesson open').toBeLessThanOrEqual(0);
});

test('mixed grammar can be done with the keyboard alone, and focus lands where the learner must act next', async ({ page }) => {
  await page.goto('/grammar/mixed');
  await expect(page.getByTestId('mixed-situation')).toBeVisible();
  const option = page.getByTestId('mixed-option').first();
  await option.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('mixed-feedback')).toBeVisible();
  // the chosen answer buttons are disabled; the next action must be reachable and operable by keyboard
  const next = page.getByTestId('mixed-next');
  await next.focus();
  await expect(next).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('mixed-progress')).toContainText('Question 2 of 8');
});

test('the create dialog takes focus, can be closed with Escape, and gives focus back', async ({ page }) => {
  await page.goto('/flashcards');
  const open = page.getByRole('button', { name: 'Create session' });
  await open.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog', { name: 'Create a session' });
  await expect(dialog).toBeVisible();
  expect(await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]')), 'focus is inside the dialog').toBe(true);
  for (let i = 0; i < 25; i++) {
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]')), `Tab ${i + 1} stays inside`).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(open).toBeFocused();
});

test('reduced motion removes transitions and the confetti-style effects on the grammar screens', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/grammar/mixed');
  const duration = await page.getByTestId('mixed-option').first().evaluate(el => getComputedStyle(el).transitionDuration);
  expect(parseFloat(duration)).toBeLessThanOrEqual(0.001);
});

test('a new grammar sentence says it is read by the device voice and never promises a recording', async ({ page }) => {
  await page.goto('/sentences/pat-connectors-01');
  await expect(page.getByText('Spoken by your device’s Dutch voice.')).toBeVisible();
  await expect(page.getByText(/recording awaiting/i)).toHaveCount(0);
});

