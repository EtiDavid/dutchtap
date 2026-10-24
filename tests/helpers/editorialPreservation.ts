import { createHash } from "node:crypto";

const sorted = <T>(entries: [string, T][]) => entries.sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0);
const digest = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");

/** The review may correct teaching metadata, but cannot silently change a saved
 * answer's text/ID/meaning, a recorded sentence or the ten related examples.
 * Newly authored raw models require an explicit addition ID in the fixture.
 */
export function protectedEditorialDigest(path: string, content: unknown, additions: string[] = []) {
  const entries = sorted(Object.entries(content as Record<string, unknown>));
  if (path === "data/dutch-communication.json") return digest(entries.map(([text, value]) => {
    const task = value as { answers: { id: string; text: string; english: string }[] };
    return [text, sorted(task.answers.filter((a) => !additions.includes(a.id)).map((a) => [a.id, { text: a.text, english: a.english }]))];
  }));
  if (path === "data/grammar-notes.json") return digest(entries.map(([id, value]) => {
    const note = value as { examples: unknown; originalExamples?: unknown };
    return [id, note.examples, note.originalExamples ?? null];
  }));
  if (path === "data/grammar-breakdowns.json") return digest(entries.map(([id, value]) => [id, (value as { mistake: { right: string } }).mistake.right]));
  throw new Error(`No editorial preservation contract for ${path}`);
}
