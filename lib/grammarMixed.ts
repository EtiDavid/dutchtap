import challenges from "@/data/grammar-mixed-challenges.json";

export type MixedOption = { text: string; correct: boolean; why: string };
export type MixedChallenge = { id: string; topics: string[]; mix: string[]; situationNl: string; hintEn: string; options: MixedOption[]; rule: string };
export type MixedStat = { seen: number; right: number; streak: number; lastWrong: boolean };
export type MixedProgress = Record<string, MixedStat>;

export const MIXED_CHALLENGES = challenges.items as MixedChallenge[];
export const MIXED_STORAGE_KEY = "dutchtap:grammar-mixed:v1";
export const ROUND_SIZE = 8;

const blank: MixedStat = { seen: 0, right: 0, streak: 0, lastWrong: false };
export const statOf = (progress: MixedProgress, id: string): MixedStat => progress[id] ?? blank;

/** Weak or new challenges are drawn more often; mastered ones are rare but never disappear. */
export function weightOf(stat: MixedStat): number {
  if (stat.seen === 0) return 3;
  if (stat.lastWrong) return 4;
  if (stat.streak <= 1) return 2;
  if (stat.streak === 2) return 1;
  return 0.25;
}

export function recordAnswer(progress: MixedProgress, id: string, right: boolean): MixedProgress {
  const s = statOf(progress, id);
  return { ...progress, [id]: { seen: s.seen + 1, right: s.right + (right ? 1 : 0), streak: right ? s.streak + 1 : 0, lastWrong: !right } };
}

/** A round of distinct challenges: weighted by weakness, never the same primary topic twice in a row when avoidable. */
export function buildRound(progress: MixedProgress, rand: () => number, size = ROUND_SIZE, pool: MixedChallenge[] = MIXED_CHALLENGES): MixedChallenge[] {
  const left = [...pool];
  const out: MixedChallenge[] = [];
  while (out.length < size && left.length) {
    const prev = out[out.length - 1]?.topics[0];
    const candidates = left.filter(c => c.topics[0] !== prev);
    const from = candidates.length ? candidates : left;
    const total = from.reduce((n, c) => n + weightOf(statOf(progress, c.id)), 0);
    let pick = rand() * total;
    let chosen = from[from.length - 1];
    for (const c of from) { pick -= weightOf(statOf(progress, c.id)); if (pick <= 0) { chosen = c; break; } }
    out.push(chosen);
    left.splice(left.indexOf(chosen), 1);
  }
  return out;
}

/** The options in a random order for display (the data order is not the display order). */
export function shuffledOptions(challenge: MixedChallenge, rand: () => number): MixedOption[] {
  const a = [...challenge.options];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

/** Accuracy per grammar topic across everything answered so far, weakest first. */
export function topicAccuracy(progress: MixedProgress, pool: MixedChallenge[] = MIXED_CHALLENGES): { topic: string; seen: number; right: number }[] {
  const acc = new Map<string, { seen: number; right: number }>();
  for (const c of pool) {
    const s = progress[c.id];
    if (!s) continue;
    for (const t of c.topics) { const a = acc.get(t) ?? { seen: 0, right: 0 }; a.seen += s.seen; a.right += s.right; acc.set(t, a); }
  }
  return [...acc].map(([topic, a]) => ({ topic, ...a })).sort((x, y) => x.right / x.seen - y.right / y.seen);
}
