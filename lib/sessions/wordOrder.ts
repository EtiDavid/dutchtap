import type { Card } from '@/lib/flashcards/engine';

/**
 * Word-order exercise for a session Quiz. Each word is a distinct token instance (t0, t1, ...), so repeated
 * words ("Het is het ...") stay separate pieces. Answers are graded on the words, so two identical words may
 * be swapped freely.
 */
const strip = (token: string) =>
  /^['’][st][.,!?;:]?$/i.test(token) ? token.replace(/[.,!?;:]$/, '') : token.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');

/** The taught sentence as words without punctuation; the first word is lower-cased so it does not give the start away. */
export function sentenceTokens(dutch: string): string[] {
  const words = dutch.split(/\s+/).map(strip).filter(Boolean);
  if (words.length) words[0] = words[0][0].toLowerCase() + words[0].slice(1);
  return words;
}
export const tokenId = (index: number) => `t${index}`;
export const tokenIndex = (id: string): number => (/^t(\d+)$/.test(id) ? Number(id.slice(1)) : -1);

export function seededRandom(seed: string): () => number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) { h = Math.imul(h ^ seed.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  let a = h >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
export function shuffled<T>(items: readonly T[], rand: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
  return out;
}

/** A shuffled order of token ids that differs from the taught order whenever that is possible. */
export function shuffledTokenOrder(dutch: string, rand: () => number = Math.random): string[] {
  const words = sentenceTokens(dutch);
  const ids = words.map((_, i) => tokenId(i));
  const sameWords = (order: string[]) => order.every((id, i) => words[tokenIndex(id)] === words[i]);
  if (new Set(words).size === 1) return ids; // every word identical: nothing to reorder
  let order = shuffled(ids, rand);
  for (let tries = 0; tries < 20 && sameWords(order); tries++) order = shuffled(ids, rand);
  if (sameWords(order)) order = [...ids.slice(1), ids[0]];
  return order;
}

/** True when `order` uses every token id exactly once. */
export function isTokenPermutation(dutch: string, order: readonly string[]): boolean {
  const n = sentenceTokens(dutch).length;
  if (order.length !== n) return false;
  const seen = new Set<number>();
  for (const id of order) { const i = tokenIndex(id); if (i < 0 || i >= n || seen.has(i)) return false; seen.add(i); }
  return true;
}
/** True when `answer` only uses valid, distinct token ids (it may be partial). */
export function isValidDraft(dutch: string, answer: readonly string[]): boolean {
  const n = sentenceTokens(dutch).length;
  const seen = new Set<number>();
  for (const id of answer) { const i = tokenIndex(id); if (i < 0 || i >= n || seen.has(i)) return false; seen.add(i); }
  return true;
}
/** Grades a complete answer against the taught sentence. */
export function isOrderAnswerCorrect(dutch: string, answer: readonly string[]): boolean {
  const words = sentenceTokens(dutch);
  return isTokenPermutation(dutch, answer) && answer.every((id, i) => words[tokenIndex(id)] === words[i]);
}
export const answerText = (dutch: string, answer: readonly string[]) => answer.map(id => sentenceTokens(dutch)[tokenIndex(id)]).join(' ');

/** Every sentence in the deck must give a usable exercise; a one-word sentence is flagged so the UI can say so. */
export function describeExercise(card: Pick<Card, 'dutch'>): { words: number; trivial: boolean; reorderable: boolean } {
  const words = sentenceTokens(card.dutch);
  return { words: words.length, trivial: words.length < 2, reorderable: new Set(words).size > 1 };
}

/** The words of the taught sentence in order (what the answer tokens point to). */
export const tokensForSentence = sentenceTokens;
