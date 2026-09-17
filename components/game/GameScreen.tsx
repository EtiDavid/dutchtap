"use client";

import { useState } from "react";
import { useGameSession } from "@/lib/game/useGameSession";
import type { RouteMode } from "@/lib/game/modes";
import { MasteryDots } from "@/components/ui/MasteryDots";
import { ScoreBar } from "./ScoreBar";
import { QuestionCard } from "./QuestionCard";
import { SessionSummary } from "./SessionSummary";

export function GameScreen({ mode }: { mode: RouteMode }) {
  const {
    current,
    feedback,
    selectedAnswer,
    error,
    sessionScore,
    streak,
    summary,
    currentMasteryLevel,
    endSession,
    submitAnswer,
    continueToNext,
  } = useGameSession(mode);
  const [exited, setExited] = useState(false);

  if (exited) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center">
        <SessionSummary summary={summary} />
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <ScoreBar
        score={sessionScore}
        streak={streak}
        onExit={() => {
          endSession();
          setExited(true);
        }}
      />

      <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 pb-10">
        {current ? (
          <QuestionCard
            question={current.question}
            feedback={feedback}
            selectedAnswer={selectedAnswer}
            onAnswer={submitAnswer}
            onContinue={continueToNext}
          />
        ) : (
          <div className="flex flex-col items-center gap-4 text-center">
            <p className="text-lg font-semibold text-foreground">{error ?? "Loading…"}</p>
            {error && <p className="max-w-xs text-sm text-muted">Answer a few questions first — missed words show up here for focused review.</p>}
          </div>
        )}
      </main>

      {current && (
        <footer className="flex items-center justify-center pb-6">
          <MasteryDots level={currentMasteryLevel} label="Mastery" />
        </footer>
      )}
    </div>
  );
}
