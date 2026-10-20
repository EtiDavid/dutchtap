import workplace from "@/data/workplace-communication.json";
import catalogue from "@/data/dutch-communication.json";
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
export type PracticeSentence = {
  text: string;
  english: string;
  scenario: string;
  lang: Lang;
};
const tasks = { ...catalogue, ...workplace } as Record<string, CommunicationTask>;
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
