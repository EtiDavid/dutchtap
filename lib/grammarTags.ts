import tagData from "@/data/grammar-source-tags.json";
import reuseLinks from "@/data/grammar-reuse-links.json";
import { GRAMMAR_AREAS } from "@/lib/content/collections";

export type GrammarTag = { topic: string; evidence: string; via: "alias" | "tag" };
type RawTag = { id: string; topic: string; evidence: string; review: string };

const RAW = tagData.tags as RawTag[];
const byCard = new Map<string, GrammarTag[]>();
const push = (id: string, tag: GrammarTag) => { const list = byCard.get(id) ?? []; if (!list.some(t => t.topic === tag.topic && t.evidence === tag.evidence)) list.push(tag); byCard.set(id, list); };
for (const l of reuseLinks) push(l.sourceId, { topic: l.topic, evidence: "linked card", via: "alias" });
for (const t of RAW) push(t.id, { topic: t.topic, evidence: t.evidence, via: "tag" });

/** The id of the one original sentence behind a grammar alias (the card itself for any other card). */
export const originOf = (card: { id: string; originCardId?: string }) => card.originCardId ?? card.id;

/** Which grammar topics an original sentence practises, from explicit alias links and reviewed tags. One sentence, many topics, one rating. */
export const grammarTagsFor = (originId: string): GrammarTag[] => byCard.get(originId) ?? [];

/** Distinct topics with the evidence that justifies each, ready for display. */
export function grammarTopicsFor(originId: string): { topic: string; title: string; evidence: string[] }[] {
  const grouped = new Map<string, string[]>();
  for (const t of grammarTagsFor(originId)) {
    const e = grouped.get(t.topic) ?? [];
    if (t.via === "tag") e.push(t.evidence);
    grouped.set(t.topic, e);
  }
  return [...grouped].map(([topic, evidence]) => ({ topic, title: (GRAMMAR_AREAS as Record<string, string>)[topic] ?? topic, evidence }));
}

/** Original sentences tagged for a topic that are not already one of its explicit alias cards. */
export const taggedSourcesFor = (topic: string): string[] => [...new Set(RAW.filter(t => t.topic === topic).map(t => t.id))];
