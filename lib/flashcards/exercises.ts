import type { Card } from './engine';

// Active-recall exercises built from a card's Dutch sentence. Pure and seeded,
// so the same card + seed always yields the same exercise (stable across re-renders).
export type BlankExercise = { kind: 'blank'; before: string; after: string; answer: string; options: string[] };
export type OrderExercise = { kind: 'order'; words: string[]; answer: string[] };
export type Exercise = BlankExercise | OrderExercise;
export type ExerciseKind = Exercise['kind'];

// Only groups where, given the rest of the sentence, exactly one option is correct.
// Verb forms differ by subject; de/het and deze/dit differ by noun gender/number.
const VERB_GROUPS = [
  ['ben', 'bent', 'is', 'zijn'],
  ['heb', 'hebt', 'heeft', 'hebben'],
  ['kun', 'kunt', 'kunnen'],
  ['mag', 'mogen'],
  ['moet', 'moeten'],
  ['zal', 'zullen'],
  ['ga', 'gaat', 'gaan'],
  ['woon', 'woont', 'wonen'],
  ['spreek', 'spreekt', 'spreken'],
];
const NOUN_GROUPS = [['de', 'het'], ['deze', 'dit']];

const core = (token: string) => token.replace(/^[^\p{L}]+|[^\p{L}]+$/gu, '');
const matchCase = (word: string, like: string) => (like[0] !== like[0].toLowerCase() ? word[0].toUpperCase() + word.slice(1) : word);

function seeded(seed: string): () => number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) { h = Math.imul(h ^ seed.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  let a = h >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function shuffle<T>(items: T[], rand: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
  return out;
}

export function buildBlank(card: Card, seed: string): BlankExercise | null {
  const tokens = card.dutch.split(' ');
  const rand = seeded(`${card.id}:blank:${seed}`);
  const candidates: { index: number; group: string[] }[] = [];
  tokens.forEach((token, index) => {
    const word = core(token).toLowerCase();
    // "Dit is …" and a final "deze" stand alone, so de/het-style swaps become ambiguous there.
    const standalone = index === tokens.length - 1 || core(tokens[index + 1] ?? '').toLowerCase() === 'is';
    for (const group of VERB_GROUPS) if (group.includes(word)) candidates.push({ index, group });
    if (!standalone) for (const group of NOUN_GROUPS) if (group.includes(word)) candidates.push({ index, group });
  });
  if (!candidates.length) return null;
  const { index, group } = candidates[Math.floor(rand() * candidates.length)];
  const answer = core(tokens[index]);
  const lower = answer.toLowerCase();
  const wrong = shuffle(group.filter(w => w !== lower), rand).slice(0, 2).map(w => matchCase(w, answer));
  const at = tokens[index].indexOf(answer);
  const lead = tokens[index].slice(0, at);
  const trail = tokens[index].slice(at + answer.length);
  const head = tokens.slice(0, index).join(' ');
  const tail = tokens.slice(index + 1).join(' ');
  return { kind: 'blank', before: (head ? head + ' ' : '') + lead, after: trail + (tail ? ' ' + tail : ''), answer, options: shuffle([answer, ...wrong], rand) };
}

export function buildOrder(card: Card, seed: string): OrderExercise | null {
  const answer = card.dutch.split(' ').map(core).filter(Boolean);
  if (answer.length < 4 || answer.length > 9) return null;
  answer[0] = answer[0][0].toLowerCase() + answer[0].slice(1);
  const rand = seeded(`${card.id}:order:${seed}`);
  let words = shuffle(answer, rand);
  if (words.join(' ') === answer.join(' ')) words = [...words.slice(1), words[0]];
  return { kind: 'order', words, answer };
}

export function buildExercise(card: Card, kind: ExerciseKind, seed = ''): Exercise | null {
  return kind === 'blank' ? buildBlank(card, seed) ?? buildOrder(card, seed) : buildOrder(card, seed) ?? buildBlank(card, seed);
}

// Alternate types as a card is practised, so each sentence is met in different ways.
export function pickKind(attempts: number): ExerciseKind { return attempts % 2 === 0 ? 'blank' : 'order'; }

export const isBlankCorrect = (e: BlankExercise, choice: string) => choice === e.answer;
export const isOrderCorrect = (e: OrderExercise, built: string[]) => built.join(' ') === e.answer.join(' ');
