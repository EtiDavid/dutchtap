"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NOUNS } from "@/data/nouns";
import { ADJECTIVES } from "@/data/adjectives";
import type { GameMode, GrammarQuestion } from "@/lib/grammar/types";
import { applyAnswer } from "@/lib/mastery/repetition";
import type { ProgressRecord } from "@/lib/mastery/types";
import { buildAllCandidates } from "./candidates";
import { generateQuestion } from "./generateQuestion";
import { countWeakConcepts } from "./weakWords";
import { loadLocalProgress, saveLocalProgress } from "@/lib/sync/localProgress";

const nounIndex = new Map(NOUNS.map((n) => [n.id, n]));
const allCandidates = buildAllCandidates(NOUNS);

const CORRECT_ADVANCE_DELAY_MS = 450;
const WRONG_ADVANCE_DELAY_MS = 1000;
const ACCOUNT_SYNC_INTERVAL_MS = 4000;

export type AnswerFeedback = "idle" | "correct" | "wrong";

export type SessionSummary = {
  questionsAnswered: number;
  correct: number;
  wrong: number;
  accuracy: number;
  pointsEarned: number;
  conceptsImproved: number;
  weakConceptsRemaining: number;
};

type ProgressState = {
  progressByKey: Record<string, ProgressRecord>;
  lifetimeScore: number;
  totalCorrect: number;
  totalWrong: number;
};

