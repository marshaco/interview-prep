import { useRef, useState } from 'react';

const CAP = 6;

/**
 * The stack Learn lesson's interactive figure (Triecode UI spec §9) — push
 * and pop against local state only, so the LIFO discipline is felt, not just
 * read. `nextValue` counts up so pushes stay visually ordered (1, 2, 3, ...)
 * rather than random noise.
 */
export function StackPushPopFigure() {
  const [stack, setStack] = useState<number[]>([1, 2, 3]);
  const nextValue = useRef(4);

  const isFull = stack.length >= CAP;

  function push() {
    // The cap check and value-consumption happen inside the updater itself
    // (not against the outer `isFull`/`nextValue.current` read at render
    // time), so a burst of clicks before React re-renders can't push past
    // the cap or skip/duplicate a value.
    setStack((prev) => {
      if (prev.length >= CAP) return prev;
      const value = nextValue.current;
      nextValue.current += 1;
      return [...prev, value];
    });
  }

  function pop() {
    setStack((prev) => prev.slice(0, -1));
  }

  return (
    <figure className="my-4 rounded border border-border bg-bg-inset p-4">
      <div className="mb-4 flex items-center gap-3">
        <button
          type="button"
          onClick={push}
          className="rounded bg-accent-solid px-3 py-1.5 text-sm font-medium text-white transition-colors duration-200 ease-out-motion hover:bg-accent-solid/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Push
        </button>
        <button
          type="button"
          onClick={pop}
          disabled={stack.length === 0}
          className="rounded border border-border px-3 py-1.5 text-sm font-medium text-text transition-colors duration-200 ease-out-motion hover:border-accent disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Pop
        </button>
        {isFull && <span className="text-xs text-text-muted">demo cap ({CAP}) reached — pop to push more</span>}
      </div>

      <div className="flex min-h-[52px] items-end gap-2">
        {stack.length === 0 && <p className="text-sm text-text-muted">Empty — push to add the first item.</p>}
        {stack.map((value, index) => {
          const isTop = index === stack.length - 1;
          return (
            <div key={index} className="flex flex-col items-center gap-1">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded border text-sm ${
                  isTop ? 'border-accent bg-bg-raised text-text' : 'border-border bg-bg-raised text-text'
                }`}
              >
                {value}
              </div>
              {isTop && <span className="text-[10px] uppercase tracking-wide text-accent">top</span>}
            </div>
          );
        })}
      </div>
      <figcaption className="mt-3 text-xs text-text-muted">
        Push adds on the right; Pop can only remove from the right — the top is the only reachable end.
      </figcaption>
    </figure>
  );
}
