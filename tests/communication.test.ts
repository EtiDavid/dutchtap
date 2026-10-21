import { describe, it, expect } from "vitest";
import { CARDS } from "@/lib/flashcards/engine";
import { cardFor } from "@/lib/content/cards";
import {
  communicationFor,
  modelFor,
  matchAnswer,
} from "@/lib/practice/communication";
import { FAMILIES, variationCard } from "@/lib/variations/content";
import {
  applyAction,
  createSessionFromIds,
  deckCard,
  quizModel,
} from "@/lib/sessions/engine";
import { sessionSchema } from "@/lib/sessions/types";
import {
  sentenceTokens,
  tokenId,
  shuffledTokenOrder,
  seededRandom,
} from "@/lib/sessions/wordOrder";
import { run, makeAction, uid, NOW } from "./helpers/sessions";
import { FakeServer, MemoryStorage } from "./helpers/fakeServer";
import { SessionStore } from "@/lib/sessions/store";

const fresh = (id = "food-07") =>
  createSessionFromIds({
    id: uid("session"),
    name: "Situation practice",
    cardIds: [id],
    topic: "all",
    startingLevel: "difficult",
    now: NOW,
  });
function open(s: ReturnType<typeof fresh>, rotate = true) {
  const id = s.cardIds[0];
  return run(s, {
    type: "quiz/open",
    cardId: id,
    attemptId: uid("attempt"),
    rotateAnswers: rotate,
    tokenOrder: shuffledTokenOrder(
      deckCard(s.lang, id)!.text,
      seededRandom("tiles"),
      s.lang,
    ),
  }).session;
}
const correct = (s: ReturnType<typeof fresh>) =>
  sentenceTokens(quizModel(s)!.text, s.lang).map((_, i) => tokenId(i));
function submit(s: ReturnType<typeof fresh>, right = true) {
  return run(s, {
    type: "quiz/submit",
    attemptId: s.quiz.current!.attemptId,
    answer: right ? correct(s) : [...correct(s)].reverse(),
  }).session;
}
function next(s: ReturnType<typeof fresh>) {
  return run(s, {
    type: "quiz/continue",
    attemptId: s.quiz.current!.attemptId,
    next: {
      cardId: s.cardIds[0],
      attemptId: uid("attempt"),
      tokenOrder: ["t0"],
    },
    rotateAnswers: true,
  }).session;
}

describe("authored Dutch communication content", () => {
  it("provides an explicit situation and complete model explanations for every main card and every released or locked child", () => {
    const cards = [
      ...CARDS.map((c) => cardFor("nl", c.id)!),
      ...Object.values(FAMILIES)
        .flat()
        .map((v) => variationCard(v.id)!),
    ];
    expect(cards).toHaveLength(13200);
    for (const card of cards) {
      const t = communicationFor(card);
      expect(t.scenario.length, card.id).toBeGreaterThan(40);
      expect(t.scenario, card.id).not.toMatch(
        /^(Say this in Dutch|Translate|Use Dutch to convey)/i,
      );
      expect(t.answers[0].text, card.id).toBe(card.text);
      expect(t.answers[0].id).toBe("model");
      expect(new Set(t.answers.map((a) => a.id)).size).toBe(t.answers.length);
      for (const a of t.answers) {
        expect(a.english.length).toBeGreaterThan(2);
        expect(a.explanation.length).toBeGreaterThan(20);
        expect(sentenceTokens(a.text).length).toBeLessThanOrEqual(40);
      }
    }
  });
  it("distinguishes a new dish from an unknown dish and permits natural past/perfect reporting", () => {
    const t = communicationFor(cardFor("nl", "food-07")!);
    expect(t.scenario).toMatch(/Yesterday/);
    expect(t.scenario).toMatch(/new dish/);
    expect(t.scenario).not.toMatch(/unfamiliar|unknown/);
    expect(t.answers.map((a) => a.text)).toContain(
      "Ik heb een nieuw gerecht geprobeerd.",
    );
    expect(t.answers.map((a) => a.text)).toContain(
      "Ik probeerde een nieuw gerecht.",
    );
  });
  it("keeps one answer when appropriate instead of forcing three", () => {
    expect(communicationFor(cardFor("nl", "work-70")!).answers).toHaveLength(1);
  });
  it("does not publish invalid al-fronting or split the phrase uiterlijk maandag", () => {
    for (const c of CARDS) {
      for (const a of communicationFor(cardFor("nl", c.id)!).answers)
        expect(a.text).not.toMatch(/^Al had/);
    }
    const t = communicationFor(cardFor("nl", "work-21")!);
    expect(t.answers.map((a) => a.text)).toContain(
      "Uiterlijk maandag weet ik de resultaten.",
    );
    expect(t.answers.map((a) => a.text)).not.toContain(
      "Maandag weet ik de resultaten uiterlijk.",
    );
  });
});

