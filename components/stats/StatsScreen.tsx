"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { NOUNS } from "@/data/nouns";
import { loadLocalProgress } from "@/lib/sync/localProgress";
import { computeDetailedStats, type DetailedStats } from "@/lib/stats/detailed";
import { useAccount } from "@/lib/auth/useAccount";
import { MODE_TITLES } from "@/lib/game/modes";

const nounIndex = new Map(NOUNS.map((n) => [n.id, n]));

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-2.5 last:border-b-0">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-sm font-semibold text-foreground">{value}</span>
    </div>
  );
}

export function StatsScreen() {
  const { account, loading: accountLoading } = useAccount();
  const [stats, setStats] = useState<DetailedStats | null>(null);

  useEffect(() => {
    if (accountLoading) return;

    if (account) {
      fetch("/api/stats")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => data && setStats(data))
        .catch(() => {});
      return;
    }

    const local = loadLocalProgress();
    const records = Object.values(local.progressByKey);
    setStats(computeDetailedStats(records, nounIndex, local.lifetimeScore, local.totalCorrect, local.totalWrong));
  }, [account, accountLoading]);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-sm flex-col gap-6 px-6 py-8">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-sm text-muted">
          ← Back
        </Link>
        <p className="text-lg font-bold text-foreground">Stats</p>
        <span className="w-8" />
      </div>

      {!stats ? (
        <p className="text-center text-sm text-muted">Loading…</p>
      ) : stats.overall.wordsSeen === 0 ? (
        <p className="text-center text-sm text-muted">Play a round to start building stats.</p>
      ) : (
        <>
          <section className="rounded-2xl border border-border bg-surface px-4 py-1">
            <p className="px-0 pt-3 pb-1 text-xs font-semibold uppercase tracking-wide text-muted">Overall</p>
            <StatRow label="Lifetime score" value={stats.overall.lifetimeScore} />
            <StatRow label="Words seen" value={stats.overall.wordsSeen} />
            <StatRow label="Concepts mastered" value={stats.overall.conceptsMastered} />
            <StatRow label="Concepts learning" value={stats.overall.conceptsLearning} />
            <StatRow label="Weak concepts" value={stats.overall.weakConcepts} />
            <StatRow label="Overall accuracy" value={`${stats.overall.accuracy}%`} />
          </section>

          <section className="flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Per mode</p>
            {stats.perMode.map((m) => (
              <div key={m.mode} className="rounded-2xl border border-border bg-surface px-4 py-1">
                <p className="px-0 pt-3 pb-1 text-sm font-semibold text-foreground">{MODE_TITLES[m.mode]}</p>
                <StatRow label="Questions answered" value={m.questionsAnswered} />
                <StatRow label="Accuracy" value={`${m.accuracy}%`} />
                <StatRow label="Mastered" value={m.masteredConcepts} />
                <StatRow label="Weak" value={m.weakConcepts} />
              </div>
            ))}
          </section>

          {stats.troubleList.length > 0 && (
            <section className="rounded-2xl border border-border bg-surface px-4 py-3">
              <p className="pb-2 text-xs font-semibold uppercase tracking-wide text-muted">Trouble list</p>
              <ul className="flex flex-col gap-1.5 font-mono text-sm">
                {stats.troubleList.map((item) => (
                  <li key={item.conceptKey} className="flex items-center justify-between">
                    <span className="text-foreground">{item.label}</span>
                    <span className="text-error">{item.accuracy}%</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
