import type { AnswerFeedback } from "@/lib/game/useGameSession";

export type AnswerButtonVisualState = "idle" | "selected-correct" | "selected-wrong" | "reveal-correct" | "dimmed";

export function answerButtonState(
  value: string,
  correctAnswer: string,
  selectedAnswer: string | null,
  feedback: AnswerFeedback,
): AnswerButtonVisualState {
  if (feedback === "idle") return "idle";
  const isThisButton = value === selectedAnswer;
  const isCorrectButton = value === correctAnswer;

  if (feedback === "correct") {
    return isThisButton ? "selected-correct" : "dimmed";
  }
  // feedback === "wrong"
  if (isThisButton) return "selected-wrong";
  if (isCorrectButton) return "reveal-correct";
  return "dimmed";
}

const STYLES: Record<AnswerButtonVisualState, string> = {
  idle: "bg-surface border-border text-foreground active:scale-[0.98]",
  "selected-correct": "bg-success border-success text-success-foreground",
  "selected-wrong": "bg-error border-error text-error-foreground",
  "reveal-correct": "bg-white border-success text-success ring-2 ring-success/40",
  dimmed: "bg-surface border-border text-muted opacity-60",
};

export function AnswerButton({
  value,
  state,
  onClick,
  disabled,
}: {
  value: string;
  state: AnswerButtonVisualState;
  onClick: () => void;
  disabled: boolean;
}) {
  const isAnswerState = state === "selected-correct" || state === "selected-wrong";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={state === "selected-correct" || state === "selected-wrong"}
      className={`min-h-14 w-full rounded-2xl border-2 px-4 py-3 text-lg font-semibold uppercase tracking-wide transition-transform duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-default ${STYLES[state]} ${isAnswerState ? "scale-[1.02]" : ""}`}
    >
      {value}
    </button>
  );
}
