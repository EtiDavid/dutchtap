import { test, expect, type Page } from "@playwright/test";
import {
  createSessionFromIds,
  applyAction,
  quizModel,
} from "../../lib/sessions/engine";
import { communicationFor, modelFor } from "../../lib/practice/communication";
import { cardFor } from "../../lib/content/cards";
import { variationsFor } from "../../lib/variations/content";
import audioIndex from "../../data/audio-index.json";
import type { Session, ActionInput } from "../../lib/sessions/types";
import {
  asGuest,
  guestSessionsKey,
  currentQuizModel,
  solveQuiz,
  switchMode,
} from "./helpers";

const sessionId = "communication-browser-session";
let n = 0;
function action(s: Session, input: ActionInput) {
  const r = applyAction(s, {
    id: `action-browser-${++n}`,
    at: new Date().toISOString(),
    ...input,
  });
  if (!r.applied) throw new Error(r.reason);
  return r.session;
}
function fresh(parent = "food-07") {
  return createSessionFromIds({
    id: sessionId,
    name: "Meaning and natural Dutch",
    cardIds: [parent],
    topic: "all",
    startingLevel: "difficult",
  });
}
async function seed(page: Page, s: Session, mode = "quiz") {
  await asGuest(page);
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
            lastOpened: { id: s.id, mode: "quiz" },
          }),
        );
    },
    [guestSessionsKey, s] as [string, Session],
  );
  await page.goto(`/flashcards?session=${s.id}&mode=${mode}`);
}
async function saved(page: Page): Promise<Session> {
  return page.evaluate(
    (key) =>
      JSON.parse(localStorage.getItem(key)!).sessions[
        "communication-browser-session"
      ],
    guestSessionsKey,
  );
}

test("one situation cycles through every model, restores its draft, and shows the exact matching explanation and previous answer", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await seed(page, fresh());
  const expected = communicationFor(cardFor("nl", "food-07")!);
  const seen: string[] = [];
  for (let round = 0; round < expected.answers.length; round++) {
    await expect(page.getByTestId("quiz-situation")).toContainText(
      "tried a new dish",
    );
    await expect(page.getByTestId("quiz-situation")).not.toContainText(
      "unfamiliar",
    );
    await expect(page.getByTestId("quiz-english")).toHaveCount(0);
    const model = await currentQuizModel(page),
      cur = (await saved(page)).quiz.current!;
    seen.push(cur.answerId!);
    const explanation = modelFor(
      cardFor("nl", "food-07")!,
      cur.answerId,
    )!.explanation;
    if (round === 0) {
      await page.locator("[data-token]").first().click();
      const before = await saved(page);
      await page.reload();
      await expect(page.locator("[data-token]").first()).toBeVisible();
      expect((await saved(page)).quiz.current).toEqual(before.quiz.current);
      await page.getByRole("button", { name: "Clear", exact: true }).click();
    }
    await solveQuiz(page, model.dutch);
    await page.getByRole("button", { name: "Check", exact: true }).click();
    await expect(page.getByTestId("quiz-model-answer")).toHaveText(model.dutch);
    await expect(page.getByTestId("answer-explanation")).toHaveText(
      explanation,
    );
    await expect(page.getByTestId("quiz-points")).toHaveText(
      String((round + 1) * 10),
    );
    await page.getByTestId("other-models").locator("summary").click();
    await expect(
      page.getByTestId("other-models").getByRole("listitem"),
    ).toHaveCount(expected.answers.length - 1);
    if (round === 1)
      await page.screenshot({
        path: testInfo.outputPath("dutchtap-situation-mobile.png"),
        fullPage: true,
      });
    await page.getByRole("button", { name: "Continue", exact: true }).click();
  }
  expect(new Set(seen).size).toBe(expected.answers.length);
  expect((await saved(page)).quiz.current!.answerId).not.toBe(seen.at(-1));
  const before = await saved(page);
  await page
    .getByRole("button", { name: "Previous card", exact: false })
    .click();
  const dialog = page.getByRole("dialog", { name: "Previous card" });
  await expect(dialog.getByTestId("answer-explanation")).toHaveText(
    modelFor(cardFor("nl", "food-07")!, seen.at(-1))!.explanation,
  );
  await dialog.getByRole("button", { name: "Return to current card" }).click();
  expect((await saved(page)).events).toEqual(before.events);
  expect(errors).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("a child gives a precise instruction scenario, meaningful alternatives, pronoun notes and ten related examples", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  const child = variationsFor("work-150").find(
    (v) => v.text === "Verkoop je oude auto aan Zoë.",
  )!;
  let s = fresh("work-150");
  s = action(s, {
    type: "variations/toggle",
    parentId: "work-150",
    enabled: true,
  });
  s = action(s, {
    type: "speaking/open",
    cardId: child.id,
    attemptId: "child-speaking-attempt",
  });
  s = action(s, {
    type: "quiz/open",
    cardId: child.id,
    attemptId: "child-quiz-attempt",
    tokenOrder: ["t0"],
    rotateAnswers: true,
  });
  await seed(page, s, "speaking");
  await expect(
    page.getByText(/Your friend owns an old car/),
  ).toBeVisible();
  await expect(page.locator("article img")).toHaveCount(0);
  await page.getByRole("button", { name: "Check the Dutch" }).click();
  await page.getByTestId("other-models").locator("summary").click();
  await expect(page.getByTestId("other-models")).toContainText(
    "Verkoop Zoë je oude auto.",
  );
  await page.getByText('Pronoun & form notes', { exact:true }).click();
  await expect(page.getByText('Verkoop jouw oude auto aan Zoë.', { exact:true })).toBeVisible();
  await page.getByTestId("family-examples").locator("summary").click();
  await expect(
    page.getByTestId("family-examples").getByRole("listitem"),
  ).toHaveCount(10);
  await page.screenshot({
    path: testInfo.outputPath("dutchtap-child-desktop.png"),
    fullPage: true,
  });
  await switchMode(page, "quiz");
  await expect(page.getByTestId("quiz-situation")).toContainText(
    "direct instruction",
  );
  await expect(page.getByTestId("quiz-english")).toHaveCount(0);
  await solveQuiz(page, child.text);
  await page.getByRole("button", { name: "Check", exact: true }).click();
  await expect(page.getByTestId("quiz-points")).toHaveText("10");
});

