// Structural inventory + honest editorial queue. Passing these checks is not a language certification.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { editorialCorpus, reviewMatches } from "./lib/editorial-corpus.mjs";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (name) =>
  JSON.parse(fs.readFileSync(path.join(root, "data", name), "utf8"));
const tasks = {
    ...read("dutch-communication.json"),
    ...read("workplace-communication.json"),
  },
  corrections = read("editorial/communication-corrections.json");
const main = [
  "flashcards.json",
  "flashcard-additions.json",
  "flashcard-additions-2.json",
  "workplace-cards.json",
].flatMap(read);
const corpus = editorialCorpus(root);
const ledgerPath = path.join(root, "data/editorial/review-progress.json");
const ledger = fs.existsSync(ledgerPath) ? JSON.parse(fs.readFileSync(ledgerPath, "utf8")) : {};
const inspections = Object.fromEntries(Object.entries(corpus).map(([scope, entries]) => [scope, {
  total: entries.length,
  reviewedCurrent: entries.filter((entry) => reviewMatches(ledger, scope, entry)).length,
  pendingOrChanged: entries.filter((entry) => !reviewMatches(ledger, scope, entry)).length,
}]));
const inspectedTasks = new Set(corpus.communication.filter((entry) => reviewMatches(ledger, "communication", entry)).map((entry) => entry.text));
const frequency = new Map();
for (const task of Object.values(tasks)) {
  const note = task.answers[0]?.explanation;
  frequency.set(note, (frequency.get(note) || 0) + 1);
}
const errors = [],
  queue = [];
for (const [text, task] of Object.entries(tasks)) {
  const patch = corrections[text],
    flags = [];
  if (!task.scenario || !task.answers?.length || task.answers[0].text !== text)
    errors.push(`Invalid communication task: ${text}`);
  if (!patch && (frequency.get(task.answers[0]?.explanation) || 0) >= 5)
    flags.push("repeated-explanation-needs-specific-review");
  if (!patch && /your group.*\byou are\b/i.test(task.scenario))
    flags.push("check-speaker-number");
  for (const answer of task.answers)
    if (!answer.text || !answer.english || !answer.explanation)
      errors.push(`Incomplete answer: ${text}`);
  queue.push({
    text,
    parentIds: main.filter((c) => c.dutch === text).map((c) => c.id),
    status: inspectedTasks.has(text) ? "inspected-current-content" : "pending-semantic-review",
    revised: Boolean(patch),
    flags,
  });
}
for (const card of main)
  if (!tasks[card.dutch]) errors.push(`Missing task: ${card.id}`);
const lessons = read("learning-tasks.json"),
  seen = new Set();
for (const lesson of lessons) {
  if (seen.has(lesson.id)) errors.push(`Repeated lesson ID ${lesson.id}`);
  seen.add(lesson.id);
  if (
    !lesson.promptNl ||
    !lesson.promptEnglish ||
    !lesson.answers.length ||
    !lesson.explanation
  )
    errors.push(`Incomplete lesson ${lesson.id}`);
}
const report = {
  version: 2,
  mainCards: main.length,
  distinctCommunicationTasks: queue.length,
  revisedTasks: queue.filter((x) => x.revised).length,
  pendingSemanticReview: queue.filter(
    (x) => x.status === "pending-semantic-review",
  ).length,
  newLessonTasks: lessons.length,
  independentNativeReview: false,
  inspections,
  reviewComplete: Object.values(inspections).every((scope) => scope.pendingOrChanged === 0),
  errors,
  queue,
};
const directory = path.join(root, "docs/learning");
fs.mkdirSync(directory, { recursive: true });
fs.writeFileSync(
  path.join(directory, "content-review-queue.json"),
  JSON.stringify(report, null, 2) + "\n",
);
console.log(JSON.stringify({ ...report, queue: undefined }, null, 2));
if (errors.length) process.exitCode = 1;
// A successful structural audit is not permission to merge an unfinished language review.
if (process.argv.includes("--require-complete") && !report.reviewComplete) {
  console.error("Editorial review remains incomplete or content has changed since inspection. Keep the PR in draft.");
  process.exitCode = 1;
}
