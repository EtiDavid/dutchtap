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
import {
  loadLocalProgress,
  saveLocalProgress,
  type LocalProgressState,
} from "@/lib/sync/localProgress";

const nounIndex = new Map(NOUNS.map((n) => [n.id, n]));
const allCandidates = buildAllCandidates(NOUNS);

const CORRECT_ADVANCE_DELAY_MS = 450;
const WRONG_ADVANCE_DELAY_MS = 1000;

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

export function useGameSession(mode: GameMode | "weak-review") {
  const [progress, setProgress] = useState<LocalProgressState | null>(null);
  const [current, setCurrent] = useState<{ conceptKey: string; question: GrammarQuestion } | null>(null);
  const [feedback, setFeedback] = useState<AnswerFeedback>("idle");
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sessionStats, setSessionStats] = useState({ answered: 0, correct: 0, wrong: 0 });
  const [streak, setStreak] = useState(0);

  const questionIndexRef = useRef(0);
  const recentConceptKeysRef = useRef<string[]>([]);
  const masteryAtSessionStartRef = useRef<Map<string, number>>(new Map());
  const improvedConceptsRef = useRef<Set<string>>(new Set());
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Load guest progress on mount and start the session.
  useEffect(() => {
    const loaded = loadLocalProgress();
    setProgress(loaded);
    for (const [key, record] of Object.entries(loaded.progressByKey)) {
      masteryAtSessionStartRef.current.set(key, record.masteryLevel);
    }
    nextQuestion(loaded.progressByKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

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
        improvedConceptsRef.current.add(current.conceptKey);
      }

      const updatedProgress: LocalProgressState = {
        ...progress,
        progressByKey: { ...progress.progressByKey, [current.conceptKey]: updatedRecord },
        lifetimeScore: progress.lifetimeScore + (isCorrect ? 1 : 0),
        totalCorrect: progress.totalCorrect + (isCorrect ? 1 : 0),
        totalWrong: progress.totalWrong + (isCorrect ? 0 : 1),
      };

      setProgress(updatedProgress);
      saveLocalProgress(updatedProgress);
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
      conceptsImproved: improvedConceptsRef.current.size,
      weakConceptsRemaining: progress ? countWeakConcepts(progress.progressByKey) : 0,
    }),
    [sessionStats, progress],
  );

  const currentMasteryLevel = current && progress ? (progress.progressByKey[current.conceptKey]?.masteryLevel ?? 0) : 0;

  return {
    current,
    feedback,
    selectedAnswer,
    error,
    lifetimeScore: progress?.lifetimeScore ?? 0,
    sessionScore: sessionStats.correct,
    streak,
    summary,
    currentMasteryLevel,
    submitAnswer,
  };
}
