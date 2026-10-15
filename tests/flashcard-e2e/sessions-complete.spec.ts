import { test, expect } from "@playwright/test";
import {
  asGuest,
  createSession,
  GUEST_LEVELS_KEY,
  rateSpeaking,
  savedGuestSessions,
  shownDutch,
  solveQuiz,
  switchMode,
} from "./helpers";

test.beforeEach(async ({ page }) => {
  await asGuest(page);
});

test("a session finishes only when BOTH Speaking and Quiz are complete, is archived, frees its slot, and can be practised again", async ({
  page,
}) => {
  test.setTimeout(120_000);
  // four other sessions fill the active slots, so freeing one is observable
  for (let i = 0; i < 4; i++)
    await createSession(page, { count: 10, name: `Filler ${i + 1}` });
  const id = await createSession(page, {
    count: "other",
    custom: "1",
    name: "Tiny set",
  });
  const dutch = await shownDutch(page);
  await page
    .getByRole("checkbox", { name: "Practise variations of this sentence" })
    .check();
  await page
    .getByRole("checkbox", { name: "Practise variations of this sentence" })
    .uncheck();
  await page.goto("/flashcards");
  await expect(
    page.getByRole("button", { name: "Create session" }),
  ).toBeDisabled();
  await page.goto(`/flashcards?session=${id}&mode=speaking`);

  // Study alone never completes a session
  await switchMode(page, "study");
  for (let i = 0; i < 3; i++)
    await page.getByRole("button", { name: "Next sentence" }).click();
  expect(
    (await savedGuestSessions(page)).find((s) => s.id === id)!.status,
  ).toBe("active");

  // Speaking: nine recalls are not enough, the tenth retires the card
  await switchMode(page, "speaking");
  for (let n = 1; n <= 9; n++) await rateSpeaking(page, "Mastered");
  await expect(page.getByTestId("recall-progress")).toHaveText(
    "9 / 10 consecutive recalls",
  );
  await rateSpeaking(page, "Mastered");
  await expect(page.getByTestId("speaking-complete")).toContainText(
    "Speaking completed",
  );
  await expect(page.getByTestId("completion-summary")).toHaveCount(0); // the Quiz is not done yet
  expect(
    (await savedGuestSessions(page)).find((s) => s.id === id),
  ).toMatchObject({ status: "active" });
  await expect(page.locator('[data-mode="speaking"]')).toContainText("✓");
  await page.reload();
  await expect(page.getByTestId("speaking-complete")).toBeVisible(); // refresh must not reopen or recount

  // Quiz: ten correct answers in a row
  await switchMode(page, "quiz");
  for (let n = 1; n <= 10; n++) {
    await solveQuiz(page, dutch);
    await page.getByRole("button", { name: "Check", exact: true }).click();
    await expect(page.getByTestId("correct-progress")).toHaveText(
      `${n} / 10 correct in a row`,
    );
    if (n < 10) await page.getByRole("button", { name: "Continue" }).click();
  }
  await expect(page.getByTestId("completion-summary")).toContainText(
    "Session completed",
  );
  await expect(page.getByTestId("completion-summary")).toContainText(
    "100 points",
  );
  await page.getByRole("button", { name: "Continue" }).click(); // dismiss the last feedback
  await expect(page.getByTestId("quiz-complete")).toContainText(
    "Quiz completed",
  );

  // archived, history kept, slot freed
  let session = (await savedGuestSessions(page)).find((s) => s.id === id)!;
  expect(session.status).toBe("archived");
  expect(session.quiz.points).toBe(100);
  expect(Object.values(session.cards)[0]).toMatchObject({
    spStreak: 10,
    spDone: true,
    qStreak: 10,
    qDone: true,
  });
  await page.goto("/flashcards");
  await expect(
    page.getByRole("button", { name: /Active \(4\/5\)/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Create session" }),
  ).toBeEnabled();
  await page.getByRole("button", { name: /Completed \(1\)/ }).click();
  await expect(page.getByTestId("session-card")).toContainText("Tiny set");
  await expect(page.getByTestId("session-card")).toContainText("Completed");

  // reopening never restarts anything; Study still works
  await page.goto(`/flashcards?session=${id}&mode=study`);
  await expect(page.getByTestId("completion-summary")).toBeVisible();
  await page.getByRole("button", { name: "Next sentence" }).click();
  session = (await savedGuestSessions(page)).find((s) => s.id === id)!;
  expect(session).toMatchObject({ status: "archived" });
  expect(Object.values(session.cards)[0]).toMatchObject({
    spStreak: 10,
    qStreak: 10,
  });

  // practise again: a NEW session with the same sentence and fresh counters; global levels untouched
  const levels = await page.evaluate(
    (k) => localStorage.getItem(k),
    GUEST_LEVELS_KEY,
  );
  await page.getByRole("button", { name: "Practise this set again" }).click();
  await page.waitForURL((url) => url.searchParams.get("session") !== id);
  const sessions = await savedGuestSessions(page);
  const again = sessions.find(
    (s) => s.id !== id && s.name.startsWith("Again:"),
  )!;
  expect(again.cardIds).toEqual(session.cardIds);
  expect(Object.values(again.cards)[0]).toMatchObject({
    spStreak: 0,
    qStreak: 0,
    spDone: false,
    qDone: false,
  });
  expect(again.status).toBe("active");
  expect(sessions.find((s) => s.id === id)!.status).toBe("archived");
  expect(
    await page.evaluate((k) => localStorage.getItem(k), GUEST_LEVELS_KEY),
  ).toBe(levels);
  expect(await shownDutch(page)).toBe(dutch);
});

test('"Practise this set again" respects the five-active limit', async ({
  page,
}) => {
  test.setTimeout(120_000);
  const id = await createSession(page, {
    count: "other",
    custom: "1",
    name: "Finish me",
  });
  const dutch = await shownDutch(page);
  await page
    .getByRole("checkbox", { name: "Practise variations of this sentence" })
    .check();
  await page
    .getByRole("checkbox", { name: "Practise variations of this sentence" })
    .uncheck();
  await switchMode(page, "speaking");
  for (let n = 0; n < 10; n++) await rateSpeaking(page, "Mastered");
  await switchMode(page, "quiz");
  for (let n = 1; n <= 10; n++) {
    await solveQuiz(page, dutch);
    await page.getByRole("button", { name: "Check", exact: true }).click();
    if (n < 10) await page.getByRole("button", { name: "Continue" }).click();
  }
  expect(
    (await savedGuestSessions(page)).find((s) => s.id === id)!.status,
  ).toBe("archived");
  for (let i = 0; i < 5; i++)
    await createSession(page, { count: 10, name: `Active ${i + 1}` });
  await page.goto(`/flashcards?session=${id}&mode=study`);
  await expect(
    page.getByRole("button", { name: "Practise this set again" }),
  ).toBeDisabled();
  await expect(page.getByTestId("completion-summary")).toContainText(
    "already have 5 active sessions",
  );
});
