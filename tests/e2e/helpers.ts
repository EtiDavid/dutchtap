import type { Page } from "@playwright/test";
import { NOUNS } from "../../data/nouns";
import { ADJECTIVES } from "../../data/adjectives";
import { getArticleAnswer } from "../../lib/grammar/article";
import { getDemonstrativeAnswer } from "../../lib/grammar/demonstrative";
import { getAdjectiveAnswer } from "../../lib/grammar/adjective";
import type { DeterminerType, Distance } from "../../lib/grammar/types";

export const nounIndex = new Map(NOUNS.map((n) => [n.id, n]));
export const nounBySingular = new Map(NOUNS.map((n) => [n.singular, n]));

const POSSESSIVES = ["mijn", "jouw", "zijn", "haar", "onze", "hun"];

async function answerButton(page: Page, text: string) {
  return page.locator("button", { hasText: new RegExp(`^${text}$`, "i") }).first();
}

/** Reads the current article question, clicks the objectively correct answer, waits for feedback. */
export async function answerArticleQuestionCorrectly(page: Page) {
  await page.waitForSelector("text=DE OF HET");
  const word = (await page.locator("p.text-4xl").first().textContent())?.trim() ?? "";
  const bySingular = nounBySingular.get(word);
  const isPlural = !bySingular;
  const noun = bySingular ?? [...NOUNS].find((n) => n.plural === word);
  if (!noun) throw new Error(`Unknown article word in UI: "${word}"`);

  const correct = getArticleAnswer(noun, isPlural);
  const button = await answerButton(page, correct);
  await button.click();
  await page.waitForTimeout(50);
  return { noun, isPlural, correct };
}

export async function answerArticleQuestionWrong(page: Page) {
  await page.waitForSelector("text=DE OF HET");
  const word = (await page.locator("p.text-4xl").first().textContent())?.trim() ?? "";
  const bySingular = nounBySingular.get(word);
  const isPlural = !bySingular;
  const noun = bySingular ?? [...NOUNS].find((n) => n.plural === word);
  if (!noun) throw new Error(`Unknown article word in UI: "${word}"`);

  const correct = getArticleAnswer(noun, isPlural);
  const wrong = correct === "de" ? "het" : "de";
  const button = await answerButton(page, wrong);
  await button.click();
  await page.waitForTimeout(50);
  return { noun, isPlural, correct, wrong };
}

export async function answerDemonstrativeQuestionCorrectly(page: Page) {
  await page.waitForSelector("text=DEZE · DIT · DIE · DAT");
  const word = (await page.locator("p.text-4xl").first().textContent())?.trim() ?? "";
  const distanceLabel = await page.getByText(/^(Near|Far)$/).first().textContent();
  const distance: Distance = distanceLabel?.toUpperCase().includes("NEAR") ? "near" : "far";

  const bySingular = nounBySingular.get(word);
  const isPlural = !bySingular;
  const noun = bySingular ?? [...NOUNS].find((n) => n.plural === word);
  if (!noun) throw new Error(`Unknown demonstrative word in UI: "${word}"`);

  const correct = getDemonstrativeAnswer(noun, distance, isPlural);
  const button = await answerButton(page, correct);
  await button.click();
  await page.waitForTimeout(50);
  return { noun, isPlural, distance, correct };
}

export async function answerAdjectiveQuestionCorrectly(page: Page) {
  await page.waitForSelector("text=ADJECTIVE ENDING");
  const promptText = (await page.locator("p.text-3xl").first().textContent())?.trim() ?? "";
  // "<determiner> ___ <noun>"
  const match = promptText.match(/^(\S+)\s+___\s+(.+)$/);
  if (!match) throw new Error(`Could not parse adjective prompt: "${promptText}"`);
  const [, determinerWord, nounWord] = match;

  const bySingular = nounBySingular.get(nounWord);
  const isPlural = !bySingular;
  const noun = bySingular ?? [...NOUNS].find((n) => n.plural === nounWord);
  if (!noun) throw new Error(`Unknown adjective-mode noun in UI: "${nounWord}"`);

  const optionTexts = (await page.locator('button[aria-pressed]').allTextContents()).map((t) => t.trim().toLowerCase());
  const adjective = ADJECTIVES.find(
    (a) => optionTexts.includes(a.base.toLowerCase()) && optionTexts.includes(a.eForm.toLowerCase()),
  );
  if (!adjective) throw new Error(`Could not match adjective options [${optionTexts.join(", ")}] to known adjective`);

  let determinerType: DeterminerType;
  if (isPlural) determinerType = "definite";
  else if (determinerWord === "een") determinerType = "indefinite";
  else if (determinerWord === "de" || determinerWord === "het") determinerType = "definite";
  else if (POSSESSIVES.includes(determinerWord)) determinerType = "possessive";
  else throw new Error(`Unrecognized determiner word: "${determinerWord}"`);

  const correct = getAdjectiveAnswer(noun, adjective, determinerType, isPlural);
  const button = await answerButton(page, correct);
  await button.click();
  await page.waitForTimeout(50);
  return { noun, adjective, determinerType, isPlural, correct };
}