export function useGameSession(mode: GameMode | "weak-review") {
  const [progress, setProgress] = useState<ProgressState | null>(null);
  const [isAccount, setIsAccount] = useState(false);
  const [current, setCurrent] = useState<{ conceptKey: string; question: GrammarQuestion } | null>(null);
  const [feedback, setFeedback] = useState<AnswerFeedback>("idle");
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sessionStats, setSessionStats] = useState({ answered: 0, correct: 0, wrong: 0 });
  const [streak, setStreak] = useState(0);
  // A Set in state (not a ref) because `summary` reads its size during
  // render (via useMemo) — refs must never be read during render.
  const [improvedConcepts, setImprovedConcepts] = useState<Set<string>>(new Set());

  const questionIndexRef = useRef(0);
  const startedAtRef = useRef(new Date().toISOString());
  const recentConceptKeysRef = useRef<string[]>([]);
  const masteryAtSessionStartRef = useRef<Map<string, number>>(new Map());
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSyncRef = useRef<Map<string, ProgressRecord>>(new Map());
  const latestTotalsRef = useRef({ lifetimeScore: 0, totalCorrect: 0, totalWrong: 0 });
  const isAccountRef = useRef(false);

  const flushSync = useCallback((useBeacon: boolean) => {
    if (!isAccountRef.current || pendingSyncRef.current.size === 0) return;
    // Pull this batch out of the pending queue optimistically, but put any
    // record back if the request actually fails — otherwise a network
    // hiccup silently drops that answer's server-side sync forever (the
    // in-memory session state still has it; only the DB write is lost).
    const batch = pendingSyncRef.current;
    pendingSyncRef.current = new Map();
    const records = Array.from(batch.values());
    const body = JSON.stringify({ records, ...latestTotalsRef.current });

    const requeue = () => {
      for (const [key, record] of batch) {
        if (!pendingSyncRef.current.has(key)) pendingSyncRef.current.set(key, record);
      }
    };

    if (useBeacon && typeof navigator !== "undefined" && navigator.sendBeacon) {
      // sendBeacon fires on page-hide/unload and gives no success signal;
      // if the browser couldn't even queue it, requeue for the next mount.
      const queued = navigator.sendBeacon("/api/progress", new Blob([body], { type: "application/json" }));
      if (!queued) requeue();
    } else {
      fetch("/api/progress", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true })
        .then((res) => {
          if (!res.ok) requeue();
        })
        .catch(requeue);
    }
  }, []);

  const nextQuestion = useCallback(
    (progressByKey: Record<string, ProgressRecord>) => {
      try {
        const generated = generateQuestion({
          mode,
          nounIndex,
          adjectives: ADJECTIVES,
          allCandidates,
          progressByKey,
          currentQuestionIndex: questionIndexRef.current,
          recentConceptKeys: recentConceptKeysRef.current,
        });
        setCurrent(generated);
        setError(null);
        setFeedback("idle");
        setSelectedAnswer(null);
      } catch {
        setCurrent(null);
        setError(mode === "weak-review" ? "No weak words to review yet." : "No questions available.");
      }
    },
    [mode],
  );

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const meRes = await fetch("/api/auth/me");
        if (meRes.ok) {
          const account = await meRes.json();
          const progressRes = await fetch("/api/progress");
          const remote = progressRes.ok
            ? await progressRes.json()
            : { progressByKey: {}, lifetimeScore: account.lifetimeScore, totalCorrect: account.totalCorrect, totalWrong: account.totalWrong };
          if (cancelled) return;
          isAccountRef.current = true;
          setIsAccount(true);
          latestTotalsRef.current = {
            lifetimeScore: remote.lifetimeScore,
            totalCorrect: remote.totalCorrect,
            totalWrong: remote.totalWrong,
          };
          setProgress(remote);
          for (const [key, record] of Object.entries(remote.progressByKey as Record<string, ProgressRecord>)) {
            masteryAtSessionStartRef.current.set(key, record.masteryLevel);
          }
          nextQuestion(remote.progressByKey);
          return;
        }
      } catch {
        // fall through to guest mode
      }

      const loaded = loadLocalProgress();
      if (cancelled) return;
      isAccountRef.current = false;
      setIsAccount(false);
      latestTotalsRef.current = {
        lifetimeScore: loaded.lifetimeScore,
        totalCorrect: loaded.totalCorrect,
        totalWrong: loaded.totalWrong,
      };
      setProgress(loaded);
      for (const [key, record] of Object.entries(loaded.progressByKey)) {
        masteryAtSessionStartRef.current.set(key, record.masteryLevel);
      }
      nextQuestion(loaded.progressByKey);
    }

    init();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // Periodic + on-exit sync for signed-in accounts.
  useEffect(() => {
    const interval = setInterval(() => flushSync(false), ACCOUNT_SYNC_INTERVAL_MS);
    const handleHide = () => flushSync(true);
    document.addEventListener("visibilitychange", handleHide);
    window.addEventListener("pagehide", handleHide);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleHide);
      window.removeEventListener("pagehide", handleHide);
      flushSync(true);
    };
  }, [flushSync]);

  useEffect(() => {
    return () => {
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    };
  }, []);

  const submitAnswer = useCallback(
    (choice: string) => {
      if (!current || !progress || feedback !== "idle") return;

      const isCorrect = choice === current.question.correctAnswer;
      setSelectedAnswer(choice);
      setFeedback(isCorrect ? "correct" : "wrong");
      setStreak((s) => (isCorrect ? s + 1 : 0));

      const existing =
        progress.progressByKey[current.conceptKey] ?? {
          conceptKey: current.conceptKey,
          mode: current.question.mode,
          wordId: current.question.noun.id,
          seen: 0,
          correct: 0,
          wrong: 0,
          currentCorrectStreak: 0,
          bestCorrectStreak: 0,
          masteryLevel: 0 as const,
          lastSeenAt: null,
          lastResult: null,
          priorityBoost: 0,
          scheduledReturnAtQuestion: null,
        };

      const updatedRecord = applyAnswer(existing, isCorrect, questionIndexRef.current);

      if (!masteryAtSessionStartRef.current.has(current.conceptKey)) {
        masteryAtSessionStartRef.current.set(current.conceptKey, 0);
      }
      if (updatedRecord.masteryLevel > (masteryAtSessionStartRef.current.get(current.conceptKey) ?? 0)) {
        const conceptKey = current.conceptKey;
        setImprovedConcepts((prev) => (prev.has(conceptKey) ? prev : new Set(prev).add(conceptKey)));
      }

      const updatedProgress: ProgressState = {
        progressByKey: { ...progress.progressByKey, [current.conceptKey]: updatedRecord },
        lifetimeScore: progress.lifetimeScore + (isCorrect ? 1 : 0),
        totalCorrect: progress.totalCorrect + (isCorrect ? 1 : 0),
        totalWrong: progress.totalWrong + (isCorrect ? 0 : 1),
      };

      setProgress(updatedProgress);
      latestTotalsRef.current = {
        lifetimeScore: updatedProgress.lifetimeScore,
        totalCorrect: updatedProgress.totalCorrect,
        totalWrong: updatedProgress.totalWrong,
      };

      if (isAccountRef.current) {
        pendingSyncRef.current.set(current.conceptKey, updatedRecord);
      } else {
        saveLocalProgress({
          schemaVersion: 1,
          progressByKey: updatedProgress.progressByKey,
          lifetimeScore: updatedProgress.lifetimeScore,
          totalCorrect: updatedProgress.totalCorrect,
          totalWrong: updatedProgress.totalWrong,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      setSessionStats((s) => ({
        answered: s.answered + 1,
        correct: s.correct + (isCorrect ? 1 : 0),
        wrong: s.wrong + (isCorrect ? 0 : 1),
      }));

      recentConceptKeysRef.current = [...recentConceptKeysRef.current, current.conceptKey].slice(-2);
      questionIndexRef.current += 1;

      const delay = isCorrect ? CORRECT_ADVANCE_DELAY_MS : WRONG_ADVANCE_DELAY_MS;
      advanceTimerRef.current = setTimeout(() => nextQuestion(updatedProgress.progressByKey), delay);
    },
    [current, progress, feedback, nextQuestion],
  );

  const summary: SessionSummary = useMemo(
    () => ({
      questionsAnswered: sessionStats.answered,
      correct: sessionStats.correct,
      wrong: sessionStats.wrong,
      accuracy: sessionStats.answered > 0 ? Math.round((sessionStats.correct / sessionStats.answered) * 100) : 0,
      pointsEarned: sessionStats.correct,
      conceptsImproved: improvedConcepts.size,
      weakConceptsRemaining: progress ? countWeakConcepts(progress.progressByKey) : 0,
    }),
    [sessionStats, progress, improvedConcepts],
  );

  const currentMasteryLevel = current && progress ? (progress.progressByKey[current.conceptKey]?.masteryLevel ?? 0) : 0;

  const endSession = useCallback(() => {
    flushSync(true);
    if (!isAccountRef.current || sessionStats.answered === 0) return;
    const body = JSON.stringify({
      mode,
      startedAt: startedAtRef.current,
      endedAt: new Date().toISOString(),
      questions: sessionStats.answered,
      correct: sessionStats.correct,
      wrong: sessionStats.wrong,
      scoreEarned: sessionStats.correct,
      accuracy: sessionStats.answered > 0 ? Math.round((sessionStats.correct / sessionStats.answered) * 100) : 0,
    });
    fetch("/api/sessions", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
  }, [flushSync, mode, sessionStats]);

  return {
    current,
    feedback,
    selectedAnswer,
    error,
    lifetimeScore: progress?.lifetimeScore ?? 0,
    sessionScore: sessionStats.correct,
    streak,
    endSession,
    summary,
    currentMasteryLevel,
    isAccount,
    submitAnswer,
  };
}
