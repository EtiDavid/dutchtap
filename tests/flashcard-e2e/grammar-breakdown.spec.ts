import { test, expect } from '@playwright/test';
import { breakdownFor, patternOf } from '../../lib/grammarBreakdowns';
import { notesFor } from '../../lib/grammarNotes';
import { asGuest, createSession, rateSpeaking, shownDutch, switchMode, cardByDutch } from './helpers';

test.beforeEach(async ({ page }) => { await asGuest(page); });

test.describe('sentence breakdown', () => {
  test('the sentence page shows the full breakdown, expanded, with the short rule and examples kept', async ({ page }) => {
    await page.goto('/sentences/home-07');
    const b = breakdownFor('home-07')!;
    const note = notesFor('home-07')!;
    const region = page.getByTestId('breakdown');
    await expect(region).toBeVisible();
    await expect(region.getByText(b.meaning)).toBeVisible();
    await expect(page.getByTestId('breakdown-pattern')).toHaveText(`Pattern: ${patternOf(b)}`);
    for (const part of b.parts) await expect(region.getByRole('listitem').filter({ hasText: part.label }).filter({ hasText: part.text }).first()).toBeVisible();
    await expect(region.getByText(b.order)).toBeVisible();
    await expect(region.getByText(b.compare)).toBeVisible();
    await expect(region.getByText(b.mistake.why)).toBeVisible();
    await expect(region.getByText(b.mistake.wrong, { exact: true })).toBeVisible();
    await expect(region.getByText(b.mistake.right, { exact: true })).toBeVisible();
    // nothing was removed: the short rule and similar examples are still there
    await expect(page.getByText(note.rule, { exact: true })).toBeVisible();
    for (const example of note.examples) await expect(page.getByText(example.dutch, { exact: true })).toBeVisible();
  });

  test('it is hidden until the Dutch is revealed in Speaking, collapsible, and readable on a phone', async ({ page }) => {
    await createSession(page, { topic: 'shopping', count: 10 });
    await switchMode(page, 'speaking');
    await expect(page.getByTestId('breakdown')).toHaveCount(0);
    await page.getByRole('button', { name: 'Check the Dutch' }).click();
    const card = cardByDutch(await shownDutch(page));
    const notes = page.getByTestId('grammar-notes');
    await expect(notes.getByTestId('breakdown')).toBeHidden(); // collapsed by default: the main card stays short
    await notes.getByText('Grammar rule & similar examples').click();
    await expect(notes.getByTestId('breakdown')).toBeVisible();
    await expect(notes.getByText(breakdownFor(card.id)!.order)).toBeVisible();
    const { width, viewport } = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, viewport: innerWidth }));
    expect(width).toBeLessThanOrEqual(viewport);
    await notes.getByText('Grammar rule & similar examples').click();
    await expect(notes.getByTestId('breakdown')).toBeHidden();
    void rateSpeaking;
  });

  test('every part of the sentence appears in order as a labelled chip', async ({ page }) => {
    await page.goto('/sentences/school-09'); // a sentence with a subordinate clause
    const b = breakdownFor('school-09')!;
    const chips = page.getByTestId('breakdown').getByRole('list', { name: 'This sentence, part by part' }).getByRole('listitem');
    await expect(chips).toHaveCount(b.parts.length);
    expect(await chips.allInnerTexts()).toEqual(b.parts.map(part => `${part.label}\n${part.text}`));
    await expect(page.getByTestId('breakdown')).toContainText('After omdat the clause is subordinate');
  });
});
