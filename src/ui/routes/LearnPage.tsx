import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getModule } from '../../content/registry';
import { storageAdapter } from '../storageAdapter';
import { MarkdownContent } from '../components/common/MarkdownContent';
import { StaticSequenceDiagram } from '../components/viz/StaticSequenceDiagram';
import { InteractiveFigure } from '../components/viz/InteractiveFigure';
import { EmptyState } from '../components/common/EmptyState';
import { FocusShell } from '../components/shell/FocusShell';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export function LearnPage() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const navigate = useNavigate();
  const module = moduleId ? getModule(moduleId) : undefined;
  useDocumentTitle(module ? `${module.title}: Learn` : 'Learn');
  const learnStage = module?.stages.find((stage) => stage.type === 'learn');
  const nextStage = module?.stages.find((stage) => stage.type === 'guided_build' || stage.type === 'guided_apply');

  const lessons = (learnStage?.items ?? []).filter((item) => item.type === 'lesson');

  const [currentIndex, setCurrentIndex] = useState(0);
  // Reset to the first lesson when navigating between different modules'
  // Learn pages without a full remount (route param changes in place).
  const [renderedModuleId, setRenderedModuleId] = useState(module?.id);
  if (module && module.id !== renderedModuleId) {
    setRenderedModuleId(module.id);
    setCurrentIndex(0);
  }

  if (!module || !learnStage || lessons.length === 0) {
    return (
      <EmptyState
        title="Learn content not found"
        description="This module doesn't exist, or has no Learn stage yet."
        actionLabel="← Back to home"
        actionHref="/"
      />
    );
  }

  const nextHref = nextStage
    ? `/modules/${module.id}/${nextStage.type === 'guided_build' ? 'guided-build' : 'guided-apply'}/1`
    : `/modules/${module.id}`;

  const clampedIndex = Math.min(currentIndex, lessons.length - 1);
  const currentItem = lessons[clampedIndex];
  const isLastLesson = clampedIndex === lessons.length - 1;

  const resolvedModuleId = module.id;
  async function completeAndAdvance() {
    await storageAdapter.markLearnComplete(resolvedModuleId);
    void navigate(nextHref);
  }

  return (
    <FocusShell backHref={`/modules/${module.id}`} backLabel="Back to module" title={`${module.title}: Learn`}>
      <div className="h-full overflow-y-auto">
        <div className="mx-auto max-w-[720px] px-6 py-10">
          <p className="mb-6 text-sm text-text-muted">{module.summary}</p>

          <ol className="mb-8 flex items-center gap-1">
            {lessons.map((item, index) => {
              if (item.type !== 'lesson') return null;
              const isCurrent = index === clampedIndex;
              const isDone = index < clampedIndex;
              return (
                <li key={item.lesson.id} className="flex flex-1 items-center gap-1 last:flex-none">
                  <button
                    type="button"
                    onClick={() => setCurrentIndex(index)}
                    className={`flex items-center gap-2 rounded px-1.5 py-1 text-left text-xs transition-colors duration-200 ease-out-motion focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                      isCurrent ? 'text-accent' : 'text-text-muted hover:text-text'
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-medium ${
                        isDone
                          ? 'border-success bg-success text-white'
                          : isCurrent
                            ? 'border-accent text-accent'
                            : 'border-border text-text-muted'
                      }`}
                    >
                      {isDone ? '✓' : index + 1}
                    </span>
                    <span className="hidden truncate sm:inline">{item.lesson.title}</span>
                  </button>
                  {index < lessons.length - 1 && <span aria-hidden className="h-px flex-1 bg-border" />}
                </li>
              );
            })}
          </ol>

          {currentItem?.type === 'lesson' && (
            <article className="flex flex-col gap-4">
              {currentItem.lesson.interactiveFigure ? (
                <InteractiveFigure binding={currentItem.lesson.interactiveFigure} />
              ) : (
                currentItem.lesson.diagram && <StaticSequenceDiagram {...currentItem.lesson.diagram} />
              )}
              <MarkdownContent>{currentItem.lesson.body}</MarkdownContent>
            </article>
          )}

          {isLastLesson ? (
            <button
              type="button"
              onClick={() => void completeAndAdvance()}
              className="mt-8 block w-full rounded bg-accent-solid px-4 py-3 text-center text-sm font-medium text-white transition-colors duration-200 ease-out-motion hover:bg-accent-solid/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Mark Learn complete — start {nextStage?.title ?? 'guided build'} →
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setCurrentIndex(clampedIndex + 1)}
              className="mt-8 block w-full rounded border border-border px-4 py-3 text-center text-sm font-medium text-text transition-colors duration-200 ease-out-motion hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Continue →
            </button>
          )}
        </div>
      </div>
    </FocusShell>
  );
}
