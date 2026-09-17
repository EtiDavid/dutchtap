export function ScoreBar({ score, streak, onExit }: { score: number; streak: number; onExit: () => void }) {
  return (
    <div className="flex w-full items-center justify-between px-4 py-3">
      <button
        type="button"
        onClick={onExit}
        aria-label="Exit to home"
        className="flex h-11 w-11 items-center justify-center rounded-full text-xl text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
      >
        ←
      </button>
      <div className="flex items-center gap-3">
        {streak >= 3 && (
          <span className="text-sm font-medium text-accent" aria-label={`${streak} in a row`}>
            🔥 {streak}
          </span>
        )}
        <span className="text-base font-semibold text-foreground">Score {score}</span>
      </div>
    </div>
  );
}
