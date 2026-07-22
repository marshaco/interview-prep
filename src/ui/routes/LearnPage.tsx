import { Link, useParams } from 'react-router-dom';
import { getModule } from '../../content/registry';
import { MarkdownContent } from '../components/common/MarkdownContent';
import { EmptyState } from '../components/common/EmptyState';

export function LearnPage() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const module = moduleId ? getModule(moduleId) : undefined;
  const learnStage = module?.stages.find((stage) => stage.type === 'learn');
  const nextStage = module?.stages.find((stage) => stage.type === 'guided_build' || stage.type === 'guided_apply');

  if (!module || !learnStage) {
    return (
      <EmptyState
        title="Learn content not found"
        description="This module doesn't exist, or has no Learn stage yet."
        actionLabel="← Back to roadmap"
        actionHref="/"
      />
    );
  }

  const nextHref = nextStage
    ? `/modules/${module.id}/${nextStage.type === 'guided_build' ? 'guided-build' : 'guided-apply'}/1`
    : `/modules/${module.id}`;

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <Link
        to={`/modules/${module.id}`}
        className="text-sm text-text-muted transition-colors duration-200 ease-out-motion hover:text-accent"
      >
        ← Back to module
      </Link>
      <h1 className="mb-1 mt-4 text-xl font-semibold text-text">{module.title}: Learn</h1>
      <p className="mb-8 text-sm text-text-muted">{module.summary}</p>
      <div className="flex flex-col gap-8">
        {learnStage.items.map((item) =>
          item.type === 'lesson' ? (
            <article key={item.lesson.id} className="rounded border border-border bg-bg-raised p-5">
              <MarkdownContent>{item.lesson.body}</MarkdownContent>
            </article>
          ) : null,
        )}
      </div>
      <Link
        to={nextHref}
        className="mt-8 inline-block rounded bg-accent-solid px-4 py-2 text-sm font-medium text-white transition-colors duration-200 ease-out-motion hover:bg-accent-solid/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        Continue to {nextStage?.title ?? 'module'} →
      </Link>
    </div>
  );
}