test("a recorded alternative requests its own Flemish MP3, then falls back to Dutch speech if playback fails", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const w = window as unknown as Record<string, unknown>;
    w.__spoken = [];
    class U {
      text: string;
      voice: { name: string } | null = null;
      lang = "";
      rate = 1;
      onend: (() => void) | null = null;
      constructor(text: string) {
        this.text = text;
      }
    }
    w.SpeechSynthesisUtterance = U;
    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      value: {
        getVoices: () => [
          { name: "English", lang: "en-US" },
          { name: "Dutch", lang: "nl-BE" },
        ],
        speak: (u: U) => {
          (w.__spoken as unknown[]).push({ text: u.text, lang: u.lang });
          setTimeout(() => u.onend?.(), 5);
        },
        cancel: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
      },
    });
  });
  let selected: Session | undefined;
  for (let i = 0; i < 30; i++) {
    const s = action(fresh(), {
      type: "quiz/open",
      cardId: "food-07",
      attemptId: `perfect-voice-attempt-${i}`,
      tokenOrder: ["t0"],
      rotateAnswers: true,
    });
    if (quizModel(s)!.text === "Ik heb een nieuw gerecht geprobeerd.") {
      selected = s;
      break;
    }
  }
  expect(selected).toBeDefined();
  const expectedRecording = Object.values(audioIndex.items).find(
    (item) => item.lang === "nl" && item.text === "Ik heb een nieuw gerecht geprobeerd.",
  )?.path;
  expect(expectedRecording).toBeTruthy();
  const requestedPaths: string[] = [];
  // Deliberately fail the indexed MP3: playback must first request the correct alternative,
  // never the original card audio, and then recover using a Dutch device voice.
  await page.route("**/audio/**", (route) => {
    requestedPaths.push(new URL(route.request().url()).pathname);
    return route.abort();
  });
  await seed(page, selected!);
  await solveQuiz(page, "Ik heb een nieuw gerecht geprobeerd.");
  await page.getByRole("button", { name: "Check", exact: true }).click();
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
  ).toEqual([{ text: "Ik heb een nieuw gerecht geprobeerd.", lang: "nl-BE" }]);
  await expect.poll(() => requestedPaths.length).toBe(1);
  expect(requestedPaths).toEqual([expectedRecording]);
});
