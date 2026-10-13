import { CARDS, newReview, rateLevel, type Level, type Reviews } from '@/lib/flashcards/engine';
import { applyAction, createSessionFromIds } from '@/lib/sessions/engine';
import { actionSchema, type Action, type ActionInput, type Session } from '@/lib/sessions/types';
import { seededRandom, shuffledTokenOrder, sentenceTokens, tokenId } from '@/lib/sessions/wordOrder';

let counter = 0;
export const uid = (prefix = 'id') => `${prefix}-${String(++counter).padStart(8, '0')}-test`;
export const at = '2026-10-13T10:00:00.000Z';
export const NOW = new Date(at);

export function makeAction(input: ActionInput): Action {
  return actionSchema.parse({ id: uid('act'), at, ...input });
}
export function makeSession(count = 3, offset = 0): Session {
  return createSessionFromIds({ id: uid('ses'), name: 'Test session', cardIds: CARDS.slice(offset, offset + count).map(c => c.id), topic: 'all', startingLevel: 'difficult', now: NOW, rand: seededRandom('test') });
}
/** Applies one action and fails the test if it was not applied. */
export function run(session: Session, input: ActionInput) {
  const result = applyAction(session, makeAction(input), NOW);
  if (!result.applied) throw new Error(`Action ${input.type} rejected: ${result.reason}`);
  return result;
}
export const orderFor = (cardId: string) => shuffledTokenOrder(CARDS.find(c => c.id === cardId)!.dutch, seededRandom(cardId));
export const correctAnswer = (cardId: string) => sentenceTokens(CARDS.find(c => c.id === cardId)!.dutch).map((_, i) => tokenId(i));

/** Speaking: open (if needed), reveal, explicitly choose and submit one rating for the current card. */
export function rateSpeaking(session: Session, level: Level, nextCardId?: string) {
  let s = session;
  if (!s.speaking.current) s = run(s, { type: 'speaking/open', cardId: s.cardIds.find(id => !s.cards[id]?.spDone)!, attemptId: uid('att') }).session;
  const attemptId = s.speaking.current!.attemptId;
  s = run(s, { type: 'speaking/reveal', attemptId }).session;
  s = run(s, { type: 'speaking/choose', attemptId, level }).session;
  return run(s, { type: 'speaking/submit', attemptId, level, next: nextCardId ? { cardId: nextCardId, attemptId: uid('att') } : null });
}
/** Quiz: open (if needed), submit an answer and continue. */
export function answerQuiz(session: Session, correct: boolean, nextCardId?: string) {
  let s = session;
  if (!s.quiz.current) { const id = s.cardIds.find(c => !s.cards[c]?.qDone)!; s = run(s, { type: 'quiz/open', cardId: id, attemptId: uid('att'), tokenOrder: orderFor(id) }).session; }
  const cur = s.quiz.current!;
  const answer = correct ? correctAnswer(cur.cardId) : [...correctAnswer(cur.cardId)].reverse();
  const wrongIsSame = !correct && answer.every((id, i) => sentenceTokens(CARDS.find(c => c.id === cur.cardId)!.dutch)[Number(id.slice(1))] === sentenceTokens(CARDS.find(c => c.id === cur.cardId)!.dutch)[i]);
  if (wrongIsSame) throw new Error('test sentence is a palindrome');
  const submitted = run(s, { type: 'quiz/submit', attemptId: cur.attemptId, answer });
  const nextId = nextCardId ?? submitted.session.cardIds.find(c => !submitted.session.cards[c]?.qDone);
  const next = nextId ? { cardId: nextId, attemptId: uid('att'), tokenOrder: orderFor(nextId) } : null;
  return run(submitted.session, { type: 'quiz/continue', attemptId: cur.attemptId, next }).session;
}
export const reviewsWith = (levels: Record<string, Level>): Reviews =>
  Object.fromEntries(Object.entries(levels).map(([id, level]) => [id, rateLevel(id, newReview(id, NOW), level, NOW)]));

/** Rates whichever card is current, `steps` times; `levelFor` decides the rating per card. */
export function playSpeaking(session: Session, levelFor: (cardId: string) => Level, steps = 1): Session {
  let s = session;
  for (let i = 0; i < steps; i++) {
    if (!s.speaking.current) { const open = s.cardIds.find(id => !s.cards[id]?.spDone); if (!open) return s; s = run(s, { type: 'speaking/open', cardId: open, attemptId: uid('att') }).session; }
    const cardId = s.speaking.current!.cardId;
    s = rateSpeaking(s, levelFor(cardId)).session;
  }
  return s;
}
/** Answers whichever Quiz card is current, `steps` times; `correctFor` decides per card. */
export function playQuiz(session: Session, correctFor: (cardId: string) => boolean, steps = 1): Session {
  let s = session;
  for (let i = 0; i < steps; i++) {
    if (!s.quiz.current) { const open = s.cardIds.find(id => !s.cards[id]?.qDone); if (!open) return s; s = run(s, { type: 'quiz/open', cardId: open, attemptId: uid('att'), tokenOrder: orderFor(open) }).session; }
    const cardId = s.quiz.current!.cardId;
    s = answerQuiz(s, correctFor(cardId));
  }
  return s;
}
