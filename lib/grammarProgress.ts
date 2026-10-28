import type { Reviews } from "@/lib/flashcards/engine";
import { GRAMMAR_CARDS } from "@/lib/flashcards/engine";

export type TopicProgress = {
  /** Distinct pattern sentences in the topic (an alias of a sentence already in the topic is not counted twice). */
  total: number;
  /** Pattern sentences the learner has rated at least once. */
  practised: number;
  /** Pattern sentences currently rated Mastered. */
  mastered: number;
};

const byTopic = new Map<string, { id: string; origin: string }[]>();
for (const card of GRAMMAR_CARDS) {
  const list = byTopic.get(card.category) ?? [];
  list.push({ id: card.id, origin: card.originCardId ?? card.id });
  byTopic.set(card.category, list);
}

/**
 * Honest progress for one grammar topic, from the learner's own ratings of the pattern sentences only. A pattern sentence that
 * is an alias of an Everyday or Dutch at Work sentence has its own rating, so Everyday mastery never counts here. Nothing is
 * inferred: a sentence that has never been rated is "not started", and only an explicit Mastered rating is mastered.
 */
export function topicProgress(topic: string, reviews: Reviews): TopicProgress {
  const seen = new Set<string>();
  const progress: TopicProgress = { total: 0, practised: 0, mastered: 0 };
  for (const { id, origin } of byTopic.get(topic) ?? []) {
    if (seen.has(origin)) continue;
    seen.add(origin);
    progress.total++;
    const review = reviews[id];
    if (review) progress.practised++;
    if (review?.level === "mastered") progress.mastered++;
  }
  return progress;
}

/** What a screen reader hears for a topic tile. */
export function progressSummary(progress: TopicProgress): string {
  if (progress.practised === 0) return `${progress.total} sentences, not started`;
  return `${progress.total} sentences, ${progress.practised} practised, ${progress.mastered} mastered`;
}
