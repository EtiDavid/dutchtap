import Link from "next/link";
import type { SessionSummary as SessionSummaryData } from "@/lib/game/useGameSession";

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-2.5 last:border-b-0">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-sm font-semibold text-foreground">{value}</span>
    </div>
  );
}

export function SessionSummary({ summary }: { summary: SessionSummaryData }) {
  return (
    <div className="flex w-full max-w-sm flex-col gap-6 px-6 py-10">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted">Session complete</p>
        <p className="mt-2 text-4xl font-bold text-accent">+{summary.pointsEarned}</p>
      </div>

      <div className="rounded-2xl border border-border bg-surface px-4 py-1">
        <Row label="Questions answered" value={summary.questionsAnswered} />
        <Row label="Correct" value={summary.correct} />
        <Row label="Wrong" value={summary.wrong} />
        <Row label="Accuracy" value={`${summary.accuracy}%`} />
        <Row label="Concepts improved" value={summary.conceptsImproved} />
        <Row label="Weak concepts remaining" value={summary.weakConceptsRemaining} />
      </div>

      <Link
        href="/"
        className="flex h-14 w-full items-center justify-center rounded-2xl bg-accent text-lg font-semibold text-accent-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        Done
      </Link>
    </div>
  );
}
