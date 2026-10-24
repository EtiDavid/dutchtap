import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (name) =>
  JSON.parse(fs.readFileSync(path.join(root, "data", name), "utf8"));
const base = [...read("vocabulary.json"), ...read("workplace-vocabulary.json")];
const cards = [
  "flashcards.json",
  "flashcard-additions.json",
  "flashcard-additions-2.json",
  "workplace-cards.json",
].flatMap(read);
const lessons = read("learning-tasks.json");
const verbs = read("learning-verbs.json");
const norm = (text) =>
  text
    .toLocaleLowerCase("nl")
    .replace(/[^\p{L}\p{N}\s'-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
function contains(text, form) {
  const words = norm(text).split(" "),
    pieces = norm(form).split(" ");
  if (pieces.length === 1) return words.includes(pieces[0]);
  // Reviewed separable forms are finite + particle, potentially separated by objects.
  const start = words.indexOf(pieces[0]);
  return (
    start >= 0 &&
    pieces.slice(1).every((piece) => words.indexOf(piece, start + 1) >= 0)
  );
}
const added = [],
  updates = [];
for (const verb of verbs) {
  const found = base.find((entry) => norm(entry.headword) === norm(verb.lemma));
  const forms = [
    verb.lemma,
    ...Object.values(verb.present),
    ...Object.values(verb.past),
    verb.perfect.split(" ").at(-1),
  ];
  const occurrences = cards.flatMap((card) => {
    const form = forms.find((form) => contains(card.dutch, form));
    return form ? [{ cardId: card.id, form: form.replaceAll(" ", " … ") }] : [];
  });
  const lessonIds = lessons
    .filter(
      (task) =>
        task.verb === verb.lemma ||
        task.answers.some((answer) =>
          forms.some((form) => contains(answer, form)),
        ),
    )
    .map((task) => task.id);
  const details = `${verb.note} Present: ik ${verb.present.ik}, hij ${verb.present.hij}, wij ${verb.present.wij}. Past: ${verb.past.singular} / ${verb.past.plural}. Perfect: ik ${verb.perfect}.`;
  if (found) updates.push({ id: found.id, occurrences, lessonIds, details });
  else
    added.push({
      id: `lab-${verb.lemma}`,
      headword: verb.lemma,
      english: verb.english,
      explanation: `${verb.lemma}: ${verb.english}.`,
      type: "verb",
      article: "",
      plural: "",
      details,
      occurrences,
      lessonIds,
    });
}
// Additional headwords only where they actually occur in reviewed lesson answers.
for (const [headword, english, article, plural, explanation] of [
  [
    "aanvraag",
    "application / request",
    "de",
    "aanvragen",
    "Een officieel verzoek om iets te krijgen.",
  ],
  [
    "inschrijving",
    "registration / enrolment",
    "de",
    "inschrijvingen",
    "Het vastleggen van je deelname of registratie.",
  ],
  [
    "wachtkamer",
    "waiting room",
    "de",
    "wachtkamers",
    "Een ruimte waar je wacht tot je aan de beurt bent.",
  ],
  [
    "optie",
    "option",
    "de",
    "opties",
    "Een mogelijkheid waaruit je kunt kiezen.",
  ],
  [
    "gerecht",
    "dish",
    "het",
    "gerechten",
    "Een bereide maaltijd of een onderdeel daarvan.",
  ],
  [
    "vakantie",
    "holiday",
    "de",
    "vakanties",
    "Een periode waarin je vrij bent van werk of school.",
  ],
  [
    "verbinding",
    "connection",
    "de",
    "verbindingen",
    "Een koppeling tussen bijvoorbeeld twee computers.",
  ],
  [
    "foutmelding",
    "error message",
    "de",
    "foutmeldingen",
    "Een bericht dat aangeeft dat er iets misgaat.",
  ],
  [
    "opleiding",
    "study programme / training",
    "de",
    "opleidingen",
    "Onderwijs waarmee je kennis en vaardigheden opbouwt.",
  ],
  [
    "opdracht",
    "assignment / task",
    "de",
    "opdrachten",
    "Werk dat je moet uitvoeren.",
  ],
]) {
  const forms = [headword, plural],
    found = base.find((e) => norm(e.headword) === headword);
  const occurrences = cards.flatMap((c) => {
    const form = forms.find((f) => contains(c.dutch, f));
    return form ? [{ cardId: c.id, form }] : [];
  });
  const lessonIds = lessons
    .filter((t) => t.answers.some((a) => forms.some((f) => contains(a, f))))
    .map((t) => t.id);
  if (!occurrences.length && !lessonIds.length) continue;
  if (found)
    updates.push({
      id: found.id,
      occurrences,
      lessonIds,
      details: found.details,
    });
  else
    added.push({
      id: `lab-${headword}`,
      headword,
      english,
      article,
      plural,
      type: "noun",
      explanation,
      details: "",
      occurrences,
      lessonIds,
    });
}
const output = JSON.stringify({ added, updates }, null, 2) + "\n",
  dest = path.join(root, "data/learning-vocabulary.json");
if (process.argv.includes("--check")) {
  if (fs.readFileSync(dest, "utf8") !== output)
    throw new Error(
      "Learning vocabulary is stale; run npm run content:learning-words.",
    );
} else fs.writeFileSync(dest, output);
console.log(
  `${added.length} new entries; ${updates.length} existing headwords enriched; no duplicate headwords added.`,
);
