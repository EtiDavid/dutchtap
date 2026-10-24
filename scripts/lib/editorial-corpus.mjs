import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

export const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const fingerprint = (entry) => {
  const { index: _index, ...content } = entry;
  return crypto.createHash("sha256").update(JSON.stringify(content)).digest("hex");
};

/** Review the actual displayed content, including overlays. Indexes are only packet positions. */
export function editorialCorpus(root = repositoryRoot) {
  const read = (name) => JSON.parse(fs.readFileSync(path.join(root, "data", `${name}.json`), "utf8"));
  const tasks = { ...read("dutch-communication"), ...read("workplace-communication") };
  const patches = read("editorial/communication-corrections");
  const cards = ["flashcards", "flashcard-additions", "flashcard-additions-2", "workplace-cards"].flatMap(read);
  const notes = { ...read("grammar-notes"), ...read("workplace-grammar-notes") };
  const breakdowns = { ...read("grammar-breakdowns"), ...read("workplace-breakdowns") };
  const parents = new Map();
  for (const card of cards) parents.set(card.dutch, [...(parents.get(card.dutch) ?? []), card.id]);
  const communication = Object.entries(tasks).map(([text, task], index) => {
    const patch = patches[text];
    const answers = task.answers.map((answer, i) => i === 0 ? {
      ...answer,
      ...(patch?.explanation ? { explanation: patch.explanation } : {}),
      ...(patch?.english ? { english: patch.english } : {}),
    } : answer);
    for (const answer of patch?.answers ?? [])
      if (!answers.some((existing) => existing.text === answer.text)) answers.push(answer);
    return { index, text, parentIds: parents.get(text) ?? [], scenario: patch?.scenario || task.scenario, answers };
  });
  const grammar = cards.map((card, index) => ({ index, id: card.id, nl: card.dutch, en: patches[card.dutch]?.english ?? card.english, breakdown: breakdowns[card.id], note: notes[card.id] }));
  const pairs = new Map();
  for (const note of Object.values(notes))
    for (const example of [...(note.examples ?? []), ...(note.originalExamples ?? [])])
      pairs.set(JSON.stringify([example.dutch, example.english]), { nl: example.dutch, en: example.english });
  const examples = [...pairs.values()].map((item, index) => ({ index, ...item }));
  return { communication, grammar, examples };
}

export const reviewKey = (scope, entry) => scope === "communication" ? entry.text : scope === "grammar" ? entry.id : JSON.stringify([entry.nl, entry.en]);
export const reviewMatches = (ledger, scope, entry) => ledger.records?.[scope]?.[reviewKey(scope, entry)] === fingerprint(entry);
