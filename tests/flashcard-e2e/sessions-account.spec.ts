import { test, expect, type Browser } from '@playwright/test';
import { FakeServer } from '../helpers/fakeServer';
import { asAccount, asGuest, createSession, rateSpeaking, savedGuestSessions, shownDutch, solveQuiz, switchMode } from './helpers';

const status = (page: import('@playwright/test').Page) => page.getByTestId('sync-status');

test.describe('account sessions (the real server logic, in memory)', () => {
  test('new sessions and progress are saved to the account and visible after a reload', async ({ page }) => {
    const server = new FakeServer();
    await asAccount(page, server);
    const id = await createSession(page, { count: 10, name: 'My account session' });
    await expect(status(page)).toContainText('Saved to your account');
    expect((await server.repo.get(server.owner, id))?.session.name).toBe('My account session');
    await switchMode(page, 'speaking');
    await rateSpeaking(page, 'Mastered');
    await expect(status(page)).toContainText('Saved to your account');
    const remote = (await server.repo.get(server.owner, id))!.session;
    expect(remote.events).toHaveLength(1);
    expect(server.reviews.rows.size).toBe(1); // exactly one global level was uploaded, not the whole deck
    await page.goto('/flashcards');
    await expect(page.getByTestId('session-card')).toContainText('My account session');
    await expect(page.getByTestId('card-speaking')).toHaveText('0 / 10');
  });

  test('progress made offline is kept, shown honestly as not synced, survives a refresh, and syncs exactly once on retry', async ({ page }) => {
    const server = new FakeServer();
    await asAccount(page, server);
    const id = await createSession(page, { count: 10 });
    await expect(status(page)).toContainText('Saved to your account');
    server.online = false;
    await switchMode(page, 'quiz');
    const english = await page.getByTestId('quiz-english').innerText();
    void english;
    await switchMode(page, 'speaking');
    await rateSpeaking(page, 'Mastered');
    await page.locator('[data-mode="study"]').click(); // trigger another change while offline
    await page.getByRole('button', { name: 'Retry sync' }).first().click();
    await expect(status(page)).toContainText('Not synced yet');
    await expect(status(page)).not.toContainText('Saved to your account');
    await page.reload();
    await switchMode(page, 'speaking');
    await expect(page.getByTestId('speaking-progress')).toBeVisible();
    await expect(status(page)).toContainText(/waiting to sync|Not synced yet/);
    expect((await server.repo.get(server.owner, id))!.session.events).toHaveLength(0);
    server.online = true;
    await page.getByRole('button', { name: 'Retry sync' }).click();
    await expect(status(page)).toContainText('Saved to your account');
    const remote = (await server.repo.get(server.owner, id))!.session;
    expect(remote.events).toHaveLength(1);
    expect(server.reviews.rows.size).toBe(1);
    await page.getByRole('button', { name: /Retry sync/ }).count();
    const seen = [...server.reviews.rows.values()][0];
    expect(seen.seen).toBe(1); // counted once
  });

  test('a quiz answer submitted offline is scored once when the connection returns', async ({ page }) => {
    const server = new FakeServer();
    await asAccount(page, server);
    const id = await createSession(page, { count: 'other', custom: '1' });
    await switchMode(page, 'study');
    const dutch = await shownDutch(page);
    await expect(status(page)).toContainText('Saved to your account');
    server.online = false;
    await switchMode(page, 'quiz');
    await solveQuiz(page, dutch);
    await page.getByRole('button', { name: 'Check', exact: true }).click();
    await expect(page.getByTestId('quiz-points')).toHaveText('10');
    server.online = true;
    await page.reload();
    await expect.poll(async () => (await server.repo.get(server.owner, id))!.session.quiz.points, { timeout: 15_000 }).toBe(10);
    await page.reload();
    await expect.poll(async () => (await server.repo.get(server.owner, id))!.session.quiz.points).toBe(10); // a reload never scores again
    await expect(page.getByTestId('quiz-points')).toHaveText('10');
  });

  test('account sessions never leak to a guest or another account on the same browser', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const serverA = new FakeServer('65f0000000000000000000a1'); const serverB = new FakeServer('65f0000000000000000000b2');
    const pageA = await context.newPage(); await asAccount(pageA, serverA, 'anna');
    await createSession(pageA, { count: 10, name: 'Anna only' });
    await expect(status(pageA)).toContainText('Saved to your account');
    const pageB = await context.newPage(); await asAccount(pageB, serverB, 'ben');
    await pageB.goto('/flashcards');
    await expect(pageB.getByTestId('empty')).toBeVisible();
    await expect(pageB.getByText('Anna only')).toHaveCount(0);
    const pageG = await context.newPage(); await asGuest(pageG);
    await pageG.goto('/flashcards');
    await expect(pageG.getByTestId('empty')).toBeVisible();
    await expect(pageG.getByText('Anna only')).toHaveCount(0);
    await context.close();
  });

  test('guest sessions can be imported on request, keeping their progress, and honour the five-active limit', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const guest = await context.newPage(); await asGuest(guest);
    await createSession(guest, { count: 10, name: 'Guest 1' });
    await guest.locator('[data-mode="speaking"]').click();
    await rateSpeaking(guest, 'Mastered'); // progress in the oldest session, which is the one that gets imported
    for (let i = 1; i < 3; i++) await createSession(guest, { count: 10, name: `Guest ${i + 1}` });
    expect(await savedGuestSessions(guest)).toHaveLength(3);

    const server = new FakeServer();
    const account = await context.newPage(); await asAccount(account, server, 'anna');
    for (let i = 0; i < 3; i++) await createSession(account, { count: 10, name: `Account ${i + 1}` });
    await account.goto('/flashcards');
    await expect(account.getByTestId('guest-import')).toContainText('You have 3 guest sessions on this device');
    await account.getByRole('button', { name: 'Import guest sessions' }).click();
    await expect(account.getByText(/2 sessions imported/)).toBeVisible();
    await expect(account.getByText(/1 kept on this device because you already have 5 active sessions/)).toBeVisible();
    await expect(account.getByRole('button', { name: /Active \(5\/5\)/ })).toBeVisible();
    await expect(account.getByTestId('guest-import')).toContainText('You have 1 guest session on this device'); // surplus kept, not discarded
    await expect.poll(async () => (await server.repo.list(server.owner)).length).toBe(5);
    const imported = (await server.repo.list(server.owner)).map(s => s.session).find(s => s.name === 'Guest 1')!;
    expect(imported.events).toHaveLength(1); // progress came with it
    await context.close();
  });

  test('two devices: progress in different modes merges, and a session deleted on one disappears from the other with a notice', async ({ browser }) => {
    const server = new FakeServer();
    const open = async (b: Browser) => { const context = await b.newContext({ viewport: { width: 390, height: 844 } }); const page = await context.newPage(); await asAccount(page, server, 'anna'); return { context, page }; };
    const phone = await open(browser); const laptop = await open(browser);
    const id = await createSession(phone.page, { count: 10, name: 'Shared session' });
    await expect(status(phone.page)).toContainText('Saved to your account');
    await laptop.page.goto(`/flashcards?session=${id}&mode=study`);
    await expect(laptop.page.getByTestId('session-name')).toHaveText('Shared session');
    // phone does Speaking, laptop does Study; both reach the server
    await phone.page.locator('[data-mode="speaking"]').click();
    await rateSpeaking(phone.page, 'Mastered');
    await laptop.page.locator('[data-mode="study"]').click();
    await laptop.page.getByRole('button', { name: 'Next sentence' }).click();
    await expect(status(phone.page)).toContainText('Saved to your account');
    await expect(status(laptop.page)).toContainText('Saved to your account');
    await expect.poll(async () => { const s = (await server.repo.get(server.owner, id))!.session; return `${s.events.length}:${s.study.pos}`; }).toBe('1:1');
    // delete on the phone
    await phone.page.goto('/flashcards');
    await phone.page.locator('[data-testid="session-card"]', { hasText: 'Shared session' }).getByRole('button', { name: 'Delete' }).click();
    await phone.page.getByRole('dialog').getByRole('button', { name: 'Delete session' }).click();
    await expect.poll(async () => (await server.repo.list(server.owner)).length).toBe(0);
    await laptop.page.getByRole('button', { name: 'Next sentence' }).click();
    await laptop.page.reload();
    await expect(laptop.page.getByTestId('session-missing')).toBeVisible();
    await phone.context.close(); await laptop.context.close();
  });

  test('the server refuses a sixth active session and the app keeps it on the device with a clear message', async ({ browser }) => {
    const server = new FakeServer();
    const open = async () => { const context = await browser.newContext({ viewport: { width: 390, height: 844 } }); const page = await context.newPage(); await asAccount(page, server, 'anna'); return { context, page }; };
    const one = await open(); const two = await open();
    for (let i = 0; i < 4; i++) await createSession(one.page, { count: 10, name: `Slot ${i + 1}` });
    await expect(status(one.page)).toContainText('Saved to your account');
    await two.page.goto('/flashcards');
    await expect(two.page.getByRole('button', { name: /Active \(4\/5\)/ })).toBeVisible();
    // device one takes the last slot; device two (still believing it has room) creates its own at the same time
    await createSession(one.page, { count: 10, name: 'Fifth from one' });
    await expect(status(one.page)).toContainText('Saved to your account');
    server.online = false;
    await createSession(two.page, { count: 10, name: 'Fifth from two' }); // created while "offline"
    server.online = true;
    await two.page.goto('/flashcards');
    await expect(two.page.getByText(/could not be added to your account because you already have 5 active sessions/)).toBeVisible({ timeout: 15_000 });
    await expect(two.page.getByTestId('session-card').filter({ hasText: 'Fifth from two' })).toContainText('Not synced');
    await expect(two.page.getByRole('button', { name: /Active \(5\/5 \+ 1 on this device only\)/ })).toBeVisible();
    expect((await server.repo.list(server.owner)).length).toBe(5);
    await one.context.close(); await two.context.close();
  });
});
