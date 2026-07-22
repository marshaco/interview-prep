interface HintsLadderProps {
  hints: readonly [string, string, string, string];
  revealedCount: number;
  onReveal: () => void;
}

export function HintsLadder({ hints, revealedCount, onReveal }: HintsLadderProps) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold text-text">Hints</h3>
      {hints.map((hint, index) => {
        if (index < revealedCount) {
          return (
            <p key={index} className="rounded border border-border bg-bg-raised p-3 text-sm text-text-muted">
              {hint}
            </p>
          );
        }
        if (index === revealedCount) {
          return (
            <button
              key={index}
              type="button"
              onClick={onReveal}
              className="rounded border border-border bg-bg-raised px-3 py-2 text-left text-sm text-accent transition-colors duration-200 ease-out-motion hover:border-accent hover:bg-bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Show hint {index + 1} of {hints.length}
            </button>
          );
        }
        return null;
      })}
    </div>
  );
}
