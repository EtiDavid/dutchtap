// Display editorial packets; record an inspection only after a reviewer reads it.
import fs from "node:fs";
import path from "node:path";
import { editorialCorpus, fingerprint, repositoryRoot, reviewKey } from "./lib/editorial-corpus.mjs";

const args = process.argv.slice(2);
const value = (key, fallback) => { const at = args.indexOf(key); return at < 0 ? fallback : args[at + 1]; };
const scope = value("--scope", "communication");
const start = Number(value("--start", "0"));
const count = Number(value("--count", "25"));
const corpus = editorialCorpus();
const entries = corpus[scope];
if (!entries || !Number.isSafeInteger(start) || start < 0 || !Number.isSafeInteger(count) || count < 1 || start >= entries.length)
  throw new Error("Use a valid scope and nonnegative start, with a positive count.");
const packet = entries.slice(start, start + count);
if (args.includes("--record-reviewed")) {
  // Deliberately opt-in; normal audits/builds never approve language content.
  const ledgerPath = path.join(repositoryRoot, "data/editorial/review-progress.json");
  const ledger = JSON.parse(fs.readFileSync(ledgerPath, "utf8"));
  ledger.records ??= {};
  ledger.records[scope] ??= {};
  for (const entry of packet) ledger.records[scope][reviewKey(scope, entry)] = fingerprint(entry);
  if (scope === "grammar") {
    // A complete grammar inspection includes its examples. Already-read pairs
    // can be omitted from display, but new pairs must be read before recording.
    ledger.records.examples ??= {};
    const pairs = new Set(packet.flatMap((entry) => [...(entry.note?.examples ?? []), ...(entry.note?.originalExamples ?? [])].map((example) => JSON.stringify([example.dutch, example.english]))));
    for (const entry of corpus.examples)
      if (pairs.has(reviewKey("examples", entry))) ledger.records.examples[reviewKey("examples", entry)] = fingerprint(entry);
  }
  fs.writeFileSync(ledgerPath, JSON.stringify(ledger, null, 2) + "\n");
} else {
  const ledger = JSON.parse(fs.readFileSync(path.join(repositoryRoot, "data/editorial/review-progress.json"), "utf8"));
  const alreadyRead = (example) => {
    const entry = { nl: example.dutch, en: example.english };
    return ledger.records?.examples?.[reviewKey("examples", entry)] === fingerprint(entry);
  };
  for (const entry of packet) {
    if (scope === "grammar" && args.includes("--unread-examples") && entry.note) {
      const { examples = [], originalExamples = [], ...rest } = entry.note;
      const unread = [...examples, ...originalExamples].filter((example) => !alreadyRead(example));
      console.log(JSON.stringify({ ...entry, note: { ...rest, examples: unread, previouslyReadExamples: examples.length + originalExamples.length - unread.length } }));
    } else console.log(JSON.stringify(entry));
  }
}
console.log(JSON.stringify({ scope, start, end: Math.min(entries.length, start + count), total: entries.length, recorded: args.includes("--record-reviewed") }));
