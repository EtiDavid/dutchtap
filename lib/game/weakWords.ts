import { WEAK_MASTERY_THRESHOLD } from "./config";
import type { ProgressRecord } from "@/lib/mastery/types";

/**
 * A concept is "weak" only if it has genuinely been missed before and
 * hasn't recovered past the threshold yet — not merely "unmastered".
 * Otherwise every freshly-seen, never-missed word (mastery starts at 0)
 * would count as weak, which would misrepresent a clean run.
 */
export function isWeakConcept(record: ProgressRecord): boolean {
  return record.wrong > 0 && record.masteryLevel <= WEAK_MASTERY_THRESHOLD;
}

export function countWeakConcepts(progressByKey: Record<string, ProgressRecord>): number {
  return Object.values(progressByKey).filter(isWeakConcept).length;
}
