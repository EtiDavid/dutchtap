import { explainQuestion } from "@/lib/grammar/explainQuestion";
import type { GrammarQuestion } from "@/lib/grammar/types";
import { InlineMarkdown } from "@/components/ui/InlineMarkdown";
import { AnswerButton, answerButtonState } from "./AnswerButton";
import type { AnswerFeedback } from "@/lib/game/useGameSession";

function ModeLabel({ question }: { question: GrammarQuestion }) {
  if (question.mode === "article") return <span>DE OF HET</span>;
  if (question.mode === "demonstrative") return <span>DEZE · DIT · DIE · DAT</span>;
  return <span>ADJECTIVE ENDING</span>;
}

function DistanceBadge({ distance }: { distance: "near" | "far" }) {
  const isNear = distance === "near";
  return (
    <div className="flex items-center justify-center gap-2 text-sm font-medium text-muted" aria-live="off">
      <span aria-hidden="true">{isNear ? "📍" : "➡"}</span>
      <span className="uppercase tracking-wide">{isNear ? "Near" : "Far"}</span>
      <span className="text-muted/70">{isNear ? "dichtbij" : "ver weg"}</span>
    </div>
  );
}

export function QuestionCard({
  question,
  feedback,
  selectedAnswer,
  onAnswer,
  onContinue,
}: {
  question: GrammarQuestion;
  feedback: AnswerFeedback;
  selectedAnswer: string | null;
  onAnswer: (value: string) => void;
  onContinue: () => void;
}) {
  const disabled = feedback !== "idle";
  const gridCols = question.mode === "demonstrative" ? "grid-cols-2" : "grid-cols-2";

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <p className="text-xs font-semibold tracking-[0.2em] text-muted">
        <ModeLabel question={question} />
      </p>

      <div className="flex flex-col items-center gap-2 text-center">
        {question.mode === "adjective" ? (
          <p className="text-3xl font-bold text-foreground sm:text-4xl">
            {question.determinerWord} ___ {question.isPlural ? question.noun.plural : question.noun.singular}
          </p>
        ) : (
          <p className="text-4xl font-bold text-foreground sm:text-5xl">{question.displayWord}</p>
        )}
        <p className="text-base text-muted">{question.mode === "adjective" ? question.englishHint : question.englishHint}</p>
      </div>

      {question.mode === "demonstrative" && <DistanceBadge distance={question.distance} />}

      <div aria-live="polite" className="min-h-6 px-4 text-center text-sm text-muted">
        {/* Shown on both a miss (the correction) and a correct guess (the
            reasoning) — getting it right by luck should still teach the
            rule, not just award a point. */}
        {feedback !== "idle" && <InlineMarkdown text={explainQuestion(question)} />}
      </div>

      <div className={`grid w-full max-w-sm gap-3 ${gridCols}`}>
        {question.options.map((option) => (
          <AnswerButton
            key={option}
            value={option}
            state={answerButtonState(option, question.correctAnswer, selectedAnswer, feedback)}
            onClick={() => onAnswer(option)}
            disabled={disabled}
          />
        ))}
      </div>

      {feedback === "correct" && (
        <p className="text-lg font-semibold text-success" aria-live="polite">
          +1
        </p>
      )}

      {feedback !== "idle" && (
        <button
          type="button"
          onClick={onContinue}
          autoFocus
          className={`h-12 w-full max-w-sm rounded-2xl text-base font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
            feedback === "correct" ? "bg-success text-success-foreground" : "bg-foreground text-background"
          }`}
        >
          {feedback === "correct" ? "Continue" : "Okay, got it"}
        </button>
      )}
    </div>
  );
}
