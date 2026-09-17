import { WEAK_MASTERY_THRESHOLD } from "./config";
import type { ProgressRecord } from "@/lib/mastery/types";

export function isWeakConcept(record: ProgressRecord): boolean {
  return record.masteryLevel <= WEAK_MASTERY_THRESHOLD || record.lastResult === "wrong" || record.scheduledReturnAtQuestion !== null;
}

export function countWeakConcepts(progressByKey: Record<string, ProgressRecord>): number {
  return Object.values(progressByKey).filter(isWeakConcept).length;
}
