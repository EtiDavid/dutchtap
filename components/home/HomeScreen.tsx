"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loadLocalProgress, type LocalProgressState } from "@/lib/sync/localProgress";
import { computeOverviewStats, type OverviewStats } from "@/lib/stats/overview";
import { useAccount } from "@/lib/auth/useAccount";
import { ModeCard } from "./ModeCard";
import { StreakBadge } from "@/components/practice/StreakBadge";
import { usePracticeStreak } from "@/lib/practice/usePracticeStreak";
import { chooseLanguage, useSavedLanguage } from "@/lib/lang/useLanguage";
import { DEFAULT_LANG, withLang } from "@/lib/lang";
import { LanguageChooser } from "@/components/lang/LanguageChooser";
import { LanguageSwitch } from "@/components/lang/LanguageSwitch";

export function HomeScreen() {
  const { account, loading: accountLoading, logout } = useAccount();
  const { lang: saved, ready: languageReady } = useSavedLanguage();
  const lang = saved ?? DEFAULT_LANG;
  const { streak, practisedToday } = usePracticeStreak(lang);
  const [guestProgress, setGuestProgress] = useState<LocalProgressState | null>(null);
  const [accountStats, setAccountStats] = useState<OverviewStats | null>(null);

  useEffect(() => {
    // localStorage doesn't exist during SSR; reading it in an effect (not a
    // lazy useState initializer) is deliberate so the server-rendered and
    // first-client-render markup match, avoiding a hydration mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGuestProgress(loadLocalProgress());
  }, []);

  useEffect(() => {
    if (!account) return;
    let cancelled = false;
    fetch("/api/stats")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data) setAccountStats(data.overall);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [account]);

  const stats = account
    ? accountStats
    : guestProgress
      ? computeOverviewStats(guestProgress.progressByKey, guestProgress.lifetimeScore, guestProgress.totalCorrect, guestProgress.totalWrong)
      : null;

  // First launch: ask which language to learn before anything else. No Dutch is shown first to someone who wants French.
  if (!languageReady) return <div className="mx-auto min-h-dvh w-full max-w-sm px-6 py-8"><p className="text-muted" role="status">Loading…</p></div>;
  if (!saved) return <LanguageChooser onChoose={chooseLanguage} />;
  const dutch = lang === DEFAULT_LANG;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-sm flex-col gap-8 px-6 py-8" data-lang={lang}>
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xl font-bold text-foreground">DutchTap</p>
          <p className="text-xs text-muted">
            {accountLoading ? "…" : account ? account.username : "Guest · progress saved on this device"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitch lang={lang} onSwitch={chooseLanguage} />
          {dutch && <span className="text-base font-semibold text-accent">{stats?.lifetimeScore ?? 0} pts</span>}
          {!accountLoading &&
            (account ? (
              <button type="button" onClick={() => logout()} className="text-sm font-medium text-foreground underline decoration-border underline-offset-4">
                Log out
              </button>
            ) : (
              <Link href="/account" className="text-sm font-medium text-foreground underline decoration-border underline-offset-4">
                Log in
              </Link>
            ))}
        </div>
      </header>

      <StreakBadge streak={streak} practisedToday={practisedToday} />

      <div className="flex flex-col gap-3">
        <ModeCard href={withLang("/flashcards", lang)} title="Flashcards" subtitle="Study a fixed set, say it from memory, then quiz it." example={dutch ? "Kan ik met de kaart betalen?" : "Puis-je payer par carte ?"} />
        <ModeCard href={withLang("/quiz", lang)} title="Quiz" subtitle="Put the words of your session sentences in order." example={dutch ? "kaart · betalen · ik · kan" : "carte · payer · je · puis"} />
        <ModeCard href={withLang("/vocabulary", lang)} title="Vocabulary" subtitle="Words and expressions from your sentence cards." example={dutch ? "op slot doen · to lock" : "payer · to pay"} />
        {dutch ? <>
          <ModeCard href="/game/article" title="De or Het" subtitle="Learn the article." example="het kantoor" />
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
        </> : <p className="rounded-2xl border border-dashed border-border px-4 py-3 text-sm text-muted" data-testid="dutch-games-note">The de/het, deze/dit and adjective-ending games are Dutch-only. Switch to Nederlands to play them.</p>}
      </div>

      {dutch && stats && stats.weakConcepts > 0 && (
        <Link
          href="/game/weak-review"
          className="flex h-14 w-full items-center justify-center rounded-2xl bg-accent text-base font-semibold text-accent-foreground active:scale-[0.98]"
        >
          Review Weak Words ({stats.weakConcepts})
        </Link>
      )}

      {dutch && stats && stats.wordsSeen > 0 && (
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

      {dutch && (
        <Link href="/stats" className="text-center text-sm text-muted underline decoration-border underline-offset-4">
          View full stats
        </Link>
      )}
    </div>
  );
}
