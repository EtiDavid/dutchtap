import { test, expect } from "@playwright/test";
import { LEARNING_TASKS } from "../../lib/learning/content";
import { asGuest } from "./helpers";
import {
  answerArticleQuestionCorrectly,
  answerArticleQuestionWrong,
  clickContinue,
} from "../e2e/helpers";

const runtimeErrors = new WeakMap<import('@playwright/test').Page,string[]>();
test.beforeEach(async ({page}) => {
  const errors: string[]=[];runtimeErrors.set(page,errors);
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if(message.type()==='error' && !/Failed to load resource: the server responded with a status of (401|404)/.test(message.text())) errors.push(message.text()); });
});
test.afterEach(async ({page}) => {
  await expect(page).toHaveTitle('DutchTap');
  expect(runtimeErrors.get(page)).toEqual([]);
});

test("home exposes the new labs, a tile quiz survives refresh, and correct feedback does not replay", async ({
  page,
}, info) => {
  await asGuest(page);
  await page.goto("/");
  await page.getByRole("link", { name: /Sentence Builder/ }).click();
  await expect(
    page.getByRole("heading", { name: "Think, build, speak" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Quiz · build it" }).click();
  const card = page.getByTestId("learning-task");
  const id = await card.getAttribute("data-task-id");
  const task = LEARNING_TASKS.find((t) => t.id === id)!;
  const words = task.answers[0].split(/\s+/);
  // Each token is an independent button, including repeated words.
  const pool = page.locator('[aria-label="Word tiles"]');
  await pool
    .getByRole("button", { name: words[0], exact: true })
    .first()
    .click();
  await page.reload();
  await expect(card).toHaveAttribute("data-task-id", id!);
  await page.getByRole("button", { name: "Quiz · build it" }).click();
  await expect(card).toHaveAttribute("data-task-id", id!);
  await expect(page.locator('[aria-label="Your sentence"]')).toContainText(
    words[0],
  );
  for (const word of words.slice(1))
    await pool.getByRole("button", { name: word, exact: true }).first().click();
  await page.getByRole("button", { name: "Check answer", exact: true }).click();
  await expect(page.getByText("Correct — well done!")).toBeVisible();
  await expect(page.locator(".quiz-confetti")).toHaveCount(1);
  await page.getByRole("button", { name: "Next situation →" }).click();
  await page.getByRole("button", { name: "← Previous" }).click();
  await expect(card).toContainText("read only");
  await expect(
    page.getByRole("button", { name: "Check answer", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Return to current exercise" })
    .click();
  await expect(card).not.toContainText("read only");
  await page.screenshot({
    path: info.outputPath("learning-mobile.png"),
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("practice uses an optional transcript and English help, with independent self-rated recall", async ({
  page,
}) => {
  await asGuest(page);
  await page.goto("/learn?topic=als");
  await page.getByLabel("Prompt support").selectOption("listen");
  await expect(page.getByText("Show Dutch situation")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Listen to Dutch situation" }),
  ).toBeVisible();
  await page.getByText("English help", { exact: true }).click();
  await page
    .getByRole("button", { name: "Check the Dutch", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Listen to answer", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "I recalled it with help" }).click();
  await expect(
    page.getByText("Practised with help", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("Practised with help", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText(/0 quiz matches/)).toBeVisible();
});

test("verb and tense filters retain the exact typed draft and reference forms", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await asGuest(page);
  await page.goto("/learn?topic=separable");
  await page.getByLabel("Verb", { exact: true }).selectOption("opsturen");
  await page.getByLabel("Time / tense").selectOption("perfect");
  await page.getByRole("button", { name: "Quiz · build it" }).click();
  await page.getByLabel("Answer with").selectOption("typing");
  await page
    .getByLabel("Your Dutch sentence")
    .fill("Ik heb het verslag opgestuurd.");
  await page.getByRole("button", { name: "Check answer", exact: true }).click();
  await expect(page.getByText("Correct — well done!")).toBeVisible();
  await page.getByText("Verb forms & separable particles").click();
  await expect(
    page.getByText("Perfect: ik heb opgestuurd", { exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: info.outputPath("verb-desktop.png"),
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("reduced motion disables confetti and sound preference persists", async ({
  page,
}) => {
  await asGuest(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/learn?topic=separable");
  await page.getByText("Quiz sound & celebration").click();
  await page.getByRole("button", { name: "Sound: on" }).click();
  await page.getByLabel("Verb", { exact: true }).selectOption("opsturen");
  await page.getByLabel("Time / tense").selectOption("perfect");
  await page.getByRole("button", { name: "Quiz · build it" }).click();
  await page.getByLabel("Answer with").selectOption("typing");
  await page
    .getByLabel("Your Dutch sentence")
    .fill("Ik heb het verslag opgestuurd.");
  await page.getByRole("button", { name: "Check answer", exact: true }).click();
  await expect(page.getByText("Correct — well done!")).toBeVisible();
  await expect(page.locator(".quiz-confetti")).toHaveCount(0);
  await page.reload();
  await page.getByText("Quiz sound & celebration").click();
  await expect(page.getByRole("button", { name: "Sound: off" })).toBeVisible();
});

test("de/het celebrates a new correct answer but not a wrong answer or a restored result", async ({
  page,
}) => {
  await asGuest(page);
  await page.goto("/game/article");
  await answerArticleQuestionCorrectly(page);
  await expect(page.locator(".quiz-confetti")).toHaveCount(1);
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Continue", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".quiz-confetti")).toHaveCount(0);
  await clickContinue(page);
  await answerArticleQuestionWrong(page);
  await expect(page.locator(".quiz-confetti")).toHaveCount(0);
});
