import { expect, test, type Page } from '@playwright/test';
import { GRAMMAR_CARDS } from '../../lib/flashcards/engine';
import { asAccount, asGuest, seedGuestLevels } from './helpers';
import { FakeServer } from '../helpers/fakeServer';

const idsOf = (topic: string) => GRAMMAR_CARDS.filter(c => c.category === topic).map(c => c.id);
const AXE = `${process.cwd()}/node_modules/axe-core/axe.min.js`;
async function axeViolations(page: Page) {
  await page.addScriptTag({ path: AXE });
  return page.evaluate(async () => {
    const axe = (window as unknown as { axe: { run: (c: Document, o: object) => Promise<{ violations: { id: string; nodes: { html: string }[] }[] }> } }).axe;
    const r = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] } });
    return r.violations.map(v => `${v.id}: ${v.nodes[0].html.slice(0, 100)}`);
  });
}

test('a new learner sees sentence counts and an honest note, not invented progress', async ({ page }) => {
  await asGuest(page);
  await page.goto('/flashcards');
  const total = idsOf('hoewel').length;
  await expect(page.getByTestId('pattern-tile-hoewel').getByTestId('tile-progress')).toHaveText(`${total} sentences`);
  await expect(page.getByTestId('pattern-tile-hoewel')).toHaveAttribute('aria-label', new RegExp(`${total} sentences, not started`));
  await expect(page.getByTestId('pattern-progress-note')).toContainText('not yet been reviewed by a native speaker');
});

test('ratings of pattern sentences show on their own tile only, on the dashboard and on Home', async ({ page }) => {
  await asGuest(page);
  const hoewel = idsOf('hoewel');
  await seedGuestLevels(page, { [hoewel[0]]: 'mastered', [hoewel[1]]: 'mastered', [hoewel[2]]: 'mastered', [hoewel[3]]: 'easy' });
  for (const path of ['/flashcards', '/']) {
    await page.goto(path);
    const tile = page.getByTestId('pattern-tile-hoewel');
    await expect(tile.getByTestId('tile-progress')).toHaveText(`3 of ${hoewel.length} mastered`);
    await expect(tile).toHaveAttribute('aria-label', new RegExp('4 practised, 3 mastered'));
    await expect(page.getByTestId('pattern-tile-connectors').getByTestId('tile-progress')).toHaveText(`${idsOf('connectors').length} sentences`);
  }
});

test('progress is axe-clean and does not scroll sideways at 320 px', async ({ page }) => {
  await asGuest(page);
  const ids = ['hoewel', 'connectors', 'exceptions', 'daar'].flatMap(t => idsOf(t).slice(0, 5));
  await seedGuestLevels(page, Object.fromEntries(ids.map((id, i) => [id, i % 2 ? 'mastered' : 'medium'])));
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/flashcards'); await page.waitForLoadState('networkidle');
  await expect(page.getByTestId('pattern-tile-daar').getByTestId('tile-progress')).toContainText('mastered');
  expect(await axeViolations(page)).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
  await page.goto('/'); await page.waitForLoadState('networkidle');
  await expect(page.getByTestId('pattern-tile-daar').getByTestId('tile-progress')).toContainText('mastered');
  expect(await axeViolations(page), 'Home').toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
});

test('an Everyday sentence rated Mastered does not count towards its grammar alias', async ({ page }) => {
  await asGuest(page);
  const alias = GRAMMAR_CARDS.find(c => c.originCardId && c.category === 'indirect')!;
  await seedGuestLevels(page, { [alias.originCardId!]: 'mastered' });
  await page.goto('/flashcards');
  await expect(page.getByTestId('pattern-tile-indirect').getByTestId('tile-progress')).toHaveText(`${idsOf('indirect').length} sentences`);
});

test('signed-in progress comes from the account levels', async ({ page }) => {
  const server = new FakeServer();
  const levels = await asAccount(page, server);
  const ids = idsOf('hoewel');
  levels.set(ids[0], { id: ids[0], level: 'mastered', masteredCount: 1, seen: 1, quizCorrect: 0, quizWrong: 0, quizStreak: 0, updatedAt: '2026-10-27T10:00:00.000Z' });
  await page.goto('/flashcards');
  await expect(page.getByTestId('pattern-tile-hoewel').getByTestId('tile-progress')).toHaveText(`1 of ${ids.length} mastered`);
});
