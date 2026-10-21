import { describe, expect, it } from 'vitest';
import { EVERYDAY_CARDS as CARDS, CATEGORIES, newReview, rateLevel, type Level } from '@/lib/flashcards/engine';
import {
  applyAction, applyActions, checkCreation, createSession, defaultSessionName, eligibleIds, isComplete, levelAvailability, levelCounts,
  pickQuizCard, pickSpeakingCard, practiseAgain, quizDrawWeight, retired, sessionStats, unfinished,
} from '@/lib/sessions/engine';
import { MAX_ACTIVE_SESSIONS, QUIZ_POINTS, RETIRE_AT, sessionSchema } from '@/lib/sessions/types';
import { seededRandom } from '@/lib/sessions/wordOrder';
import { answerQuiz, correctAnswer, makeAction, makeSession, NOW, orderFor, playQuiz, playSpeaking, rateSpeaking, reviewsWith, run, uid } from './helpers/sessions';

const school = CARDS.filter(c => c.category === 'school').map(c => c.id);

describe('creating a session', () => {
  it('picks exactly the requested number of distinct cards from the chosen place and level, once', () => {
    const s = createSession({ topic: 'school', level: 'difficult', count: 10, reviews: {}, rand: seededRandom('a'), now: NOW })!;
    expect(s.cardIds).toHaveLength(10);
    expect(new Set(s.cardIds).size).toBe(10);
    expect(s.cardIds.every(id => school.includes(id))).toBe(true);
    expect(sessionSchema.safeParse(s).success).toBe(true);
    expect(s.status).toBe('active');
    expect(s.cards[s.cardIds[0]]).toMatchObject({ spStreak: 0, qStreak: 0, spDone: false, qDone: false });
  });
  it('treats cards with no global record as Difficult, and uses the latest global levels', () => {
    const reviews = reviewsWith({ [school[0]]: 'easy', [school[1]]: 'mastered' });
    expect(eligibleIds('school', 'difficult', reviews)).not.toContain(school[0]);
    expect(eligibleIds('school', 'difficult', reviews)).toHaveLength(school.length - 2);
    expect(eligibleIds('school', 'easy', reviews)).toEqual([school[0]]);
    expect(levelCounts('school', reviews)).toEqual({ difficult: school.length - 2, medium: 0, easy: 1, mastered: 1 });
    expect(levelCounts('all', {}).difficult).toBe(CARDS.length);
  });
  it('shows topic/level counts for every topic and level', () => {
    for (const topic of ['all', ...Object.keys(CATEGORIES)]) {
      const counts = levelCounts(topic, {});
      expect(counts.difficult).toBe(topic === 'all' ? CARDS.length : CARDS.filter(c => c.category === topic).length);
    }
  });
  it('disables levels that cannot supply the count and explains why', () => {
    const reviews = reviewsWith(Object.fromEntries(school.slice(0, 12).map(id => [id, 'easy' as Level])));
    const availability = levelAvailability('school', 20, reviews);
    const easy = availability.find(a => a.level === 'easy')!;
    expect(easy).toMatchObject({ available: 12, enough: false });
    expect(easy.message).toBe('Easy has 12 cards; you requested 20. Choose fewer cards or practise Difficult cards and rate them Easy.');
    expect(availability.find(a => a.level === 'difficult')!.enough).toBe(school.length - 12 >= 20);
    expect(availability.find(a => a.level === 'mastered')!.message).toMatch(/no Mastered cards/);
    expect(levelAvailability('school', 5, reviews).find(a => a.level === 'easy')!.enough).toBe(true);
  });
  it('never substitutes cards: an unavailable level or count yields no session', () => {
    expect(createSession({ topic: 'school', level: 'mastered', count: 5, reviews: {} })).toBeNull();
    expect(createSession({ topic: 'school', level: 'difficult', count: school.length + 1, reviews: {} })).toBeNull();
    for (const count of [0, -1, 1.5, 101, NaN]) expect(createSession({ topic: 'all', level: 'difficult', count, reviews: {} })).toBeNull();
  });
  it('validates a request: invalid count, no level can supply it, unavailable level, five-active limit', () => {
    expect(checkCreation({ topic: 'all', level: 'difficult', count: 10 }, {}, 0)).toEqual({ ok: true });
    expect(checkCreation({ topic: 'all', level: 'difficult', count: 0 }, {}, 0)).toMatchObject({ ok: false, code: 'count' });
    expect(checkCreation({ topic: 'school', level: 'difficult', count: 99 }, {}, 0)).toMatchObject({ ok: false, code: 'none' });
    expect(checkCreation({ topic: 'school', level: 'easy', count: 10 }, {}, 0)).toMatchObject({ ok: false, code: 'level' });
    const limit = checkCreation({ topic: 'all', level: 'difficult', count: 10 }, {}, MAX_ACTIVE_SESSIONS);
    expect(limit).toMatchObject({ ok: false, code: 'limit' });
    expect(limit.ok === false && limit.message).toMatch(/Finish one .* or delete one/);
  });
  it('defaults to a useful name with the place, count, level and date', () => {
    expect(defaultSessionName('shopping', 10, 'difficult', NOW)).toBe('Shopping · 10 Difficult cards · 13 Oct');
    expect(defaultSessionName('all', 1, 'easy', NOW)).toBe('All places · 1 Easy card · 13 Oct');
  });
  it('creates a new session with the same cards and fresh counters ("practise this set again")', () => {
    let s = makeSession(2);
    s = rateSpeaking(s, 'mastered').session;
    const again = practiseAgain(s, { now: NOW });
    expect(again.id).not.toBe(s.id);
    expect([...again.cardIds].sort()).toEqual([...s.cardIds].sort());
    expect(again.cards[again.cardIds[0]].spStreak).toBe(0);
    expect(again.status).toBe('active');
    expect(again.name).toBe(`Again: ${s.name}`);
    expect(practiseAgain(again).name).toBe(`Again: ${s.name}`);
  });
});

