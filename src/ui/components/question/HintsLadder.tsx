import { useState } from 'react';

interface HintsLadderProps {
  hints: readonly [string, string, string, string];
}

export function HintsLadder({ hints }: HintsLadderProps) {
  const [revealedCount, setRevealedCount] = useState(0);

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
              onClick={() => setRevealedCount((count) => count + 1)}
              className="rounded border border-border bg-bg-raised px-3 py-2 text-left text-sm text-accent transition-colors hover:border-accent"
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
