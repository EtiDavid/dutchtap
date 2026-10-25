"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { NOUNS } from "@/data/nouns";
import { loadLocalProgress } from "@/lib/sync/localProgress";
import { computeDetailedStats, type DetailedStats } from "@/lib/stats/detailed";
import { useAccount } from "@/lib/auth/useAccount";
import { MODE_TITLES } from "@/lib/game/modes";
import { countByLevel } from "@/lib/flashcards/engine";
import { cardsFor } from "@/lib/content/cards";
import { useReviews } from "@/lib/flashcards/useReviews";
import { usePracticeStreak } from "@/lib/practice/usePracticeStreak";
import { chooseLanguage, useSavedLanguage } from "@/lib/lang/useLanguage";
import { DEFAULT_LANG, LANG_INFO } from "@/lib/lang";
import { LanguageSwitch } from "@/components/lang/LanguageSwitch";
import { LevelBar } from "@/components/flashcards/LevelBar";
import { StreakBadge } from "@/components/practice/StreakBadge";
import { FeedbackSettings } from "@/components/practice/QuizFeedback";
import { AppNav } from "@/components/nav/AppNav";
import { Icon } from "@/components/ui/Icon";
import { PageHeader, Section } from "@/components/ui/PageHeader";
import { button } from "@/components/flashcards/styles";

const nounIndex = new Map(NOUNS.map((n) => [n.id, n]));

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-2.5 last:border-b-0">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-sm font-semibold text-foreground">{value}</span>
    </div>
  );
}

/** Progress: how well you know your cards, your streak, your game statistics, and your account — everything about "how am I doing". */
export function StatsScreen() {
  const { account, loading: accountLoading, logout } = useAccount();
  const saved = useSavedLanguage();
  const lang = saved.lang ?? DEFAULT_LANG;
  const reviewsApi = useReviews(lang);
  const { streak, practisedToday } = usePracticeStreak(lang);
  const levels = countByLevel(cardsFor(lang), reviewsApi.reviews);
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
    // localStorage read: must happen post-mount (see HomeScreen for why),
    // and this branch is also gated on account/accountLoading changing.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStats(computeDetailedStats(records, nounIndex, local.lifetimeScore, local.totalCorrect, local.totalWrong));
  }, [account, accountLoading]);

  return (
    <main className="page-pad mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-6 px-5 pt-6">
      <PageHeader eyebrow="Progress" title="How you're doing" subtitle="Your levels, streak and results, kept separately for each language." action={<LanguageSwitch lang={lang} onSwitch={chooseLanguage} />} />

      <StreakBadge streak={streak} practisedToday={practisedToday} />

      <Section title={`Your ${LANG_INFO[lang].english} cards`} label="Card levels">
        <LevelBar counts={levels} />
        <p className="text-xs leading-relaxed text-muted">Levels belong to the sentences, not to a session. They only change when you rate a card in Speaking. {reviewsApi.status}</p>
        {reviewsApi.guestAvailable && <button type="button" className={button} onClick={reviewsApi.copyGuest}>Copy my guest card levels to this account</button>}
      </Section>

      <Section title="Account" label="Account">
        <div className="card flex items-center gap-4 p-4">
          <span aria-hidden className="flex h-11 w-11 items-center justify-center rounded-full bg-accent-soft text-accent"><Icon name="user" className="h-5 w-5" /></span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{accountLoading ? "…" : account ? account.username : "Guest"}</p>
            <p className="text-sm text-muted">{account ? "Your sessions and levels sync across devices." : "Progress is saved on this device. Log in to keep it on your account."}</p>
          </div>
          {!accountLoading && (account
            ? <button type="button" className={`${button} !min-h-10`} onClick={() => logout()}>Log out</button>
            : <Link href="/account" className={`${button} !min-h-10`}>Log in</Link>)}
        </div>
      </Section>

      {lang === DEFAULT_LANG && <Section title="Grammar games" label="Grammar games">
      {!stats ? (
        <p className="text-center text-sm text-muted">Loading…</p>
      ) : stats.overall.wordsSeen === 0 ? (
        <p className="text-center text-sm text-muted">Play a round to start building stats.</p>
      ) : (
        <>
          <section className="card px-4 py-1">
            <p className="eyebrow pt-3 pb-1">Overall</p>
            <StatRow label="Lifetime score" value={stats.overall.lifetimeScore} />
            <StatRow label="Words seen" value={stats.overall.wordsSeen} />
            <StatRow label="Concepts mastered" value={stats.overall.conceptsMastered} />
            <StatRow label="Concepts learning" value={stats.overall.conceptsLearning} />
            <StatRow label="Weak concepts" value={stats.overall.weakConcepts} />
            <StatRow label="Overall accuracy" value={`${stats.overall.accuracy}%`} />
          </section>

          <section className="flex flex-col gap-3">
            <p className="eyebrow">Per mode</p>
            {stats.perMode.map((m) => (
              <div key={m.mode} className="card px-4 py-1">
                <p className="px-0 pt-3 pb-1 text-sm font-semibold text-foreground">{MODE_TITLES[m.mode]}</p>
                <StatRow label="Questions answered" value={m.questionsAnswered} />
                <StatRow label="Accuracy" value={`${m.accuracy}%`} />
                <StatRow label="Mastered" value={m.masteredConcepts} />
                <StatRow label="Weak" value={m.weakConcepts} />
              </div>
            ))}
          </section>

          {stats.troubleList.length > 0 && (
            <section className="card px-4 py-3">
              <p className="eyebrow pb-2">Trouble list</p>
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
      </Section>}
      {lang === DEFAULT_LANG && <FeedbackSettings />}
      <AppNav lang={lang} />
    </main>
  );
}
