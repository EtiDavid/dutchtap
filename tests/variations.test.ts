import { describe, it, expect } from "vitest";
import { CORE_CARDS } from "@/lib/flashcards/engine";
import {
  FAMILIES,
  variationsFor,
  variationCard,
} from "@/lib/variations/content";
import {
  applyAction,
  availablePractice,
  createSessionFromIds,
  deckCard,
  pickSpeakingCard,
  progressOf,
} from "@/lib/sessions/engine";
import { sessionSchema } from "@/lib/sessions/types";
import {
  sentenceTokens,
  tokenId,
  seededRandom,
} from "@/lib/sessions/wordOrder";
import { makeAction, run, uid, NOW } from "./helpers/sessions";
const parent = "food-07";
const fresh = () =>
  createSessionFromIds({
    id: uid("session"),
    name: "Recipe practice",
    cardIds: [parent],
    topic: "all",
    startingLevel: "difficult",
    now: NOW,
  });
function enable() {
  return run(fresh(), {
    type: "variations/toggle",
    parentId: parent,
    enabled: true,
  }).session;
}
function rate(
  s: ReturnType<typeof fresh>,
  id: string,
  level: "difficult" | "medium" | "easy" | "mastered",
) {
  s.speaking.current = null;
  s = run(s, {
    type: "speaking/open",
    cardId: id,
    attemptId: uid("attempt"),
  }).session;
  const attemptId = s.speaking.current!.attemptId;
  s = run(s, { type: "speaking/reveal", attemptId }).session;
  s = run(s, { type: "speaking/choose", attemptId, level }).session;
  return run(s, { type: "speaking/submit", attemptId, level, next: null });
}
describe("Dutch family content", () => {
  it("covers all 1,200 parents with ten distinct related sentences, translations and teaching examples", () => {
    expect(CORE_CARDS.filter(card => !!FAMILIES[card.id])).toHaveLength(1200);
    expect(Object.entries(FAMILIES).filter(([id, children]) => id.startsWith('pat-als-') && children.length === 10)).toHaveLength(10);
    for (const card of CORE_CARDS) {
      const vs = variationsFor(card.id);
      expect(vs).toHaveLength(10);
      expect(new Set(vs.map((v) => v.text))).toHaveProperty("size", 10);
      for (const v of vs) {
        expect(v.parentId).toBe(card.id);
        expect(v.text.toLowerCase()).not.toBe(card.dutch.toLowerCase());
        expect(v.english.length).toBeGreaterThan(5);
        expect(v.explanation.length).toBeGreaterThan(20);
        expect(v.example.text).not.toBe(v.text);
        expect(sentenceTokens(v.text).length).toBeLessThanOrEqual(40);
        expect(variationCard(v.id)).toMatchObject({
          lang: "nl",
          image: "",
          audio: undefined,
        });
      }
    }
  });
});
describe("persistent gradual variations", () => {
  it("keeps Study fixed and starts with only two children", () => {
    const s = enable();
    expect(s.cardIds).toEqual([parent]);
    expect(s.study.order).toEqual([parent]);
    expect(availablePractice(s, "speaking")).toHaveLength(3);
    expect(availablePractice(s, "quiz")).toHaveLength(3);
    expect(
      progressOf(s, variationsFor(parent)[0].id).level ?? "difficult",
    ).toBe("difficult");
  });
  it("preselects Difficult, accepts Next after reveal, and never invents a successful recall", () => {
    let s = fresh();
    s = run(s, {
      type: "speaking/open",
      cardId: parent,
      attemptId: uid("attempt"),
    }).session;
    expect(s.speaking.current!.chosen).toBe("difficult");
    const attemptId = s.speaking.current!.attemptId;
    expect(
      applyAction(
        s,
        makeAction({
          type: "speaking/submit",
          attemptId,
          level: "difficult",
          next: null,
        }),
      ).reason,
    ).toBe("not-revealed");
    s = run(s, { type: "speaking/reveal", attemptId }).session;
    s = run(s, {
      type: "speaking/submit",
      attemptId,
      level: "difficult",
      next: null,
    }).session;
    expect(s.cards[parent]).toMatchObject({
      spAttempts: 1,
      spStreak: 0,
      level: "difficult",
    });
  });
  it("retains a chosen rating for the next appearance and restores it through schema round-trip", () => {
    const s = rate(fresh(), parent, "easy").session;
    expect(s.speaking.current!.chosen).toBe("easy");
    expect(sessionSchema.parse(JSON.parse(JSON.stringify(s)))).toEqual(s);
  });
  it("automatically enables after Mastered, unless the learner explicitly disabled it", () => {
    expect(
      rate(fresh(), parent, "mastered").session.variations[parent],
    ).toMatchObject({ enabled: true, unlocked: 2 });
    const off = run(fresh(), {
      type: "variations/toggle",
      parentId: parent,
      enabled: false,
    }).session;
    expect(
      rate(off, parent, "mastered").session.variations[parent].enabled,
    ).toBe(false);
  });
  it("unlocks one more as each child becomes Easy and keeps parent difficulty independent", () => {
    const first = variationsFor(parent)[0].id;
    const result = rate(enable(), first, "easy");
    expect(result.effects).toEqual([]);
    expect(result.session.cards[parent].level).toBe("difficult");
    expect(result.session.variations[parent].unlocked).toBe(3);
    expect(result.session.childProgress[first].level).toBe("easy");
    const second = variationsFor(parent)[1].id;
    const s = rate(result.session, second, "easy").session;
    expect(s.variations[parent].unlocked).toBe(4);
  });
  it("turning off from a child clears active child attempts, preserves ratings, and rejects stale submissions", () => {
    const child = variationsFor(parent)[0].id;
    let s = rate(enable(), child, "easy").session;
    s.speaking.current = null;
    s = run(s, {
      type: "speaking/open",
      cardId: child,
      attemptId: uid("attempt"),
    }).session;
    const attemptId = s.speaking.current!.attemptId;
    const before = s.childProgress[child];
    s = run(s, {
      type: "variations/toggle",
      parentId: parent,
      enabled: false,
    }).session;
    expect(s.speaking.current).toBeNull();
    expect(availablePractice(s, "speaking")).toEqual([parent]);
    expect(s.childProgress[child]).toEqual(before);
    expect(
      applyAction(
        s,
        makeAction({
          type: "speaking/submit",
          attemptId,
          level: "easy",
          next: null,
        }),
      ).reason,
    ).toBe("stale");
    s = run(s, {
      type: "variations/toggle",
      parentId: parent,
      enabled: true,
    }).session;
    expect(s.variations[parent].unlocked).toBe(3);
  });
  it("rejects locked, unrelated and French children", () => {
    const s = enable(),
      vs = variationsFor(parent);
    expect(
      applyAction(
        s,
        makeAction({
          type: "speaking/open",
          cardId: vs[9].id,
          attemptId: uid("attempt"),
        }),
      ).reason,
    ).toBe("invalid");
    expect(
      applyAction(
        s,
        makeAction({
          type: "speaking/open",
          cardId: variationsFor("work-01")[0].id,
          attemptId: uid("attempt"),
        }),
      ).reason,
    ).toBe("invalid");
    const french = { ...fresh(), lang: "fr" as const };
    expect(
      applyAction(
        french,
        makeAction({
          type: "variations/toggle",
          parentId: parent,
          enabled: true,
        }),
      ).reason,
    ).toBe("invalid");
    expect(
      sessionSchema.safeParse({
        ...french,
        history: { study: [vs[0].id], speaking: [], quiz: [] },
      }).success,
    ).toBe(false);
  });
  it("archives when main modes finish and keeps optional child practice playable", () => {
    let s = enable();
    s.cards[parent] = { ...s.cards[parent], qDone: true, qStreak: 10 };
    s.quiz.done = true;
    for (let i = 0; i < 10; i++) s = rate(s, parent, "mastered").session;
    expect(s.status).toBe("archived");
    expect(s.speaking.done).toBe(true);
    expect(rate(s, variationsFor(parent)[0].id, "medium").session.status).toBe(
      "archived",
    );
  });
  it("scores a child once, releases more after three consecutive quiz successes, and persists its draft", () => {
    let s = enable();
    const child = variationsFor(parent)[0].id;
    const answer = sentenceTokens(deckCard("nl", child)!.text).map((_, i) =>
      tokenId(i),
    );
    for (let i = 0; i < 3; i++) {
      s.quiz.current = null;
      const attemptId = uid("attempt");
      s = run(s, {
        type: "quiz/open",
        cardId: child,
        attemptId,
        tokenOrder: [...answer].reverse(),
      }).session;
      s = run(s, {
        type: "quiz/draft",
        attemptId,
        answer: answer.slice(0, 2),
      }).session;
      expect(
        sessionSchema.parse(JSON.parse(JSON.stringify(s))).quiz.current!.answer,
      ).toEqual(answer.slice(0, 2));
      const action = makeAction({ type: "quiz/submit", attemptId, answer });
      const result = applyAction(s, action, NOW);
      expect(result.applied).toBe(true);
      s = result.session;
      expect(applyAction(s, action, NOW).reason).toBe("duplicate");
    }
    expect(s.quiz.points).toBe(30);
    expect(s.cards[parent].qCorrect).toBe(0);
    expect(s.childProgress[child]).toMatchObject({
      qStreak: 3,
      level: "medium",
    });
    expect(s.variations[parent].unlocked).toBe(3);
  });
  it("keeps history bounded and scores nothing during Study navigation", () => {
    let s = fresh();
    for (let i = 0; i < 110; i++) s = run(s, { type: "study/next" }).session;
    expect(s.history.study).toHaveLength(100);
    expect(s.events).toEqual([]);
    expect(s.quiz.points).toBe(0);
  });
  it("makes a Mastered parent much rarer than a new child", () => {
    const s = rate(enable(), parent, "mastered").session;
    const rng = seededRandom("weights");
    let main = 0;
    for (let i = 0; i < 1000; i++)
      if (pickSpeakingCard(s, {}, rng) === parent) main++;
    expect(main).toBeLessThan(30);
  });
  it("migrates old sessions without losing counters", () => {
    const old = structuredClone(fresh()) as Record<string, unknown>;
    delete old.variations;
    delete old.childProgress;
    delete old.history;
    const parsed = sessionSchema.parse(old);
    expect(parsed.childProgress).toEqual({});
    expect(parsed.history.study).toEqual([]);
    expect(parsed.cards[parent].spAttempts).toBe(0);
  });
});

