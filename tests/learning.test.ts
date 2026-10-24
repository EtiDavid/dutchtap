import { describe, expect, it } from "vitest";
import {
  LEARNING_TASKS,
  LEARNING_VERBS,
  LEARNING_TOPICS,
  acceptsAnswer,
} from "@/lib/learning/content";
import {
  emptyLabState,
  openLabAttempt,
  finishLabAttempt,
  nextLabAttempt,
  parseLabState,
  labKey,
} from "@/lib/learning/progress";
import {
  communicationFor,
  principalAnswers,
  modelFor,
} from "@/lib/practice/communication";
import { VOCABULARY, vocabularyLessons } from "@/lib/vocabulary";
import { pickVoice } from "@/lib/speech/voices";
import baseWords from "@/data/vocabulary.json";
import workWords from "@/data/workplace-vocabulary.json";

describe("Dutch practice labs", () => {
  it("publishes complete contextual lessons and reviewed verb forms without duplicate IDs", () => {
    expect(LEARNING_TASKS).toHaveLength(110);
    expect(new Set(LEARNING_TASKS.map((t) => t.id)).size).toBe(
      LEARNING_TASKS.length,
    );
    for (const task of LEARNING_TASKS) {
      expect(LEARNING_TOPICS.some((t) => t.id === task.topic)).toBe(true);
      expect(task.promptNl.length).toBeGreaterThan(25);
      expect(task.promptEnglish.length).toBeGreaterThan(25);
      expect(task.explanation.length).toBeGreaterThan(40);
      expect(task.answers.every((a) => a.length > 5)).toBe(true);
    }
    expect(LEARNING_VERBS.find((v) => v.lemma === "overwegen")?.perfect).toBe(
      "heb overwogen",
    );
    expect(LEARNING_VERBS.find((v) => v.lemma === "aankomen")?.perfect).toBe(
      "ben aangekomen",
    );
  });
  it("persists exact tiles/drafts, counts each result once and keeps speech recall separate from quiz scoring", () => {
    const ids = LEARNING_TASKS.slice(0, 3).map((t) => t.id);
    const start = openLabAttempt(emptyLabState(), ids, 0, () => 0);
    start.current!.draft = "Vandaag werk ik thuis.";
    start.current!.placed = [0, 1];
    expect(parseLabState(JSON.stringify(start))).toEqual(start);
    const finished = finishLabAttempt(start, "correct", 100);
    expect(finishLabAttempt(finished, "correct", 200)).toBe(finished);
    expect(finished.reviews[ids[0]].correct).toBe(1);
    expect(finished.reviews[ids[0]].due).toBeGreaterThan(100);
    const next = nextLabAttempt(finished, ids);
    expect(next.history).toHaveLength(1);
    expect(next.current?.taskId).not.toBe(ids[0]);
    const recalled = finishLabAttempt(next, "recalled");
    expect(recalled.reviews[next.current!.taskId].correct).toBe(0);
    expect(recalled.reviews[next.current!.taskId].recalled).toBe(1);
    expect(labKey("guest", "als", "quiz", "all", "all")).not.toBe(
      labKey("user:david", "als", "quiz", "all", "all"),
    );
  });
  it("rejects stale, corrupt or impossible saved tiles without crashing", () => {
    expect(parseLabState("{")).toEqual(emptyLabState());
    const s = openLabAttempt(emptyLabState(), [LEARNING_TASKS[0].id]);
    s.current!.tiles = [999];
    expect(parseLabState(JSON.stringify(s)).current).toBeNull();
    s.current!.taskId = "missing";
    expect(parseLabState(JSON.stringify(s)).current).toBeNull();
  });
  it("does not silently accept missing negation or arbitrary natural variants", () => {
    const task = LEARNING_TASKS.find((t) => t.id === "lab-omdat-01")!;
    expect(
      acceptsAnswer(task, " ik werk thuis omdat de trein niet rijdt! "),
    ).toBe(true);
    expect(acceptsAnswer(task, "Ik werk thuis omdat de trein rijdt.")).toBe(
      false,
    );
  });
  it("has meaningful cooking alternatives while retaining historical pronoun IDs", () => {
    const card = {
      text: "Zij kookt graag voor haar vrienden.",
      lang: "nl" as const,
      english: "",
      scenario: "",
    };
    const task = communicationFor(card),
      principal = principalAnswers(task);
    expect(
      principal.some(
        (a) => a.text === "Zij vindt het leuk om voor haar vrienden te koken.",
      ),
    ).toBe(true);
    expect(
      principal.some((a) => a.text === "Ze kookt graag voor haar vrienden."),
    ).toBe(false);
    expect(modelFor(card, "alt-59d9e7c91ea0")?.text).toBe(
      "Ze kookt graag voor haar vrienden.",
    );
    const holiday = communicationFor({
      ...card,
      text: "Wij plannen onze vakantie.",
    });
    expect(holiday.scenario).toContain("Speaking for the whole group");
  });
  it("connects lesson vocabulary to actual lessons without adding duplicate headwords", () => {
    const original = [...baseWords, ...workWords];
    const duplicates = (list: { headword: string }[]) =>
      list.length - new Set(list.map((v) => v.headword.toLowerCase())).size;
    // Existing dictionary senses may share a lemma; additions must not create new duplicates.
    expect(duplicates(VOCABULARY)).toBe(duplicates(original));
    for (const entry of VOCABULARY)
      if (entry.lessonIds)
        expect(vocabularyLessons(entry)).toHaveLength(entry.lessonIds.length);
    expect(
      vocabularyLessons(VOCABULARY.find((v) => v.headword === "proberen")!)
        .length,
    ).toBeGreaterThan(2);
  });
  it("reads an English situation with an English voice, not a Dutch voice", () => {
    const dutch = { name: "Dutch", lang: "nl-BE" },
      english = { name: "English", lang: "en-GB" };
    expect(pickVoice("en", [dutch, english])).toEqual(english);
    expect(pickVoice("nl", [english])).toBeNull();
  });
});
