import { expect, type Page } from "@playwright/test";
import {
  CARDS,
  newReview,
  rateLevel,
  type Level,
  type Review,
} from "../../lib/flashcards/engine";
import { deckCard } from "../../lib/sessions/engine";
import { modelFor } from "../../lib/practice/communication";
import type { Session } from "../../lib/sessions/types";
import { sentenceTokens } from "../../lib/sessions/wordOrder";
import { FakeServer } from "../helpers/fakeServer";

export const GUEST_LEVELS_KEY = "dutchtap:flashcards:v2:guest";
export const guestSessionsKey = "dutchtap:sessions:v1:guest";

export const asGuest = (page: Page) =>
  page.route("**/api/auth/me", (route) =>
    route.fulfill({ status: 401, json: { error: "Not signed in" } }),
  );

/** Signs in as `username` and serves the session and level endpoints from the REAL server logic (in memory, never Atlas). */
export async function asAccount(
  page: Page,
  server: FakeServer,
  username = "anna",
) {
  const levelsByLang: Record<string, Map<string, Review>> = { nl: new Map() };
  const levels = levelsByLang.nl;
  await page.route("**/api/auth/me", (route) =>
    route.fulfill({
      json: { username, lifetimeScore: 0, totalCorrect: 0, totalWrong: 0 },
    }),
  );
  await page.route("**/api/flashcards**", async (route) => {
    const lang =
      new URL(route.request().url()).searchParams.get("lang") ??
      (route.request().method() === "POST"
        ? route.request().postDataJSON().lang
        : null) ??
      "nl";
    const store = (levelsByLang[lang] ??= new Map<string, Review>());
    if (route.request().method() === "POST") {
      for (const record of route.request().postDataJSON().records)
        store.set(record.id, record);
      await route.fulfill({ json: { ok: true } });
    } else
      await route.fulfill({ json: { reviews: Object.fromEntries(store) } });
  });
  await page.route("**/api/learning-sessions**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    try {
      const response = await server.fetch(url.pathname, {
        method: request.method(),
        body: request.postData() ?? undefined,
      });
      await route.fulfill({
        status: response.status,
        contentType: "application/json",
        body: await response.text(),
      });
    } catch {
      await route.abort("failed");
    }
  });
  return levels;
}

/** Seeds the guest's global card levels before the page loads. */
export async function seedGuestLevels(
  page: Page,
  levels: Record<string, Level>,
) {
  const reviews = Object.fromEntries(
    Object.entries(levels).map(([id, level]) => [
      id,
      rateLevel(
        id,
        newReview(id, new Date("2026-10-01T00:00:00Z")),
        level,
        new Date("2026-10-01T00:00:00Z"),
      ),
    ]),
  );
  await page.addInitScript(
    ([key, value]) => {
      if (!localStorage.getItem(key)) localStorage.setItem(key, value);
    },
    [GUEST_LEVELS_KEY, JSON.stringify(reviews)] as [string, string],
  );
}

export const cardByDutch = (dutch: string) =>
  CARDS.find((c) => c.dutch === dutch)!;
export const shownDutch = (page: Page) =>
  page.locator('article p[lang="nl"]').first().innerText();

/** Opens the create dialog and creates a session. */
export async function createSession(
  page: Page,
  options: {
    topic?: string;
    count?: number | "other";
    custom?: string;
    level?: string;
    name?: string;
  } = {},
) {
  await page.goto("/flashcards");
  await page.getByRole("button", { name: "Create session" }).click();
  const dialog = page.getByRole("dialog", { name: "Create a session" });
  if (options.topic)
    await dialog.getByLabel("Place (topic)").selectOption(options.topic);
  const presets = [10, 20, 30, 50];
  const count =
    typeof options.count === "number" && !presets.includes(options.count)
      ? "other"
      : options.count;
  const custom =
    options.custom ??
    (typeof options.count === "number" ? String(options.count) : "1");
  if (count === "other") {
    await dialog.getByRole("button", { name: "Other" }).click();
    await dialog.getByLabel(/Number of cards/).fill(custom);
  } else if (count)
    await dialog
      .getByRole("button", { name: String(count), exact: true })
      .click();
  if (options.level)
    await dialog
      .getByRole("radio", { name: new RegExp(options.level, "i") })
      .click();
  if (options.name) await dialog.getByLabel("Session name").fill(options.name);
  await dialog.getByRole("button", { name: "Create session" }).click();
  await page.waitForURL(/session=/);
  await expect(page.getByTestId("session-name")).toBeVisible();
  return new URL(page.url()).searchParams.get("session")!;
}

export const switchMode = async (page: Page, mode: "study" | "speaking" | "quiz") => {
  const tab = page.locator(`[data-mode="${mode}"]`);
  await tab.click();
  // The URL change reaches useSearchParams asynchronously, so wait until the mode has really switched.
  await expect(tab).toHaveAttribute("aria-current", "page");
};

/** Reads the saved guest sessions straight from the device. */
export const savedGuestSessions = (page: Page) =>
  page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key) || '{"sessions":{}}');
    return Object.values(state.sessions) as {
      id: string;
      cardIds: string[];
      name: string;
      status: string;
      quiz: { points: number };
      study: { order: string[]; pos: number; round: number };
      cards: Record<
        string,
        {
          spStreak: number;
          spDone: boolean;
          qStreak: number;
          qDone: boolean;
          spAttempts: number;
          qCorrect: number;
          qWrong: number;
        }
      >;
      events: unknown[];
    }[];
  }, guestSessionsKey);

/** Resolve the saved round, rather than assuming the original model is this round's answer. */
export async function currentQuizModel(page: Page) {
  await expect(page.locator("article")).toBeVisible();
  const data = await page.evaluate(() => {
    const id = new URL(location.href).searchParams.get("session");
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)!;
      if (!key.startsWith("dutchtap:sessions:v1:")) continue;
      const s = JSON.parse(localStorage.getItem(key) ?? "{}").sessions?.[id!];
      if (s?.quiz?.current) return s as Session;
    }
    return null;
  });
  if (!data?.quiz.current) throw new Error("No persisted quiz attempt");
  const card = deckCard(data.lang, data.quiz.current.cardId)!;
  const model = modelFor(card, data.quiz.current.answerId)!;
  return {
    id: card.id,
    category: card.category,
    dutch: model.text,
    english: model.english,
    scenario: card.scenario,
    lang: card.lang,
  };
}

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/** Taps the words of `dutch` into the right order. */
export async function solveQuiz(
  page: Page,
  dutch: string,
  lang: "nl" | "fr" = "nl",
  exact = false,
) {
  if (lang === "nl" && !exact) dutch = (await currentQuizModel(page)).dutch;
  for (const word of sentenceTokens(dutch, lang))
    await page
      .locator("[data-token]:not([disabled])", {
        hasText: new RegExp(`^${escape(word)}$`),
      })
      .first()
      .click();
}
/** Taps the words in a reversed order, which is wrong unless the sentence is a palindrome of words. */
export async function solveQuizWrong(page: Page, dutch: string) {
  dutch = (await currentQuizModel(page)).dutch;
  for (const word of [...sentenceTokens(dutch)].reverse())
    await page
      .locator("[data-token]:not([disabled])", {
        hasText: new RegExp(`^${escape(word)}$`),
      })
      .first()
      .click();
}
export async function rateSpeaking(
  page: Page,
  level: "Difficult" | "Medium" | "Easy" | "Mastered",
) {
  await page.getByRole("button", { name: "Check the Dutch" }).click();
  await page.getByRole("button", { name: level, exact: true }).click();
  await page.getByRole("button", { name: "Next", exact: true }).click();
}
