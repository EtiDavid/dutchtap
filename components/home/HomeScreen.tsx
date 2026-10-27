"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loadLocalProgress, type LocalProgressState } from "@/lib/sync/localProgress";
import { computeOverviewStats, type OverviewStats } from "@/lib/stats/overview";
import { useAccount } from "@/lib/auth/useAccount";
import { useSessions } from "@/lib/sessions/useSessions";
import { sessionUrl } from "@/lib/sessions/nav";
import { ModeCard, Tile } from "./ModeCard";
import { PatternTiles } from "@/components/sessions/PatternTiles";
import { usePracticeStreak } from "@/lib/practice/usePracticeStreak";
import { streakMessage } from "@/lib/practice/streak";
import { chooseLanguage, useSavedLanguage } from "@/lib/lang/useLanguage";
import { DEFAULT_LANG, withLang } from "@/lib/lang";
import { LanguageChooser } from "@/components/lang/LanguageChooser";
import { LanguageSwitch } from "@/components/lang/LanguageSwitch";
import { AppNav } from "@/components/nav/AppNav";
import { Icon } from "@/components/ui/Icon";
import { Section } from "@/components/ui/PageHeader";

/** Today: where to go next. One clear main action, your streak, and a short map of everything else. */
export function HomeScreen() {
  const { account, loading: accountLoading } = useAccount();
  const { lang: saved, ready: languageReady } = useSavedLanguage();
  const lang = saved ?? DEFAULT_LANG;
  const { streak, practisedToday } = usePracticeStreak(lang);
  const { snapshot } = useSessions();
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
  if (!languageReady) return <div className="mx-auto min-h-dvh w-full max-w-lg px-5 py-8"><p className="text-muted" role="status">Loading…</p></div>;
  if (!saved) return <LanguageChooser onChoose={chooseLanguage} />;
  const dutch = lang === DEFAULT_LANG;

  const resume = snapshot.lastOpened ? snapshot.sessions.find((s) => s.id === snapshot.lastOpened!.id && s.status === "active" && s.lang === lang) : undefined;
  const activeCount = snapshot.sessions.filter((s) => s.status === "active").length;

  return (
    <main className="page-pad mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-7 px-5 pt-6" data-lang={lang}>
      <header className="flex items-center justify-between gap-3">
        <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="DutchTap home">
          <span aria-hidden className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-lg font-black text-white shadow-[0_6px_14px_rgb(194_65_12/.3)]">D</span>
          <span className="text-lg font-bold tracking-tight">DutchTap</span>
        </Link>
        <div className="flex shrink-0 items-center gap-2">
          <LanguageSwitch lang={lang} onSwitch={chooseLanguage} />
          {!accountLoading && (
            <Link href="/account" className="btn !min-h-10 !gap-1.5 !rounded-full !px-3 whitespace-nowrap">
              <Icon name="user" className="h-4 w-4" />
              {account ? account.username : "Log in"}
            </Link>
          )}
        </div>
      </header>

      <section aria-label="Today" className="card-ink flex flex-col gap-5 p-6">
        <div>
          <p className="eyebrow !text-white/60">{practisedToday ? "Nice work today" : "Today"}</p>
          <h1 className="mt-2 text-[1.75rem] font-bold leading-tight tracking-tight">
            {resume ? resume.name : activeCount > 0 ? "Pick up where you left off" : "Ready to practise?"}
          </h1>
          <p className="mt-2 text-[0.9375rem] leading-relaxed text-white/75">
            {resume
              ? `Continue ${snapshot.lastOpened!.mode} — your place is saved.`
              : activeCount > 0
                ? `You have ${activeCount} active ${activeCount === 1 ? "session" : "sessions"}.`
                : "A session is a fixed set of sentences you study, say from memory, and quiz yourself on."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={resume ? sessionUrl(resume.id, snapshot.lastOpened!.mode) : withLang("/flashcards", lang)}
            className="btn btn-primary !min-h-12 !px-5 text-base"
            data-testid="today-primary"
          >
            {resume ? "Continue" : activeCount > 0 ? "Open my sessions" : "Start a session"}
            <Icon name="chevron" className="h-4 w-4" />
          </Link>
          <p data-testid="streak" className="flex items-center gap-2 text-sm text-white/80">
            <Icon name="flame" className={`h-5 w-5 ${streak > 0 ? "text-orange-400" : "text-white/40"}`} filled={streak > 0} />
            <span>{streakMessage(streak, practisedToday)}</span>
          </p>
        </div>
      </section>

      {dutch && stats && stats.wordsSeen > 0 && (
        <dl className="grid grid-cols-3 gap-3 text-center" aria-label="Your numbers">
          {[
            [stats.wordsSeen, "words seen"],
            [stats.conceptsMastered, "mastered"],
            [`${stats.accuracy}%`, "accuracy"],
          ].map(([value, label]) => (
            <div key={label} className="card-flat px-3 py-3.5">
              <dd className="text-xl font-bold tracking-tight">{value}</dd>
              <dt className="mt-0.5 text-xs text-muted">{label}</dt>
            </div>
          ))}
        </dl>
      )}

      {dutch && stats && stats.weakConcepts > 0 && (
        <Link href="/game/weak-review" className="btn btn-primary w-full !min-h-14 text-base">
          Review weak words ({stats.weakConcepts})
        </Link>
      )}

      <Section title="Practise">
        <div className="flex flex-col gap-3">
          <ModeCard href={withLang("/flashcards", lang)} icon="practise" title="Flashcards" subtitle="Study a fixed set, say it from memory, then quiz it." example={dutch ? "Kan ik met de kaart betalen?" : "Puis-je payer par carte ?"} />
          <ModeCard href={withLang("/quiz", lang)} icon="puzzle" title="Quiz" subtitle="Put the words of your session sentences in order." example={dutch ? "kaart · betalen · ik · kan" : "carte · payer · je · puis"} />
          <ModeCard href={withLang("/vocabulary", lang)} icon="book" title="Vocabulary" subtitle="Words and expressions from your sentence cards." example={dutch ? "op slot doen · to lock" : "payer · to pay"} />
        </div>
      </Section>

      {dutch ? (
        <>
          <Section title="Grammar patterns">
            <PatternTiles />
            <ModeCard href="/grammar/mixed" icon="puzzle" title="Mixed grammar" subtitle="Read a Dutch situation and choose the sentence that fits. No hints about the word you need." />
            <ModeCard href="/learn?topic=mixed" icon="mic" title="Think in Dutch" subtitle="Mixed situations. Speak first; use English help when needed." />
          </Section>
          <Section title="Quick grammar games">
            <div className="grid grid-cols-3 gap-3">
              <Tile href="/game/article" icon="spark" title="De or Het" hint="het kantoor" />
              <Tile href="/game/demonstrative" icon="spark" title="Deze · Dit · Die · Dat" hint="dit kantoor" />
              <Tile href="/game/adjective" icon="spark" title="Adjective Ending" hint="-e / –" />
            </div>
          </Section>
        </>
      ) : (
        <p className="card-flat px-4 py-3 text-sm text-muted" data-testid="dutch-games-note">The de/het, deze/dit and adjective-ending games are Dutch-only. Switch to Nederlands to play them.</p>
      )}

      <Link href={withLang("/stats", lang)} className="text-center text-sm font-semibold text-muted underline decoration-border underline-offset-4">
        View full stats
      </Link>
      <AppNav lang={lang} />
    </main>
  );
}
