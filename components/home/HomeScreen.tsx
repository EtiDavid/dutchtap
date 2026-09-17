"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loadLocalProgress, type LocalProgressState } from "@/lib/sync/localProgress";
import { computeOverviewStats } from "@/lib/stats/overview";
import { ModeCard } from "./ModeCard";

export function HomeScreen() {
  const [progress, setProgress] = useState<LocalProgressState | null>(null);

  useEffect(() => {
    setProgress(loadLocalProgress());
  }, []);

  const stats = progress
    ? computeOverviewStats(progress.progressByKey, progress.lifetimeScore, progress.totalCorrect, progress.totalWrong)
    : null;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-sm flex-col gap-8 px-6 py-8">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xl font-bold text-foreground">DutchTap</p>
          <p className="text-xs text-muted">Guest · progress saved on this device</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-base font-semibold text-accent">{stats?.lifetimeScore ?? 0} pts</span>
          <Link
            href="/account"
            className="text-sm font-medium text-foreground underline decoration-border underline-offset-4"
          >
            Log in
          </Link>
        </div>
      </header>

      <div className="flex flex-col gap-3">
        <ModeCard
          href="/game/article"
          title="De or Het"
          subtitle="Learn the article."
          example="het kantoor"
        />
        <ModeCard
          href="/game/demonstrative"
          title="Deze · Dit · Die · Dat"
          subtitle="Choose the correct demonstrative."
          example="dit kantoor"
        />
        <ModeCard
          href="/game/adjective"
          title="Adjective Ending"
          subtitle="Choose the correct adjective form."
          example="het rustige kantoor"
        />
      </div>

      {stats && stats.weakConcepts > 0 && (
        <Link
          href="/game/weak-review"
          className="flex h-14 w-full items-center justify-center rounded-2xl bg-accent text-base font-semibold text-accent-foreground active:scale-[0.98]"
        >
          Review Weak Words ({stats.weakConcepts})
        </Link>
      )}

      {stats && stats.wordsSeen > 0 && (
        <div className="flex items-center justify-between rounded-2xl border border-border px-4 py-3 text-sm">
          <span className="text-muted">
            <span className="font-semibold text-foreground">{stats.wordsSeen}</span> words seen
          </span>
          <span className="text-muted">
            <span className="font-semibold text-foreground">{stats.conceptsMastered}</span> mastered
          </span>
          <span className="text-muted">
            <span className="font-semibold text-foreground">{stats.accuracy}%</span> accuracy
          </span>
        </div>
      )}

      <Link href="/stats" className="text-center text-sm text-muted underline decoration-border underline-offset-4">
        View full stats
      </Link>
    </div>
  );
}
