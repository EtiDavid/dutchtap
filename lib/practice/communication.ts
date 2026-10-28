import workplace from "@/data/workplace-communication.json";
import catalogue from "@/data/dutch-communication.json";
import corrections from "@/data/editorial/communication-corrections.json";
import alsExpansion from "@/data/editorial/grammar-als-expansion.json";
import type { Lang } from "@/lib/lang";
import { analysisFor } from "@/lib/grammarAnalysis";
import {
  sentenceTokens,
  tokenIndex,
  isTokenPermutation,
} from "@/lib/sessions/wordOrder";

export type ModelAnswer = {
  id: string;
  text: string;
  english: string;
  explanation: string;
};
export type CommunicationTask = { scenario: string; answers: ModelAnswer[] };
type EditorialCorrection = {
  scenario?: string;
  explanation?: string;
  english?: string;
  answers: ModelAnswer[];
};
export type PracticeSentence = {
  id?: string;
  text: string;
  english: string;
  scenario: string;
  lang: Lang;
};
const tasks: Record<string, CommunicationTask> = Object.fromEntries(
  Object.entries({ ...catalogue, ...workplace }).map(([text, task]) => [
    text,
    { ...task, answers: task.answers.map((answer) => ({ ...answer })) },
  ]),
);
// Keep every historic answer ID resolvable. Editorial patches replace metadata and
// append meaningful alternatives, never silently reassign a saved model's text.
for (const [text, patch] of Object.entries(corrections as Record<string, EditorialCorrection>)) {
  const task = tasks[text];
  if (!task) continue;
  if (patch.scenario) task.scenario = patch.scenario;
  if (patch.explanation)
    task.answers[0] = { ...task.answers[0], explanation: patch.explanation };
  if (patch.english)
    task.answers[0] = { ...task.answers[0], english: patch.english };
  for (const answer of patch.answers)
    if (!task.answers.some((a) => a.text === answer.text))
      task.answers.push(answer);
}
// Each contrast pair has two grammatical clause orders with the same situation.
 // The original “model” stays stable for any saved attempt, while a separately
 // identified alternative is recognised and may rotate into the word-order quiz.
 // This applies to new ALS exercises only and never changes old Core answers.
for (let i = 0; i < alsExpansion.length; i += 2) {
  const first = alsExpansion[i], second = alsExpansion[i + 1];
  if (!second || first.english !== second.english)
    throw new Error("Broken ALS answer pair " + i);
  for (const [primary, alternative] of [[first,second],[second,first]]) {
    tasks[primary.dutch] = {
      scenario: primary.scenario,
      answers: [
        {id:"model",text:primary.dutch,english:primary.english,explanation:primary.why},
        {id:"clause-order",text:alternative.dutch,english:alternative.english,
         explanation:"Both clauses convey the same situation. The subordinate verb placement remains; when the ALS clause comes first, the following main clause uses V2 inversion."}
      ]
    };
  }
}
const minorForm = (text: string) =>
  text
    .toLocaleLowerCase("nl")
    .replace(/[.,!?]/g, "")
    .split(/\s+/)
    .map(
      (w) =>
        ({
          zij: "ze",
          wij: "we",
          jij: "je",
          jouw: "je",
          jou: "je",
          mij: "me",
          kunt: "kan",
          kun: "kan",
          hebt: "heeft",
          houd: "hou",
          zul: "zal",
        })[w] ?? w,
    )
    .join(" ");
/** Pronoun/inflection variants remain valid but are teaching notes, not new quiz models. */
export function principalAnswers(task: CommunicationTask) {
  const seen = new Set<string>();
  return task.answers.filter((a) => {
    const key = minorForm(a.text);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
const normalEnglish = (value: string) =>
  value
    .toLocaleLowerCase("en")
    .replace(/[.,!?;:]/g, "")
    .replace(/\s+/g, " ")
    .trim();

/**
 * Exact authored text remains the primary key. For grammar cards, a sentence-specific
 * analysis may also provide a reviewed contrast with the same meaning. Expose that
 * as a legitimate model answer instead of teaching that only one Dutch word order
 * can ever be correct. Contrasts whose English meaning changes are deliberately not
 * accepted as alternatives.
 */
export function communicationFor(card: PracticeSentence): CommunicationTask {
  const base =
    card.lang === "nl" && tasks[card.text]
      ? {
          scenario: tasks[card.text].scenario,
          answers: tasks[card.text].answers.map((answer) => ({ ...answer })),
        }
      : {
          scenario: card.scenario,
          answers: [
            {
              id: "model",
              text: card.text,
              english: card.english,
              explanation: "",
            },
          ],
        };
  if (card.lang !== "nl" || !card.id) return base;
  const contrast = analysisFor(card.id)?.contrast;
  if (
    contrast &&
    contrast.dutch !== card.text &&
    normalEnglish(contrast.english) === normalEnglish(card.english) &&
    !base.answers.some((answer) => answer.text === contrast.dutch)
  )
    base.answers.push({
      id: "analysis-contrast",
      text: contrast.dutch,
      english: contrast.english,
      explanation: contrast.note,
    });
  return base;
}
export const scenarioFor = (text: string, fallback: string) =>
  tasks[text]?.scenario ?? fallback;
export const meaningFor = (text: string, fallback: string) =>
  tasks[text]?.answers[0]?.english ?? fallback;
export const modelFor = (card: PracticeSentence, id?: string) =>
  communicationFor(card).answers.find((a) => a.id === (id ?? "model"));
const normalize = (text: string, lang: Lang) =>
  sentenceTokens(text, lang).map((w) => w.toLocaleLowerCase(lang));
/** Complete token-instance validation first; duplicate words are compared by value. No arbitrary word-order guessing. */
export function matchAnswer(
  card: PracticeSentence,
  selected: ModelAnswer,
  order: readonly string[],
): ModelAnswer | undefined {
  if (!isTokenPermutation(selected.text, order, card.lang)) return undefined;
  const source = normalize(selected.text, card.lang);
  const actual = order.map((id) => source[tokenIndex(id)]);
  return communicationFor(card).answers.find((answer) => {
    const expected = normalize(answer.text, card.lang);
    return (
      expected.length === actual.length &&
      expected.every((word, i) => word === actual[i])
    );
  });
}
