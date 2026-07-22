import { Link, useParams } from 'react-router-dom';
import { getModule } from '../../content/registry';
import { MarkdownContent } from '../components/common/MarkdownContent';
import { StaticSequenceDiagram } from '../components/viz/StaticSequenceDiagram';
import { EmptyState } from '../components/common/EmptyState';
import { FocusShell } from '../components/shell/FocusShell';

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

  const lessons = learnStage.items.filter((item) => item.type === 'lesson');

  return (
    <FocusShell backHref={`/modules/${module.id}`} backLabel="Back to module" title={`${module.title}: Learn`}>
      <div className="h-full overflow-y-auto">
        <div className="mx-auto max-w-3xl px-6 py-10">
      <p className="mb-6 text-sm text-text-muted">{module.summary}</p>

      {lessons.length > 1 && (
        <nav aria-label="Lessons in this stage" className="mb-8 rounded border border-border bg-bg-raised p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">On this page</p>
          <ol className="ml-5 list-decimal text-sm text-text-muted">
            {lessons.map((item) =>
              item.type === 'lesson' ? (
                <li key={item.lesson.id} className="mb-1">
                  <a href={`#${item.lesson.id}`} className="hover:text-accent">
                    {item.lesson.title}
                  </a>
                </li>
              ) : null,
            )}
          </ol>
        </nav>
      )}

      <div className="flex flex-col gap-8">
        {lessons.map((item, index) =>
          item.type === 'lesson' ? (
            <article key={item.lesson.id} id={item.lesson.id} className="scroll-mt-6 rounded-lg border border-border bg-bg-raised p-6">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-accent">
                Lesson {index + 1} of {lessons.length}
              </p>
              {item.lesson.diagram && <StaticSequenceDiagram {...item.lesson.diagram} />}
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
      </div>
    </FocusShell>
  );
}
