// Offline transcript export only. No credentials or paid API requests.
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (name) =>
  JSON.parse(fs.readFileSync(path.join(root, "data", name), "utf8"));
const sha = (value) => createHash("sha256").update(value).digest("hex");
export function audioId(text, lang = "nl") {
  return sha(`${lang}\0${text}`).slice(0, 24);
}
export function inventory() {
  const items = new Map();
  function add(text, role, approved = false, existingAudio = "", lang = "nl") {
    if (!text?.trim()) return;
    const id = audioId(text, lang),
      old = items.get(id);
    if (old) {
      old.roles = [...new Set([...old.roles, role])];
      old.approved ||= approved;
      old.existingAudio ||= existingAudio;
      return;
    }
    items.set(id, { id, lang, text, roles: [role], approved, existingAudio });
  }
  const corrections = read("editorial/communication-corrections.json");
  for (const file of [
    "flashcards.json",
    "flashcard-additions.json",
    "flashcard-additions-2.json",
    "workplace-cards.json",
  ])
    for (const card of read(file)) {
      add(
        card.dutch,
        `card:${card.id}`,
        !!corrections[card.dutch],
        card.audio || "",
      );
      add(card.variation, `card-example:${card.id}`);
    }
  for (const file of [
    "dutch-communication.json",
    "workplace-communication.json",
  ])
    for (const task of Object.values(read(file))) {
      add(task.scenario, "scenario", false, "", "en");
      for (const answer of task.answers) add(answer.text, "answer");
    }
  for (const [text, patch] of Object.entries(corrections)) {
    add(text, "reviewed-answer", true);
    add(patch.scenario, "reviewed-scenario", true, "", "en");
    for (const answer of patch.answers)
      add(answer.text, "reviewed-alternative", true);
  }
  for (const file of ["grammar-notes.json", "workplace-grammar-notes.json"])
    for (const note of Object.values(read(file)))
      for (const group of ["examples", "originalExamples"])
        for (const example of note[group] || [])
          add(example.dutch, "grammar-example");
  for (const task of read("learning-tasks.json")) {
    add(task.promptNl, `prompt:${task.id}`, true);
    add(task.promptEnglish, `prompt:${task.id}`, true, "", "en");
    for (const answer of task.answers) add(answer, `lesson:${task.id}`, true);
  }
  for (const file of ["vocabulary.json", "workplace-vocabulary.json"])
    for (const word of read(file)) {
      add(
        `${word.article ? word.article + " " : ""}${word.headword}`,
        `word:${word.id}`,
      );
      if (word.plural) add(word.plural, `plural:${word.id}`);
    }
  for (const word of read("learning-vocabulary.json").added)
    add(
      `${word.article ? word.article + " " : ""}${word.headword}`,
      `word:${word.id}`,
      true,
    );
  for (const verb of read("learning-verbs.json")) {
    add(verb.lemma, "verb", true);
    for (const [subject, form] of Object.entries(verb.present))
      add(`${subject} ${form}`, "verb-form", true);
    for (const [subject, form] of [
      ["ik", verb.past.singular],
      ["wij", verb.past.plural],
      ["ik", verb.perfect],
    ])
      add(`${subject} ${form}`, "verb-form", true);
  }
  // Explicit fields from the checked-in game banks; do not evaluate TypeScript.
  const nouns = fs.readFileSync(path.join(root, "data/nouns.ts"), "utf8");
  for (const match of nouns.matchAll(
    /\{ id: "([^"]+)", singular: "([^"]+)", article: "([^"]+)", plural: "([^"]+)"/g,
  )) {
    add(`${match[3]} ${match[2]}`, `game-noun:${match[1]}`, false, `/words/nouns/${match[1]}.mp3`);
    add(match[4], `game-plural:${match[1]}`);
    add(`de ${match[4]}`, `game-plural-with-article:${match[1]}`);
  }
  const adjectives = fs.readFileSync(
    path.join(root, "data/adjectives.ts"),
    "utf8",
  );
  for (const match of adjectives.matchAll(
    /\{ id: "([^"]+)", base: "([^"]+)", eForm: "([^"]+)"/g,
  )) {
    add(match[2], `game-adjective:${match[1]}`, false, `/words/adjectives/${match[1]}.mp3`);
    add(match[3], `game-adjective:${match[1]}`);
  }
  const installed = read("audio-index.json");
  for (const item of items.values()) {
    item.existingAudio = installed.items[item.id]?.path || item.existingAudio;
    if (
      item.existingAudio &&
      !fs.existsSync(path.join(root, "public", item.existingAudio))
    )
      item.existingAudio = "";
  }
  return [...items.values()];
}
export function batches(items, size = 50, maxCharacters = 8000) {
  if (!Number.isInteger(size) || size < 1 || size > 100)
    throw new Error("Batch size must be between 1 and 100.");
  const result = [];
  let batch = [],
    characters = 0;
  for (const item of items) {
    if (item.text.length > maxCharacters)
      throw new Error(`Utterance too long: ${item.id}`);
    if (
      batch.length &&
      (batch.length >= size || characters + item.text.length > maxCharacters)
    ) {
      result.push(batch);
      batch = [];
      characters = 0;
    }
    batch.push(item);
    characters += item.text.length;
  }
  if (batch.length) result.push(batch);
  return result;
}
const xml = (text) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const args = process.argv.slice(2),
    value = (flag, fallback) => {
      const i = args.indexOf(flag);
      return i < 0 ? fallback : args[i + 1];
    };
  const all = inventory(),
    approvedOnly = !args.includes("--include-unreviewed"),
    language = value("--language", "nl");
  if (!["nl", "en"].includes(language))
    throw new Error(
      "Use --language nl or en; keep voices/languages in separate batches.",
    );
  const selected = all.filter(
    (item) =>
      item.lang === language &&
      (!approvedOnly || item.approved) &&
      !item.existingAudio,
  );
  const grouped = batches(selected, Number(value("--size", "50"))),
    out = path.resolve(value("--out", path.join(root, "audio-export")));
  fs.mkdirSync(out, { recursive: true });
  const manifest = {
    version: 1,
    language,
    approvedOnly,
    pauseSeconds: 3,
    createdAt: new Date().toISOString(),
    inventory: all.length,
    existing: all.filter((x) => x.existingAudio).length,
    unreviewed: all.filter((x) => !x.approved).length,
    batches: grouped.map((items, i) => ({
      id: `${language}-batch-${String(i + 1).padStart(3, "0")}`,
      items,
    })),
  };
  fs.writeFileSync(
    path.join(out, "manifest.json"),
    JSON.stringify(manifest, null, 2) + "\n",
  );
  for (const batch of manifest.batches) {
    fs.writeFileSync(
      path.join(out, `${batch.id}.txt`),
      batch.items.map((x) => x.text).join("\n\n") + "\n",
    );
    fs.writeFileSync(
      path.join(out, `${batch.id}.ssml`),
      "<speak>\n" +
        batch.items.map((x) => xml(x.text)).join('\n<break time="3s" />\n') +
        "\n</speak>\n",
    );
  }
  fs.writeFileSync(
    path.join(out, "README.txt"),
    `Language: ${language}. Use a matching voice (Belgian Dutch for nl, English for en). Speak only the .txt sentences, in exact order. Do not speak IDs or filenames. Blank lines do NOT guarantee three seconds of silence. Use the SSML file ONLY if the selected provider/model explicitly supports its break tag; otherwise produce one clip per manifest item, or insert three-second gaps in an editor. Keep the unchanged manifest with the audio. Inspect the transcript before spending credits. Include-unreviewed exports are drafts, not approved for production. Run import-learning-audio.py without --apply to inspect boundaries first.\n`,
  );
  console.log(
    JSON.stringify(
      {
        directory: out,
        utterances: selected.length,
        batches: grouped.length,
        characters: selected.reduce((n, x) => n + x.text.length, 0),
        approvedOnly,
        unreviewedInventory: manifest.unreviewed,
      },
      null,
      2,
    ),
  );
}
