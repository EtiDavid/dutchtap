// Reproducible, read-only audio inventory and coverage audit for DutchTap.
// Run: node scripts/audit-recorded-audio.mjs
// No network/API calls, no ElevenLabs credits, no mutation of learning progress.
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const load = (file) => JSON.parse(fs.readFileSync(path.join(root, "data", file), "utf8"));
const index = load("audio-index.json");
const everyday = [
  ...load("flashcards.json"),
  ...load("flashcard-additions.json"),
  ...load("flashcard-additions-2.json"),
];
const workplace = load("workplace-cards.json");
const grammarAuthored = load("grammar-pattern-cards.json");
const reuseLinks = load("grammar-reuse-links.json");
const grammarFamilies = Object.values(load("grammar-variation-families.json")).flat();
const lessons = Object.values(load("grammar-topic-lessons.json"));
const lessonExamples = lessons.flatMap((lesson) =>
  (lesson.sections || []).flatMap((section) => section.examples || []));
const cardsById = new Map([...everyday, ...workplace].map((card) => [card.id, card]));
const grammarAliases = reuseLinks.map((link) => {
  const card = cardsById.get(link.sourceId);
  if (!card) throw Error("Missing grammar reuse source: " + link.sourceId);
  return { ...card, id: "pat-" + link.topic + "-reuse-" + card.id, collection: "grammar", category: link.topic };
});
const errors = [];
const indexedText = new Map();
const seenPaths = new Set();
let verified = 0;
for (const [id, item] of Object.entries(index.items || {})) {
  if (item.lang !== "nl") errors.push("Non-Dutch indexed audio: " + id);
  const expected = createHash("sha256").update("nl\0" + item.text).digest("hex").slice(0, 24);
  if (id !== expected) errors.push("Text/ID mismatch: " + id);
  if (item.path !== "/audio/utterances/" + id + ".mp3") {
    errors.push("Invalid indexed path: " + id);
    continue;
  }
  if (seenPaths.has(item.path)) errors.push("Duplicated path: " + item.path);
  seenPaths.add(item.path);
  const key = item.lang + "\0" + item.text;
  if (indexedText.has(key)) errors.push("Duplicate indexed sentence: " + item.text);
  indexedText.set(key, item.path);
  const file = path.join(root, "public", item.path.slice(1));
  if (!fs.existsSync(file)) { errors.push("Missing MP3: " + id); continue; }
  const bytes = fs.readFileSync(file);
  if (!bytes.length) { errors.push("Empty MP3: " + id); continue; }
  const checksum = createHash("sha256").update(bytes).digest("hex");
  if (checksum !== item.checksum) { errors.push("Checksum mismatch: " + id); continue; }
  verified++;
}
const recorded = (text, audio) => {
  if (audio && typeof audio === "string" && audio.startsWith("/")) {
    const target = path.join(root, "public", audio.slice(1));
    if (fs.existsSync(target) && fs.statSync(target).size > 0) return true;
  }
  return indexedText.has("nl\0" + text);
};
const measure = (name, rows, getText, getAudio = () => "") => {
  const covered = rows.filter((item) => recorded(getText(item), getAudio(item))).length;
  return { name, total: rows.length, recorded: covered, deviceFallback: rows.length - covered,
    percentage: rows.length ? +(100 * covered / rows.length).toFixed(1) : 0 };
};
const groups = [
  measure("Everyday base cards", everyday, (x) => x.dutch, (x) => x.audio),
  measure("Dutch at Work base cards", workplace, (x) => x.dutch, (x) => x.audio),
  measure("Authored grammar base cards", grammarAuthored, (x) => x.dutch, (x) => x.audio),
  measure("Grammar aliases to core cards", grammarAliases, (x) => x.dutch, (x) => x.audio),
  measure("Authored grammar variation children", grammarFamilies, (x) => x.text),
  measure("Topic lesson examples", lessonExamples, (x) => x.nl),
];
const baseGroups = groups.slice(0, 4);
const baseTotal = baseGroups.reduce((n, item) => n + item.total, 0);
const baseRecorded = baseGroups.reduce((n, item) => n + item.recorded, 0);
console.log(JSON.stringify({
  indexed: Object.keys(index.items || {}).length,
  verified,
  missingOrInvalid: errors.length,
  baseCards: { total: baseTotal, recorded: baseRecorded,
    percentage: +(100 * baseRecorded / baseTotal).toFixed(1) },
  coverage: groups,
  notes: [
    "Base coverage counts each playable card or alias, even if two aliases share a recording.",
    "Grammar variation count includes the 100 authored children, not runtime-generated analysis contrasts.",
    "This is exact-text recorded-media coverage, not a browser playback or spoken-Dutch quality check.",
    "Vocabulary, verb drills and Learning Hub prompts are not included in the base-card denominator.",
  ],
  errors: errors.slice(0, 30),
}, null, 2));
if (errors.length) process.exitCode = 1;
