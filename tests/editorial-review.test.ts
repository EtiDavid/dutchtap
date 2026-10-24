import { describe, expect, it } from "vitest";
import { editorialCorpus, fingerprint, reviewKey, reviewMatches } from "../scripts/lib/editorial-corpus.mjs";
import { cardFor } from "@/lib/content/cards";
import { communicationFor, principalAnswers } from "@/lib/practice/communication";
import { breakdownFor } from "@/lib/grammarBreakdowns";
import { notesFor } from "@/lib/grammarNotes";
import { protectedEditorialDigest } from "./helpers/editorialPreservation";

describe("editorial review integrity", () => {
  it("allows explanation fixes while detecting changes to historic saved models and related examples", () => {
    const path = "data/dutch-communication.json";
    const task = { scenario: "Before", answers: [{ id: "model", text: "Ik werk.", english: "I work.", explanation: "Before" }] };
    const original = protectedEditorialDigest(path, { "Ik werk.": task });
    expect(protectedEditorialDigest(path, { "Ik werk.": { ...task, scenario: "Corrected", answers: [{ ...task.answers[0], explanation: "Corrected" }] } })).toBe(original);
    for (const changed of [{ id: "different" }, { text: "Ik werkte." }, { english: "I worked." }])
      expect(protectedEditorialDigest(path, { "Ik werk.": { ...task, answers: [{ ...task.answers[0], ...changed }] } })).not.toBe(original);
    const note = { rule: "Before", examples: [{ dutch: "Ik werk.", english: "I work." }] };
    const notesPath = "data/grammar-notes.json";
    expect(protectedEditorialDigest(notesPath, { card: { ...note, rule: "Corrected" } })).toBe(protectedEditorialDigest(notesPath, { card: note }));
    expect(protectedEditorialDigest(notesPath, { card: { ...note, examples: [] } })).not.toBe(protectedEditorialDigest(notesPath, { card: note }));
  });
  it("invalidates an inspection after scenario, alternative or grammar changes, without depending on list order", () => {
    const corpus = editorialCorpus();
    for (const scope of ["communication", "grammar", "examples"] as const) {
      const entry = corpus[scope][0];
      const ledger = { records: { [scope]: { [reviewKey(scope, entry)]: fingerprint(entry) } } };
      expect(reviewMatches(ledger, scope, { ...entry, index: 999 })).toBe(true);
      expect(reviewMatches(ledger, scope, { ...entry, changed: "uninspected material" })).toBe(false);
      expect(reviewMatches({ records: {} }, scope, entry)).toBe(false);
    }
    const task = corpus.communication[0];
    const ledger = { records: { communication: { [task.text]: fingerprint(task) } } };
    expect(reviewMatches(ledger, "communication", { ...task, scenario: "Different intention" })).toBe(false);
    expect(reviewMatches(ledger, "communication", { ...task, answers: [...task.answers, { id: "extra", text: "Another model" }] })).toBe(false);
  });

  it("audits exactly the runtime communication inventory, including editorial overlays", () => {
    for (const entry of editorialCorpus().communication) {
      const runtime = communicationFor({ text: entry.text, english: "", scenario: "", lang: "nl" });
      expect(runtime.scenario).toBe(entry.scenario);
      expect(runtime.answers).toEqual(entry.answers);
    }
  });
});

describe("specific Dutch teaching corrections", () => {
  it("distinguishes finding a solution, resolving a conflict and finishing an activity", () => {
    const solution = communicationFor(cardFor("nl", "work-327")!);
    expect(solution.scenario).toMatch(/without claiming that it has already been implemented/);
    const manager = communicationFor(cardFor("nl", "work-223")!);
    expect(manager.scenario).toMatch(/manager's involvement/);
    expect(manager.answers[0].explanation).toMatch(/does not specify.*alone/);
    expect(breakdownFor("work-05")?.practiceGuide).toMatch(/being busy does not mean being finished/);
    expect(breakdownFor("work-03")?.forms).toMatch(/not a rule that every singular past ends in -de/);
    expect(breakdownFor("conversation-16")?.mistake.alternative).toBe(true);
    const uncertain = communicationFor(cardFor("nl", "work-165")!);
    expect(principalAnswers(uncertain).map((a) => a.text)).toContain("Dat weet ik niet zeker.");
  });
  it("does not teach the inversion rule backwards or remove a stem-final t", () => {
    for (const entry of editorialCorpus().communication)
      for (const answer of entry.answers) expect(answer.explanation).not.toMatch(/drops after je/);
    expect(breakdownFor("conversation-63")?.forms).toMatch(/stem-final t is retained/);
    expect(breakdownFor("conversation-63")?.forms).not.toMatch(/The -t drops/);
  });
  it("distinguishes a subject question from inversion with a separate subject", () => {
    expect(breakdownFor("conversation-56")?.order).toMatch(/Wie is itself the subject/);
    expect(breakdownFor("conversation-56")?.order).not.toMatch(/question word \+ finite verb \+ subject/);
    expect(breakdownFor("food-11")?.order).toMatch(/complete subject is de zak met eten/);
  });
  it("keeps the reference and meaning precise", () => {
    expect(cardFor("nl", "shopping-10")?.scenario).toMatch(/de tas/);
    expect(cardFor("nl", "transport-07")?.english).toBe("My train is delayed by ten minutes.");
    expect(breakdownFor("transport-10")?.order).toMatch(/naturally follows helpen/);
  });
  it("offers a different structure for the same busy writing situation", () => {
    const task = communicationFor(cardFor("nl", "work-09")!);
    expect(principalAnswers(task).map((answer) => answer.text)).toContain("Ze is druk een e-mail aan het schrijven.");
    expect(notesFor("work-09")?.rule).toMatch(/activity noun takes het/);
  });
  it("explains iets nieuws and the replacement infinitive, preserving ten related examples", () => {
    expect(notesFor("school-17")?.rule).toMatch(/not a plural ending/);
    expect(notesFor("food-15")?.rule).toMatch(/replacement infinitive/);
    for (const id of ["school-17", "food-15", "work-09", "transport-10"])
      expect(notesFor(id)?.examples.length).toBeGreaterThanOrEqual(10);
  });
  it("does not label auxiliaries or adjectives as finite main verbs", () => {
    for (const entry of editorialCorpus().communication)
      for (const answer of entry.answers) expect(answer.explanation).not.toMatch(/finite main verb\/adjective|is a finite main verb/);
  });
});