describe("account variation synchronization", () => {
  it("replays offline child ratings exactly once and restores them on a second device", async () => {
    const { SessionStore } = await import("@/lib/sessions/store");
    const { FakeServer, MemoryStorage } = await import("./helpers/fakeServer");
    const server = new FakeServer(),
      storage = new MemoryStorage();
    const options = {
      scope: { kind: "user" as const, username: "anna" },
      storage,
      fetch: server.fetch,
      now: () => NOW,
      timers: { set: () => 0, clear: () => {} },
    };
    let device = new SessionStore(options);
    await device.start();
    const s = fresh();
    device.create(s);
    await device.sync();
    server.online = false;
    device.dispatch(s.id, {
      type: "variations/toggle",
      parentId: parent,
      enabled: true,
    });
    const child = variationsFor(parent)[0].id,
      attemptId = uid("attempt");
    device.dispatch(s.id, { type: "speaking/open", cardId: child, attemptId });
    device.dispatch(s.id, { type: "speaking/reveal", attemptId });
    device.dispatch(s.id, {
      type: "speaking/choose",
      attemptId,
      level: "easy",
    });
    device.dispatch(s.id, {
      type: "speaking/submit",
      attemptId,
      level: "easy",
      next: null,
    });
    device.dispose();
    device = new SessionStore(options);
    await device.start();
    expect(device.get(s.id)!.childProgress[child]).toMatchObject({
      spAttempts: 1,
      level: "easy",
    });
    server.online = true;
    server.dropResponses = 1;
    await device.sync();
    await device.sync();
    const other = new SessionStore({
      ...options,
      storage: new MemoryStorage(),
    });
    await other.start();
    expect(other.get(s.id)!.childProgress[child]).toMatchObject({
      spAttempts: 1,
      level: "easy",
    });
    expect(other.get(s.id)!.variations[parent].unlocked).toBe(3);
    expect(other.get(s.id)!.cards[parent].spAttempts).toBe(0);
    device.dispose();
    other.dispose();
  });
});
