import type { Breakdown } from "@/lib/grammarBreakdowns";

const KIND = {
  hoofdzin: { dutch: "hoofdzin", english: "main clause" },
  bijzin: { dutch: "bijzin", english: "subordinate clause" },
} as const;

/** Highlights the finite verb inside its clause (first whole-word match, ignoring case). The clause text and verb are authored; a test requires the verb to occur once in a clause, so the match is never ambiguous. */
function Highlighted({ text, finite }: { text: string; finite: string }) {
  const at = text.search(new RegExp(`(^|\\s)${finite.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=\\s|$)`, "i"));
  if (at < 0) return <>{text}</>;
  const start = text[at] === " " ? at + 1 : at;
  return (
    <>
      {text.slice(0, start)}
      <mark className="rounded bg-accent-soft px-1 font-bold text-accent">{text.slice(start, start + finite.length)}</mark>
      {text.slice(start + finite.length)}
    </>
  );
}

/**
 * The clause map for one authored sentence: which part is the main clause and which the subordinate clause, the subject and finite verb
 * of each, and why. It renders only what was written for this sentence; a sentence with no authored analysis shows nothing here.
 */
export function GrammarClauseMap({ breakdown }: { breakdown: Breakdown }) {
  if (!breakdown.clauses?.length) return null;
  return (
    <section className="mt-4 space-y-3" aria-label="Clause map" data-testid="clause-map">
      <h3 className="eyebrow">Clause map</h3>
      {breakdown.sense && (
        <p className="text-sm" data-testid="topic-sense">
          <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-bold text-accent">{breakdown.sense.label}</span>{" "}
          <span className="text-muted">{breakdown.sense.why}</span>
        </p>
      )}
      <div className="grid gap-2">
        {breakdown.clauses.map((clause, index) => (
          <div key={index} className="rounded-xl border border-border bg-surface p-3" data-clause={clause.kind}>
            <p className="text-[11px] font-bold uppercase tracking-wide text-accent">
              {KIND[clause.kind].dutch} · {clause.role ?? KIND[clause.kind].english}
            </p>
            <p lang="nl" className="mt-1 text-base font-semibold leading-snug">
              <Highlighted text={clause.text} finite={clause.finite} />
            </p>
            <p className="mt-1 text-xs text-muted">
              subject: <span lang="nl" className="font-semibold text-foreground">{clause.subject}</span> · finite verb: <span lang="nl" className="font-semibold text-foreground">{clause.finite}</span>
            </p>
            <p className="mt-2 text-sm leading-relaxed">{clause.why}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
