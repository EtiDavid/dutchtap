import Link from "next/link";
import { grammarTopicsFor, originOf } from "@/lib/grammarTags";

/** The grammar topics this one sentence practises. One sentence, one rating: the links open a session in that pattern. */
export function GrammarTopicsHere({ card }: { card: { id: string; originCardId?: string } }) {
  const topics = grammarTopicsFor(originOf(card));
  if (topics.length === 0) return null;
  return <section aria-label="Grammar in this sentence" className="mt-5" data-testid="grammar-topics-here">
    <p className="text-xs font-semibold uppercase tracking-wide text-accent">Grammar in this sentence</p>
    <ul className="mt-2 flex flex-col gap-1.5 text-sm">
      {topics.map(t => <li key={t.topic}>
        <Link href={`/flashcards?new=grammar:${t.topic}`} className="text-accent underline">{t.title}</Link>
        {t.evidence.length > 0 && <span className="text-muted"> · {t.evidence.join(", ")}</span>}
      </li>)}
    </ul>
  </section>;
}