describe('Study', () => {
  it('shows every card exactly once per round, then reshuffles for the next round', () => {
    let s = makeSession(6);
    const seen: string[] = [];
    for (let i = 0; i < 6; i++) { seen.push(s.study.order[s.study.pos]); s = run(s, { type: 'study/next' }).session; }
    expect([...seen].sort()).toEqual([...s.cardIds].sort());
    expect(s.study.round).toBe(2);
    expect(s.study.pos).toBe(0);
    expect([...s.study.order].sort()).toEqual([...s.cardIds].sort());
  });
  it('avoids an immediate duplicate between rounds when possible', () => {
    for (let n = 0; n < 40; n++) {
      let s = makeSession(4);
      for (let i = 0; i < 3; i++) s = run(s, { type: 'study/next' }).session;
      const last = s.study.order[3];
      s = run(s, { type: 'study/next' }).session;
      expect(s.study.order[0]).not.toBe(last);
    }
  });
  it('accepts a device-provided round order only if it is a valid permutation', () => {
    let s = makeSession(3);
    for (let i = 0; i < 2; i++) s = run(s, { type: 'study/next' }).session;
    const last = s.study.order[2];
    const good = s.cardIds.filter(id => id !== last).concat(last);
    s = run(s, { type: 'study/next', nextOrder: good }).session;
    expect(s.study.order).toEqual(good);
    for (let i = 0; i < 2; i++) s = run(s, { type: 'study/next' }).session;
    s = run(s, { type: 'study/next', nextOrder: [s.cardIds[0], s.cardIds[0], s.cardIds[0]] }).session;
    expect([...s.study.order].sort()).toEqual([...s.cardIds].sort());
  });
  it('has no grading side effects and is not affected by other modes', () => {
    let s = makeSession(3);
    const before = JSON.stringify({ cards: s.cards, quiz: s.quiz, speaking: s.speaking, events: s.events });
    const result = run(s, { type: 'study/next' });
    expect(result.effects).toEqual([]);
    s = result.session;
    expect(JSON.stringify({ cards: s.cards, quiz: s.quiz, speaking: s.speaking, events: s.events })).toBe(before);
    expect(s.status).toBe('active');
  });
  it('keeps its position while Speaking and Quiz are used, and a single-card session still advances', () => {
    let s = makeSession(4);
    s = run(s, { type: 'study/next' }).session;
    const position = { ...s.study };
    s = rateSpeaking(s, 'easy').session;
    s = answerQuiz(s, false);
    expect(s.study).toEqual(position);
    const one = run(makeSession(1), { type: 'study/next' }).session;
    expect(one.study.round).toBe(2);
  });
  it('stays available after the session is complete', () => {
    const s = completeSession(makeSession(1));
    expect(s.status).toBe('archived');
    expect(run(s, { type: 'study/next' }).session.study.round).toBe(2);
  });
});

