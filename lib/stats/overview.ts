import type { ProgressRecord } from "@/lib/mastery/types";
import { countWeakConcepts } from "@/lib/game/weakWords";

export type OverviewStats = {
  lifetimeScore: number;
  wordsSeen: number;
  conceptsMastered: number;
  conceptsLearning: number;
  weakConcepts: number;
  accuracy: number;
};

export function computeOverviewStats(
  progressByKey: Record<string, ProgressRecord>,
  lifetimeScore: number,
  totalCorrect: number,
  totalWrong: number,
): OverviewStats {
  const records = Object.values(progressByKey);
  const seenWordIds = new Set(records.filter((r) => r.seen > 0).map((r) => r.wordId));
  const conceptsMastered = records.filter((r) => r.masteryLevel === 5).length;
  const conceptsLearning = records.filter((r) => r.masteryLevel > 0 && r.masteryLevel < 5).length;
  const totalAnswered = totalCorrect + totalWrong;

  return {
    lifetimeScore,
    wordsSeen: seenWordIds.size,
    conceptsMastered,
    conceptsLearning,
    weakConcepts: countWeakConcepts(progressByKey),
    accuracy: totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0,
  };
}
