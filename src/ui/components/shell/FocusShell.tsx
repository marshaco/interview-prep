import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';

interface FocusShellProps {
  /** A route to navigate to. Ignored when `onBack` is provided. */
  backHref?: string;
  /** In-page action instead of navigation — e.g. ending a review session without losing its in-progress summary state. Takes priority over `backHref`. */
  onBack?: () => void;
  /** Full link text after the arrow — e.g. "Back to module", "Dashboard", "End session". */
  backLabel: ReactNode;
  title?: ReactNode;
  headerRight?: ReactNode;
  /** Thin strip below the header, above the content — e.g. Review's progress bar. */
  subHeader?: ReactNode;
  children: ReactNode;
}

/**
 * The collapsed-nav shell: a single "← {backLabel}" link, a centered
 * context title, content owns the full viewport. Used by "do the work"
 * screens — Learn and the problem editor — where persistent nav chrome
 * would compete with the task at hand.
 */
export function FocusShell({ backHref, onBack, backLabel, title, headerRight, subHeader, children }: FocusShellProps) {
  return (
    <div className="flex h-screen flex-col bg-bg text-text">
      <header className="flex items-center justify-between border-b border-border bg-bg-inset px-4 py-2">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="text-sm text-text-muted transition-colors duration-200 ease-out-motion hover:text-accent"
          >
            ← {backLabel}
          </button>
        ) : (
          <Link
            to={backHref ?? '/'}
            className="text-sm text-text-muted transition-colors duration-200 ease-out-motion hover:text-accent"
          >
            ← {backLabel}
          </Link>
        )}
        {title && <h1 className="truncate text-sm font-semibold text-text">{title}</h1>}
        {headerRight ?? <span />}
      </header>
      {subHeader}
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}