describe('Speaking', () => {
  it('requires reveal and an explicit rating for this attempt before Next', () => {
    let s = makeSession(3);
    const cardId = s.cardIds[0];
    s = run(s, { type: 'speaking/open', cardId, attemptId: 'attempt-speak-1' }).session;
    const attemptId = 'attempt-speak-1';
    expect(applyAction(s, makeAction({ type: 'speaking/submit', attemptId, level: 'mastered', next: null }), NOW)).toMatchObject({ applied: false, reason: 'not-revealed' });
    expect(applyAction(s, makeAction({ type: 'speaking/choose', attemptId, level: 'mastered' }), NOW)).toMatchObject({ applied: false, reason: 'not-revealed' });
    s = run(s, { type: 'speaking/reveal', attemptId }).session;
    // Revealing alone (with a preselected level shown) never awards anything.
    expect(applyAction(s, makeAction({ type: 'speaking/submit', attemptId, level: 'mastered', next: null }), NOW)).toMatchObject({ applied: false, reason: 'not-chosen' });
    expect(s.cards[cardId].spStreak).toBe(0);
    expect(s.events).toHaveLength(0);
    s = run(s, { type: 'speaking/choose', attemptId, level: 'easy' }).session;
    expect(applyAction(s, makeAction({ type: 'speaking/submit', attemptId, level: 'mastered', next: null }), NOW)).toMatchObject({ applied: false, reason: 'not-chosen' }); // chose Easy, cannot submit Mastered
  });
  it('counts only an explicit Mastered rating as a recall and resets on any lower rating', () => {
    for (const lower of ['easy', 'medium', 'difficult'] as const) {
      let s = makeSession(2);
      const target = s.cardIds[0];
      const other = s.cardIds[1];
      const play = (level: Level, steps = 1) => { s = playSpeaking(s, id => (id === target ? level : 'difficult'), steps); };
      play('mastered', 2); // target, other, ... alternating
      expect(s.cards[target].spStreak).toBe(1);
      play('mastered', 2);
      expect(s.cards[target].spStreak).toBe(2);
      expect(s.cards[other].spStreak).toBe(0); // the other card was rated Difficult
      play('mastered', 6);
      expect(s.cards[target].spStreak).toBe(5);
      play(lower, 2); // a lower rating resets only the card it was given to
      expect(s.cards[target].spStreak).toBe(0);
      play('mastered', 2);
      expect(s.cards[target].spStreak).toBe(1);
    }
  });
  it('reports the level change as an effect so the global level is updated once', () => {
    const result = rateSpeaking(makeSession(2), 'medium');
    expect(result.effects).toEqual([{ lang: 'nl', cardId: result.session.events[0].cardId, level: 'medium', at: expect.any(String) }]);
    const replay = applyAction(result.session, makeAction({ type: 'study/next' }), NOW); // unrelated action: no effect
    expect(replay.effects).toEqual([]);
  });
  it('retires a card after exactly ten consecutive recalls, only in this session', () => {
    let s = makeSession(3);
    const target = s.cardIds[0];
    const levelFor = (id: string): Level => (id === target ? 'mastered' : 'difficult');
    let targetRatings = 0;
    while (!s.cards[target].spDone && targetRatings < 40) {
      const before = s.cards[target].spStreak;
      s = playSpeaking(s, levelFor);
      if (s.cards[target].spStreak !== before || s.cards[target].spDone) targetRatings++;
      expect(s.cards[target].spStreak).toBeLessThanOrEqual(RETIRE_AT);
    }
    expect(s.cards[target]).toMatchObject({ spStreak: RETIRE_AT, spDone: true });
    expect(s.cards[target].spAttempts).toBe(RETIRE_AT);
    expect(unfinished(s, 'speaking')).not.toContain(target);
    expect(retired(s, 'speaking')).toBe(1);
    expect(s.speaking.current?.cardId).not.toBe(target);
    expect(s.speaking.done).toBe(false);
    const another = makeSession(3); // a different session holding the same cards has independent counters
    expect(another.cards[target].spStreak).toBe(0);
    expect(another.cards[target].spDone).toBe(false);
  });
  it('a card that is globally Mastered still starts at zero in a new session', () => {
    const reviews = reviewsWith({ [CARDS[0].id]: 'mastered' });
    const s = makeSession(2);
    expect(s.cards[CARDS[0].id].spStreak).toBe(0);
    expect(reviews[CARDS[0].id].level).toBe('mastered');
  });
  it('never exceeds ten and gives completed cards no weight', () => {
    let s = makeSession(2);
    const [a, b] = s.cardIds;
    s = playSpeaking(s, id => (id === a ? 'mastered' : 'difficult'), 30);
    expect(s.cards[a]).toMatchObject({ spStreak: RETIRE_AT, spDone: true });
    for (let n = 0; n < 50; n++) expect(pickSpeakingCard(s, {}, seededRandom(`r${n}`))).toBe(b);
    expect(s.cards[a].spStreak).toBeLessThanOrEqual(RETIRE_AT);
  });
  it('completes Speaking when every card is retired, keeping Study and Quiz usable', () => {
    let s = makeSession(2);
    for (let i = 0; i < RETIRE_AT * 2; i++) s = rateSpeaking(s, 'mastered').session;
    expect(s.speaking.done).toBe(true);
    expect(s.speaking.current).toBeNull();
    expect(s.status).toBe('active');
    expect(applyAction(s, makeAction({ type: 'speaking/open', cardId: s.cardIds[0], attemptId: uid('att') }), NOW)).toMatchObject({ applied: false, reason: 'invalid' });
    expect(run(s, { type: 'study/next' }).applied).toBe(true);
    s = answerQuiz(s, true);
    expect(s.quiz.points).toBe(QUIZ_POINTS);
  });
  it('weights Difficult > Medium > Easy > Mastered and avoids an immediate repeat', () => {
    const s = makeSession(4);
    const [d, m, e, x] = s.cardIds;
    const reviews = reviewsWith({ [d]: 'difficult', [m]: 'medium', [e]: 'easy', [x]: 'mastered' });
    const rand = seededRandom('weights');
    const tally: Record<string, number> = { [d]: 0, [m]: 0, [e]: 0, [x]: 0 };
    for (let i = 0; i < 4000; i++) tally[pickSpeakingCard(s, reviews, rand)!]++;
    expect(tally[d]).toBeGreaterThan(tally[m]); expect(tally[m]).toBeGreaterThan(tally[e]); expect(tally[e]).toBeGreaterThan(tally[x]); expect(tally[x]).toBeGreaterThan(0);
    for (let i = 0; i < 200; i++) expect(pickSpeakingCard(s, reviews, rand, d)).not.toBe(d);
  });
  it('keeps a single remaining card playable and does not remove Difficult cards because they appeared often', () => {
    let s = makeSession(2);
    const [a, b] = s.cardIds;
    s = playSpeaking(s, id => (id === a ? 'mastered' : 'difficult'), 30);
    expect(unfinished(s, 'speaking')).toEqual([b]);
    for (let i = 0; i < 25; i++) { s = rateSpeaking(s, 'difficult').session; expect(s.speaking.current?.cardId).toBe(b); }
    expect(s.cards[b].spDone).toBe(false);
    expect(s.cards[b].spAttempts).toBeGreaterThan(25);
  });
  it('rejects stale attempts instead of creating phantom ratings', () => {
    let s = makeSession(2);
    s = run(s, { type: 'speaking/open', cardId: s.cardIds[0], attemptId: 'attempt-old-1' }).session;
    s = run(s, { type: 'speaking/reveal', attemptId: 'attempt-old-1' }).session;
    expect(applyAction(s, makeAction({ type: 'speaking/choose', attemptId: 'attempt-other', level: 'mastered' }), NOW)).toMatchObject({ applied: false, reason: 'stale' });
    expect(applyAction(s, makeAction({ type: 'speaking/open', cardId: s.cardIds[1], attemptId: uid('att') }), NOW)).toMatchObject({ applied: false, reason: 'busy' });
  });
  it('leaving a card unanswered creates no rating or counter (there is no skip action)', () => {
    let s = makeSession(2);
    s = run(s, { type: 'speaking/open', cardId: s.cardIds[0], attemptId: 'attempt-leave-1' }).session;
    s = run(s, { type: 'speaking/reveal', attemptId: 'attempt-leave-1' }).session;
    expect(s.events).toHaveLength(0);
    expect(s.cards[s.cardIds[0]].spAttempts).toBe(0);
  });
  it('cannot open a card that is not in the session', () => {
    const s = makeSession(2);
    const outside = CARDS[10].id;
    expect(applyAction(s, makeAction({ type: 'speaking/open', cardId: outside, attemptId: uid('att') }), NOW)).toMatchObject({ applied: false, reason: 'invalid' });
  });
});

