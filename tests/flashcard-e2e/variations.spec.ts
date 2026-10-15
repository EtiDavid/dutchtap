import { test, expect } from "@playwright/test";
import { createSessionFromIds } from "../../lib/sessions/engine";
import { variationsFor } from "../../lib/variations/content";
import {
  asGuest,
  guestSessionsKey,
  rateSpeaking,
  savedGuestSessions,
  switchMode,
  solveQuiz,
} from "./helpers";
import type { Session } from "../../lib/sessions/types";
const id = "variation-browser-session";
async function seed(page: import("@playwright/test").Page) {
  await asGuest(page);
  const s = createSessionFromIds({
    id,
    name: "Soup practice",
    cardIds: ["food-07"],
    topic: "all",
    startingLevel: "difficult",
  });
  await page.addInitScript(
    ([key, s]) => {
      if (!localStorage.getItem(key as string))
        localStorage.setItem(
          key as string,
          JSON.stringify({
            v: 1,
            sessions: { [s.id]: s },
            pendingCreate: [],
            initial: {},
            pendingActions: {},
            pendingDelete: [],
            refused: {},
            lastOpened: { id: s.id, mode: "study" },
          }),
        );
    },
    [guestSessionsKey, s] as [string, Session],
  );
  await page.goto(`/flashcards?session=${id}&mode=speaking`);
}
const read = async (page: import("@playwright/test").Page) =>
  (await savedGuestSessions(page))[0] as unknown as Session;
test("default rating, automatic gradual children, device audio and previous-card review survive a reload", async ({
  page,
}, testInfo) => {
  await seed(page);
  await page.getByRole("button", { name: "Check the Dutch" }).click();
  await expect(
    page.getByRole("button", { name: "Difficult", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("button", { name: "Next", exact: true }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  expect((await read(page)).cards["food-07"].spStreak).toBe(0);
  await rateSpeaking(page, "Mastered");
  await expect(
    page.getByRole("checkbox", {
      name: "Practise variations of this sentence",
    }),
  ).toBeChecked();
  // The reducer sees the newly enabled family and picks a child immediately in a one-parent session.
  expect((await read(page)).speaking.current!.cardId).toContain("~v");
  await expect(page.locator("article img")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Listen", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Check the Dutch" }).click();
  await expect(
    page.getByRole("button", { name: "Difficult", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByLabel("Ways to say it")).toBeVisible();
  const child = (await read(page)).speaking.current!.cardId;
  await page.getByRole("button", { name: "Easy", exact: true }).click();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  expect((await read(page)).childProgress[child].level).toBe("easy");
  expect((await read(page)).variations["food-07"].unlocked).toBe(3);
  const before = await read(page);
  await page.getByRole("button", { name: "Previous card" }).click();
  const dialog = page.getByRole("dialog", { name: "Previous card" });
  await expect(dialog).toContainText("no rating or points");
  await dialog.getByRole("button", { name: "Return to current card" }).click();
  expect((await read(page)).events).toEqual(before.events);
  await page.reload();
  expect((await read(page)).speaking.current).toEqual(before.speaking.current);
  expect((await read(page)).childProgress).toEqual(before.childProgress);
  await page
    .getByRole("checkbox", { name: "Practise variations of this sentence" })
    .uncheck();
  expect((await read(page)).childProgress[child].level).toBe("easy");
  expect((await read(page)).speaking.current!.cardId).toBe("food-07");
  await page
    .getByRole("checkbox", { name: "Practise variations of this sentence" })
    .check();
  expect((await read(page)).variations["food-07"].unlocked).toBe(3);
  // Quiz uses precisely the same enabled family and a situation prompt.
  await switchMode(page, "quiz");
  const quiz = await read(page),
    quizId = quiz.quiz.current!.cardId;
  const text =
    quizId === "food-07"
      ? "Ik probeerde een nieuw gerecht."
      : variationsFor("food-07").find((v) => v.id === quizId)!.text;
  await expect(page.getByTestId("quiz-situation")).toBeVisible();
  await solveQuiz(page, text);
  await page.getByRole("button", { name: "Check", exact: true }).click();
  await expect(page.getByTestId("quiz-points")).toHaveText("10");
  await page.reload();
  await expect(page.getByTestId("quiz-points")).toHaveText("10");
  const width = await page.evaluate(() => ({
    doc: document.documentElement.scrollWidth,
    view: innerWidth,
  }));
  expect(width.doc).toBeLessThanOrEqual(width.view);
  await page.screenshot({
    path: testInfo.outputPath("dutchtap-variation-mobile.png"),
    fullPage: true,
  });
});

test("a pictureless Dutch variation uses a Dutch device voice and makes no recording request", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const w = window as unknown as Record<string, unknown>;
    w.__spoken = [];
    class Utterance {
      text: string;
      voice: { name: string; lang: string } | null = null;
      lang = "";
      rate = 1;
      onend: (() => void) | null = null;
      constructor(text: string) {
        this.text = text;
      }
    }
    w.SpeechSynthesisUtterance = Utterance;
    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      value: {
        getVoices: () => [
          { name: "English voice", lang: "en-US" },
          { name: "Dutch voice", lang: "nl-BE" },
        ],
        speak: (u: Utterance) => {
          (w.__spoken as unknown[]).push({
            text: u.text,
            lang: u.lang,
            voice: u.voice?.name,
          });
          u.onend?.();
        },
        cancel: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
      },
    });
  });
  let recordings = 0;
  await page.route("**/audio/**", (route) => {
    recordings++;
    return route.abort();
  });
  await seed(page);
  await rateSpeaking(page, "Mastered");
  await page.getByRole("button", { name: "Check the Dutch" }).click();
  const child = (await read(page)).speaking.current!.cardId;
  expect(child).toContain("~v");
  await page.getByRole("button", { name: "Listen", exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as unknown as { __spoken: unknown[] }).__spoken.length,
      ),
    )
    .toBe(1);
  expect(
    await page.evaluate(
      () => (window as unknown as { __spoken: unknown[] }).__spoken,
    ),
  ).toEqual([
    {
      text: variationsFor("food-07").find((v) => v.id === child)!.text,
      lang: "nl-BE",
      voice: "Dutch voice",
    },
  ]);
  expect(recordings).toBe(0);
});
