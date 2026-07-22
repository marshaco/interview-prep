import { Link } from 'react-router-dom';

interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
}

/** Consistent not-found/empty-state presentation for dead-end routes and empty lists. */
export function EmptyState({ title, description, actionLabel, actionHref }: EmptyStateProps) {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16 text-center">
      <h1 className="mb-2 text-lg font-semibold text-text">{title}</h1>
      {description && <p className="mb-6 text-sm text-text-muted">{description}</p>}
      {actionLabel && actionHref && (
        <Link
          to={actionHref}
          className="inline-block rounded bg-accent-solid px-4 py-2 text-sm font-medium text-white transition-colors duration-200 ease-out-motion hover:bg-accent-solid/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
