import workplace from "@/data/workplace-communication.json";
import catalogue from "@/data/dutch-communication.json";
import corrections from "@/data/editorial/communication-corrections.json";
import type { Lang } from "@/lib/lang";
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
/** Exact authored text is the key. French and legacy records keep their single model. */
export function communicationFor(card: PracticeSentence): CommunicationTask {
  return card.lang === "nl" && tasks[card.text]
    ? tasks[card.text]
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
