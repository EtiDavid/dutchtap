import type { NounEntry } from "@/data/types";
import type { GameMode } from "@/lib/grammar/types";
import type { ProgressRecord } from "@/lib/mastery/types";
import { isWeakConcept } from "@/lib/game/weakWords";

export type ModeStats = {
  mode: GameMode;
  questionsAnswered: number;
  accuracy: number;
  masteredConcepts: number;
  weakConcepts: number;
};

export type TroubleItem = {
  conceptKey: string;
  label: string;
  accuracy: number;
};

export type DetailedStats = {
  overall: {
    lifetimeScore: number;
    wordsSeen: number;
    conceptsMastered: number;
    conceptsLearning: number;
    weakConcepts: number;
    accuracy: number;
  };
  perMode: ModeStats[];
  troubleList: TroubleItem[];
};

const MODES: GameMode[] = ["article", "demonstrative", "adjective"];
const MIN_SEEN_FOR_TROUBLE_LIST = 3;
const TROUBLE_LIST_SIZE = 10;

function labelFor(record: ProgressRecord, noun: NounEntry | undefined): string {
  if (!noun) return record.wordId;
  if (record.mode === "article") return `${noun.article} ${noun.singular}`;
  if (record.mode === "demonstrative") return noun.singular;
  return noun.singular;
}

export function computeDetailedStats(
  records: ProgressRecord[],
  nounIndex: Map<string, NounEntry>,
  lifetimeScore: number,
  totalCorrect: number,
  totalWrong: number,
): DetailedStats {
  const seenRecords = records.filter((r) => r.seen > 0);
  const totalAnswered = totalCorrect + totalWrong;

  const perMode: ModeStats[] = MODES.map((mode) => {
    const modeRecords = records.filter((r) => r.mode === mode);
    const answered = modeRecords.reduce((sum, r) => sum + r.seen, 0);
    const correct = modeRecords.reduce((sum, r) => sum + r.correct, 0);
    return {
      mode,
      questionsAnswered: answered,
      accuracy: answered > 0 ? Math.round((correct / answered) * 100) : 0,
      masteredConcepts: modeRecords.filter((r) => r.masteryLevel === 5).length,
      weakConcepts: modeRecords.filter(isWeakConcept).length,
    };
  });

  const troubleList: TroubleItem[] = seenRecords
    .filter((r) => r.seen >= MIN_SEEN_FOR_TROUBLE_LIST)
    .map((r) => ({
      conceptKey: r.conceptKey,
      label: labelFor(r, nounIndex.get(r.wordId)),
      accuracy: Math.round((r.correct / r.seen) * 100),
    }))
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, TROUBLE_LIST_SIZE);

  return {
    overall: {
      lifetimeScore,
      wordsSeen: new Set(seenRecords.map((r) => r.wordId)).size,
      conceptsMastered: records.filter((r) => r.masteryLevel === 5).length,
      conceptsLearning: records.filter((r) => r.masteryLevel > 0 && r.masteryLevel < 5).length,
      weakConcepts: records.filter(isWeakConcept).length,
      accuracy: totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0,
    },
    perMode,
    troubleList,
  };
}