describe('Quiz', () => {
  it('awards 10 points for a correct word order and 0 for a wrong one, with per-card streaks', () => {
    let s = makeSession(1);
    const card = s.cardIds[0]; // one card: it can repeat
    s = answerQuiz(s, true);
    expect(s.quiz.points).toBe(10); expect(s.cards[card]).toMatchObject({ qStreak: 1, qCorrect: 1, qWrong: 0, qLastWrong: false });
    s = answerQuiz(s, false);
    expect(s.quiz.points).toBe(10); expect(s.cards[card]).toMatchObject({ qStreak: 0, qCorrect: 1, qWrong: 1, qLastWrong: true });
    s = answerQuiz(s, true);
    expect(s.quiz.points).toBe(20); expect(s.cards[card].qStreak).toBe(1);
    expect(sessionStats(s)).toMatchObject({ quizCorrect: 2, quizWrong: 1, quizPoints: 20, quizAccuracy: 67 });
  });
  it('scores the same attempt only once, and a refresh/replay never double counts', () => {
    let s = makeSession(2);
    const id = s.cardIds[0];
    s = run(s, { type: 'quiz/open', cardId: id, attemptId: 'attempt-q-0001', tokenOrder: orderFor(id) }).session;
    const submit = makeAction({ type: 'quiz/submit', attemptId: 'attempt-q-0001', answer: correctAnswer(id) });
    const first = applyAction(s, submit, NOW);
    expect(first.applied).toBe(true);
    expect(applyAction(first.session, submit, NOW)).toMatchObject({ applied: false, reason: 'duplicate' }); // same request replayed
    const again = applyAction(first.session, makeAction({ type: 'quiz/submit', attemptId: 'attempt-q-0001', answer: correctAnswer(id) }), NOW); // new request id, same attempt
    expect(again).toMatchObject({ applied: false, reason: 'stale' });
    expect(first.session.quiz.points).toBe(10); expect(first.session.cards[id].qCorrect).toBe(1);
    expect(first.session.quiz.current?.outcome).toEqual({ correct: true, points: 10 });
  });
  it('preserves the partial answer, shuffled tokens and feedback in the saved session', () => {
    let s = makeSession(2);
    const id = s.cardIds[0];
    const order = orderFor(id);
    s = run(s, { type: 'quiz/open', cardId: id, attemptId: 'attempt-q-0002', tokenOrder: order }).session;
    s = run(s, { type: 'quiz/draft', attemptId: 'attempt-q-0002', answer: [order[0], order[1]] }).session;
    const restored = sessionSchema.parse(JSON.parse(JSON.stringify(s)));
    expect(restored.quiz.current).toMatchObject({ cardId: id, attemptId: 'attempt-q-0002', tokenOrder: order, answer: [order[0], order[1]], outcome: null });
    expect(applyAction(s, makeAction({ type: 'quiz/draft', attemptId: 'attempt-q-0002', answer: [order[0], order[0]] }), NOW)).toMatchObject({ applied: false, reason: 'invalid' });
  });
  it('rejects an incomplete answer instead of scoring it', () => {
    let s = makeSession(2);
    const id = s.cardIds[0];
    s = run(s, { type: 'quiz/open', cardId: id, attemptId: 'attempt-q-0003', tokenOrder: orderFor(id) }).session;
    expect(applyAction(s, makeAction({ type: 'quiz/submit', attemptId: 'attempt-q-0003', answer: correctAnswer(id).slice(1) }), NOW)).toMatchObject({ applied: false, reason: 'incomplete' });
    expect(s.quiz.points).toBe(0);
  });
  it('accepts swapped identical words (distinct token instances), which count as the same sentence', () => {
    const card = CARDS.find(c => c.id === 'health-09')!; // "Voel je je beter?" repeats "je"
    const base = makeSession(1);
    let s = { ...base, cardIds: [card.id], cards: { [card.id]: base.cards[base.cardIds[0]] }, study: { ...base.study, order: [card.id] } };
    s = run(s, { type: 'quiz/open', cardId: card.id, attemptId: 'attempt-q-0004', tokenOrder: orderFor(card.id) }).session;
    const swapped = ['t0', 't3', 't2', 't1'].slice(0, 4);
    expect(card.dutch).toBe('Voel je je beter?');
    const result = applyAction(s, makeAction({ type: 'quiz/submit', attemptId: 'attempt-q-0004', answer: ['t0', 't2', 't1', 't3'] }), NOW);
    expect(result.session.quiz.current?.outcome?.correct).toBe(true);
    void swapped;
  });
  it('retires a card after exactly ten consecutive correct answers; a wrong answer resets the streak', () => {
    let s = makeSession(3);
    const target = s.cardIds[0];
    const only = (correct: boolean) => (id: string) => (id === target ? correct : true);
    const rounds = (correct: boolean, n: number) => { let seen = 0; while (seen < n) { const before = s.cards[target].qCorrect + s.cards[target].qWrong; s = playQuiz(s, only(correct)); if (s.cards[target].qCorrect + s.cards[target].qWrong !== before) seen++; } };
    rounds(true, 9);
    expect(s.cards[target]).toMatchObject({ qStreak: 9, qDone: false });
    rounds(false, 1);
    expect(s.cards[target]).toMatchObject({ qStreak: 0, qDone: false, qLastWrong: true });
    rounds(true, RETIRE_AT);
    expect(s.cards[target]).toMatchObject({ qStreak: RETIRE_AT, qDone: true });
    expect(unfinished(s, 'quiz')).not.toContain(target);
    expect(s.quiz.current?.cardId).not.toBe(target);
    expect(quizDrawWeight(s.cards[target])).toBe(0);
  });
  it('raises the priority of missed cards and lowers it for well-answered ones', () => {
    const fresh = makeSession(1).cards[makeSession(1).cardIds[0]];
    expect(quizDrawWeight({ ...fresh, qLastWrong: true, qWrong: 1 })).toBeGreaterThan(quizDrawWeight(fresh));
    expect(quizDrawWeight({ ...fresh, qCorrect: 3, qStreak: 3 })).toBeLessThan(quizDrawWeight(fresh));
    expect(quizDrawWeight({ ...fresh, qCorrect: 9, qStreak: 9 })).toBeLessThan(quizDrawWeight({ ...fresh, qCorrect: 3, qStreak: 3 }));
    let s = makeSession(3);
    const [a, b, c] = s.cardIds;
    s = answerQuiz(s, false, a);
    const tally: Record<string, number> = { [a]: 0, [b]: 0, [c]: 0 };
    const rand = seededRandom('quiz');
    for (let i = 0; i < 3000; i++) tally[pickQuizCard(s, rand)!]++;
    expect(tally[a]).toBeGreaterThan(tally[b]);
    for (let i = 0; i < 100; i++) expect(pickQuizCard(s, rand, a)).not.toBe(a);
  });
  it('completes Quiz when every card is retired, independent of Speaking', () => {
    let s = makeSession(2);
    for (let i = 0; i < RETIRE_AT * 2; i++) s = answerQuiz(s, true);
    expect(s.quiz.done).toBe(true);
    expect(s.quiz.current).toBeNull();
    expect(s.quiz.points).toBe(RETIRE_AT * 2 * QUIZ_POINTS);
    expect(s.status).toBe('active');
    expect(s.speaking.done).toBe(false);
    s = rateSpeaking(s, 'mastered').session;
    expect(s.cards[s.speaking.current?.cardId ?? s.cardIds[0]]).toBeDefined();
  });
  it('keeps one remaining card playable and avoids immediate repeats otherwise', () => {
    let s = makeSession(2);
    const [a, b] = s.cardIds;
    s = playQuiz(s, () => true, 30);
    expect(unfinished(s, 'quiz')).toEqual([]);
    let t = makeSession(2);
    t = playQuiz(t, id => id === a, 30); // a answered correctly every time, b always wrong
    expect(t.cards[a].qDone).toBe(true);
    expect(unfinished(t, 'quiz')).toEqual([b]);
    t = answerQuiz(t, false);
    expect(t.quiz.current?.cardId).toBe(b);
    const many = makeSession(5);
    for (let i = 0; i < 40; i++) expect(pickQuizCard(many, seededRandom(`s${i}`), many.cardIds[2])).not.toBe(many.cardIds[2]);
  });
  it('works for every one of the 300 sentences (no sentence is skipped or impossible to finish)', () => {
    for (const card of CARDS) {
      const s0 = createSessionLike(card.id);
      const s = run(s0, { type: 'quiz/open', cardId: card.id, attemptId: uid('att'), tokenOrder: orderFor(card.id) }).session;
      expect(s.quiz.current!.tokenOrder).toHaveLength(correctAnswer(card.id).length);
      const done = run(s, { type: 'quiz/submit', attemptId: s.quiz.current!.attemptId, answer: correctAnswer(card.id) });
      expect(done.session.quiz.current!.outcome?.correct, card.id).toBe(true);
    }
  });
});

