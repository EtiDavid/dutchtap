const MAX_MASTERY = 5;

export function MasteryDots({ level, label }: { level: number; label?: string }) {
  return (
    <div className="flex items-center gap-1.5" role="img" aria-label={`Mastery ${level} of ${MAX_MASTERY}`}>
      {label && <span className="text-xs text-muted mr-1">{label}</span>}
      {Array.from({ length: MAX_MASTERY }, (_, i) => (
        <span
          key={i}
          aria-hidden="true"
          className={`h-2 w-2 rounded-full ${i < level ? "bg-accent" : "bg-border"}`}
        />
      ))}
    </div>
  );
}