describe("a saved model per quiz attempt", () => {
  it("visits every answer once per shuffled cycle, avoids a boundary repeat, and permits different word counts", () => {
    let s = open(fresh());
    const n = communicationFor(deckCard("nl", "food-07")!).answers.length;
    const seen: string[] = [];
    const lengths = new Set<number>();
    for (let i = 0; i < n * 4; i++) {
      seen.push(s.quiz.current!.answerId!);
      lengths.add(correct(s).length);
      s = submit(s, false);
      s = next(s);
    }
    for (let start = 0; start < seen.length; start += n)
      expect(new Set(seen.slice(start, start + n)).size).toBe(n);
    for (let i = 1; i < seen.length; i++) expect(seen[i]).not.toBe(seen[i - 1]);
    expect(lengths.size).toBeGreaterThan(1);
  });
  it("keeps the selected answer, exact shuffled tiles and draft through a JSON reload", () => {
    let s = open(fresh());
    s = run(s, {
      type: "quiz/draft",
      attemptId: s.quiz.current!.attemptId,
      answer: correct(s).slice(0, 2),
    }).session;
    const restored = sessionSchema.parse(JSON.parse(JSON.stringify(s)));
    expect(restored.quiz.current).toEqual(s.quiz.current);
    expect(quizModel(restored)).toEqual(quizModel(s));
    expect(restored.cards).toEqual(s.cards);
  });
  it("grades the chosen model and awards points only once after a replay", () => {
    const s = open(fresh()),
      a = makeAction({
        type: "quiz/submit",
        attemptId: s.quiz.current!.attemptId,
        answer: correct(s),
      });
    const result = applyAction(s, a, NOW);
    expect(result.session.quiz.points).toBe(10);
    expect(result.session.quiz.current!.outcome).toMatchObject({
      correct: true,
      answerId: s.quiz.current!.answerId,
    });
    expect(applyAction(result.session, a, NOW).reason).toBe("duplicate");
    expect(result.session.quizReview!.at(-1)!.answerId).toBe(
      s.quiz.current!.answerId,
    );
  });
  it("accepts another reviewed ordering only if these exact tile instances form it", () => {
    const text = "Vandaag drink ik koffie.";
    const card = {
      text,
      english: "Today I am drinking coffee.",
      scenario: "",
      lang: "nl" as const,
    };
    const selected = modelFor(card)!;
    const found = matchAnswer(card, selected, ["t2", "t1", "t0", "t3"]);
    expect(found?.text).toBe("Ik drink vandaag koffie.");
    expect(
      matchAnswer(card, selected, ["t2", "t1", "t0", "t0"]),
    ).toBeUndefined();
    expect(
      matchAnswer(card, selected, ["t0", "t2", "t1", "t3"]),
    ).toBeUndefined();
  });
  it("does not change the selected answer by reopening a busy attempt", () => {
    const s = open(fresh()),
      r = applyAction(
        s,
        makeAction({
          type: "quiz/open",
          cardId: "food-07",
          attemptId: uid("attempt"),
          tokenOrder: ["t0"],
          rotateAnswers: true,
        }),
      );
    expect(r.reason).toBe("busy");
    expect(r.session).toEqual(s);
  });
  it("saves the explanation of an accepted alternate word order even in a legacy round", () => {
    const s = open(fresh("school-08"), false);
    // Original tiles: Morgen ga ik naar school. Accepted: Ik ga morgen naar school.
    const result = run(s, {
      type: "quiz/submit",
      attemptId: s.quiz.current!.attemptId,
      answer: ["t2", "t1", "t0", "t3", "t4"],
    }).session;
    expect(result.quiz.points).toBe(10);
    const id = result.quiz.current!.outcome!.answerId;
    expect(modelFor(deckCard("nl", "school-08")!, id)?.text).toBe(
      "Ik ga morgen naar school.",
    );
    expect(result.quizReview!.at(-1)!.answerId).toBe(id);
    expect(sessionSchema.safeParse(result).success).toBe(true);
  });
  it("retains the original model for old saved attempts and old queued actions", () => {
    const s = open(fresh(), false);
    expect(s.quiz.current!.answerId).toBeUndefined();
    expect(quizModel(s)!.text).toBe("Ik probeerde een nieuw gerecht.");
    expect(submit(s).quiz.points).toBe(10);
  });
  it("rejects an answer ID from a different card without discarding valid old schema fields", () => {
    const s = open(fresh());
    s.quiz.current!.answerId = "not-a-published-answer";
    expect(sessionSchema.safeParse(s).success).toBe(false);
  });
  it("leaves French on its existing original model even if a caller requests rotation", () => {
    let s = fresh();
    s.lang = "fr";
    s = open(s);
    expect(s.quiz.current!.answerId).toBeUndefined();
    expect(quizModel(s)!.text).toBe(cardFor("fr", "food-07")!.text);
    expect(submit(s).quiz.points).toBe(10);
  });
  it("retains one shared card streak while rotating its expressions", () => {
    let s = open(fresh());
    for (let i = 0; i < 10; i++) {
      s = submit(s);
      if (i < 9) s = next(s);
    }
    expect(s.cards["food-07"]).toMatchObject({
      qStreak: 10,
      qDone: true,
      qCorrect: 10,
    });
    expect(s.quiz.points).toBe(100);
  });
  it("validates children with their own published model choices", () => {
    let s = fresh();
    s = run(s, {
      type: "variations/toggle",
      parentId: "food-07",
      enabled: true,
    }).session;
    const child = FAMILIES["food-07"][0];
    s = run(s, {
      type: "quiz/open",
      cardId: child.id,
      attemptId: uid("attempt"),
      tokenOrder: ["t0"],
      rotateAnswers: true,
    }).session;
    expect(quizModel(s)).toBeDefined();
    expect(sessionSchema.safeParse(s).success).toBe(true);
    s = submit(s);
    expect(s.childProgress[child.id].qCorrect).toBe(1);
    expect(s.cards["food-07"].qCorrect).toBe(0);
  });
  it("replays a lost offline response with the same model, history, points and next cycle on a second device", async () => {
    const server = new FakeServer(),
      storage = new MemoryStorage();
    const options = {
      scope: { kind: "user" as const, username: "anna" },
      storage,
      fetch: server.fetch,
      now: () => NOW,
      timers: { set: () => 0, clear: () => {} },
    };
    let d = new SessionStore(options);
    await d.start();
    const s = fresh();
    d.create(s);
    await d.sync();
    server.online = false;
    d.dispatch(s.id, {
      type: "quiz/open",
      cardId: "food-07",
      attemptId: uid("attempt"),
      tokenOrder: ["t0"],
      rotateAnswers: true,
    });
    const chosen = d.get(s.id)!;
    d.dispatch(s.id, {
      type: "quiz/draft",
      attemptId: chosen.quiz.current!.attemptId,
      answer: correct(chosen).slice(0, 1),
    });
    d.dispose();
    d = new SessionStore(options);
    await d.start();
    expect(d.get(s.id)!.quiz.current).toEqual({
      ...chosen.quiz.current,
      answer: correct(chosen).slice(0, 1),
    });
    d.dispatch(s.id, {
      type: "quiz/submit",
      attemptId: chosen.quiz.current!.attemptId,
      answer: correct(chosen),
    });
    server.online = true;
    server.dropResponses = 1;
    await d.sync();
    await d.sync();
    const other = new SessionStore({
      ...options,
      storage: new MemoryStorage(),
    });
    await other.start();
    const fromOther = other.get(s.id)!;
    expect(fromOther.quiz.points).toBe(10);
    expect(fromOther.quiz.current!.answerId).toBe(
      chosen.quiz.current!.answerId,
    );
    expect(fromOther.cards["food-07"].qCorrect).toBe(1);
    expect(fromOther.quizReview).toHaveLength(1);
    d.dispose();
    other.dispose();
  });
});