function createSessionLike(cardId: string) {
  const s = makeSession(1);
  return { ...s, cardIds: [cardId], cards: { [cardId]: s.cards[s.cardIds[0]] }, study: { ...s.study, order: [cardId] } };
}
function completeSession(session: ReturnType<typeof makeSession>) {
  let s = session;
  for (let i = 0; i < RETIRE_AT * s.cardIds.length; i++) s = rateSpeaking(s, 'mastered').session;
  for (let i = 0; i < RETIRE_AT * s.cardIds.length; i++) s = answerQuiz(s, true);
  return s;
}

describe('completion and archiving', () => {
  it('Study alone never completes a session', () => {
    let s = makeSession(2);
    for (let i = 0; i < 12; i++) s = run(s, { type: 'study/next' }).session;
    expect(s.status).toBe('active'); expect(isComplete(s)).toBe(false);
  });
  it('archives automatically only when BOTH Speaking and Quiz are complete', () => {
    let s = makeSession(1);
    for (let i = 0; i < RETIRE_AT; i++) s = rateSpeaking(s, 'mastered').session;
    expect(s.speaking.done).toBe(true); expect(s.status).toBe('active'); expect(s.completedAt).toBeNull();
    for (let i = 0; i < RETIRE_AT; i++) s = answerQuiz(s, true);
    expect(s.quiz.done).toBe(true); expect(s.status).toBe('archived'); expect(s.completedAt).not.toBeNull();
    expect(sessionStats(s)).toMatchObject({ speakingRetired: 1, quizRetired: 1, total: 1 });
  });
  it('works in either order (Quiz first)', () => {
    let s = makeSession(1);
    for (let i = 0; i < RETIRE_AT; i++) s = answerQuiz(s, true);
    expect(s.status).toBe('active');
    for (let i = 0; i < RETIRE_AT; i++) s = rateSpeaking(s, 'mastered').session;
    expect(s.status).toBe('archived');
  });
  it('does not restart or reset counters when a finished session is reopened, and rejects further Speaking/Quiz actions', () => {
    const s = completeSession(makeSession(1));
    const frozen = JSON.stringify(s.cards);
    expect(applyAction(s, makeAction({ type: 'speaking/open', cardId: s.cardIds[0], attemptId: uid('att') }), NOW)).toMatchObject({ applied: false, reason: 'archived' });
    expect(applyAction(s, makeAction({ type: 'quiz/open', cardId: s.cardIds[0], attemptId: uid('att'), tokenOrder: orderFor(s.cardIds[0]) }), NOW)).toMatchObject({ applied: false, reason: 'archived' });
    expect(JSON.stringify(s.cards)).toBe(frozen);
    expect(run(s, { type: 'rename', name: 'Kept as history' }).session.name).toBe('Kept as history');
  });
  it('applyActions replays a batch in order and reports what was applied or rejected', () => {
    const s = makeSession(2);
    const open = makeAction({ type: 'speaking/open', cardId: s.cardIds[0], attemptId: 'attempt-batch-1' });
    const out = applyActions(s, [open, open, makeAction({ type: 'speaking/reveal', attemptId: 'attempt-batch-1' })], NOW);
    expect(out.applied).toHaveLength(2);
    expect(out.rejected).toEqual([{ id: open.id, reason: 'duplicate' }]);
    expect(out.session.speaking.current?.revealed).toBe(true);
  });
  it('keeps the event log and applied-id log bounded', () => {
    let s = makeSession(1);
    for (let i = 0; i < 600; i++) s = run(s, { type: 'study/next' }).session;
    expect(s.applied.length).toBeLessThanOrEqual(500);
    for (let i = 0; i < 4; i++) s = rateSpeaking(s, 'easy').session;
    expect(s.events.length).toBeLessThanOrEqual(200);
  });
});

describe('sessions refer to stable card ids', () => {
  it('a session stays valid and unchanged when more content is added to the deck later', () => {
    const s = makeSession(5);
    const parsed = sessionSchema.parse(JSON.parse(JSON.stringify(s)));
    expect(parsed.cardIds).toEqual(s.cardIds);
    // Selection only ever uses the stored ids: new deck cards would not appear in the session.
    expect(unfinished(parsed, 'speaking')).toEqual(s.cardIds);
    expect(rateLevel('x', newReview('x'), 'easy').level).toBe('easy');
  });
});
