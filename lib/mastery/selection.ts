import type { Candidate, ProgressRecord } from "./types";
import { createInitialProgress } from "./types";

export const COOLDOWN_WINDOW = 2;
export const MIN_POOL_SIZE_FOR_COOLDOWN = 3;

const POOL_WEIGHTS = {
  due: 0.5,
  learning: 0.3,
  stable: 0.15,
  mastered: 0.05,
} as const;

type PoolName = keyof typeof POOL_WEIGHTS;

type Entry = { candidate: Candidate; record: ProgressRecord };

function classify(entry: Entry, currentQuestionIndex: number): PoolName {
  const { record } = entry;
  if (record.scheduledReturnAtQuestion !== null && record.scheduledReturnAtQuestion <= currentQuestionIndex) {
    return "due";
  }
  if (record.masteryLevel <= 2) return "learning";
  if (record.masteryLevel <= 4) return "stable";
  return "mastered";
}

function weightOf(entry: Entry): number {
  const { record } = entry;
  const accuracyWeight = record.seen > 0 ? (1 - record.correct / record.seen) * 3 : 1.5;
  const recentWrongWeight = record.lastResult === "wrong" ? 2 : 0;
  const frequencyWeight = entry.candidate.frequencyRank ? 10 / entry.candidate.frequencyRank : 0;
  return 1 + record.priorityBoost * 2 + accuracyWeight + recentWrongWeight + frequencyWeight;
}

function weightedPick<T>(items: T[], weightFn: (item: T) => number, random: () => number): T {
  const weights = items.map((item) => Math.max(0.0001, weightFn(item)));
  const total = weights.reduce((sum, w) => sum + w, 0);
  let roll = random() * total;
  for (let i = 0; i < items.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return items[i];
  }
  return items[items.length - 1];
}

export type SelectNextConceptParams = {
  candidates: Candidate[];
  progressByKey: Record<string, ProgressRecord>;
  currentQuestionIndex: number;
  recentConceptKeys: string[];
  random?: () => number;
};

export function selectNextConcept(params: SelectNextConceptParams): Candidate {
  const { candidates, progressByKey, currentQuestionIndex, recentConceptKeys, random = Math.random } = params;

  if (candidates.length === 0) {
    throw new Error("selectNextConcept: candidates must not be empty");
  }

  const allEntries: Entry[] = candidates.map((candidate) => ({
    candidate,
    record: progressByKey[candidate.conceptKey] ?? createInitialProgress(candidate),
  }));

  const recentSet = new Set(recentConceptKeys.slice(-COOLDOWN_WINDOW));
  const withoutCooldown = allEntries.filter((e) => !recentSet.has(e.candidate.conceptKey));
  const eligible = withoutCooldown.length >= MIN_POOL_SIZE_FOR_COOLDOWN ? withoutCooldown : allEntries;

  const pools: Record<PoolName, Entry[]> = { due: [], learning: [], stable: [], mastered: [] };
  for (const entry of eligible) {
    pools[classify(entry, currentQuestionIndex)].push(entry);
  }

  const availablePools = (Object.keys(POOL_WEIGHTS) as PoolName[]).filter((name) => pools[name].length > 0);
  const totalWeight = availablePools.reduce((sum, name) => sum + POOL_WEIGHTS[name], 0);

  let roll = random() * totalWeight;
  let chosenPool: PoolName = availablePools[availablePools.length - 1];
  for (const name of availablePools) {
    roll -= POOL_WEIGHTS[name];
    if (roll <= 0) {
      chosenPool = name;
      break;
    }
  }

  const chosen = weightedPick(pools[chosenPool], weightOf, random);
  return chosen.candidate;
}
