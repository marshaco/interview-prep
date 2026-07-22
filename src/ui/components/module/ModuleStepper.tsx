import { Link } from 'react-router-dom';
import { getQuestion } from '../../../content/registry';
import { exerciseHref, isSolved } from '../../../engine/nextAction/selectNextAction';
import type { Attempt } from '../../../storage/types';
import type { RoadmapModule, Stage, StageItem } from '../../../content/types';

interface ModuleStepperProps {
  module: RoadmapModule;
  attempts: Attempt[];
  isLearnComplete: boolean;
}

function stageQuestionItems(stage: Stage): Extract<StageItem, { type: 'question' }>[] {
  return stage.items.filter((item): item is Extract<StageItem, { type: 'question' }> => item.type === 'question');
}

function isStageComplete(stage: Stage, attempts: Attempt[], isLearnComplete: boolean): boolean {
  if (stage.items.length === 0) return false;
  if (stage.type === 'learn') return isLearnComplete;
  return stageQuestionItems(stage).every((item) => isSolved(attempts, item.questionId));
}

/** One question row — used in both the current stage's list and an upcoming stage's expanded list. */
function ExerciseRow({
  moduleId,
  stage,
  item,
  index,
  attempts,
}: {
  moduleId: string;
  stage: Stage;
  item: Extract<StageItem, { type: 'question' }>;
  index: number;
  attempts: Attempt[];
}) {
  const question = getQuestion(item.questionId);
  const solved = isSolved(attempts, item.questionId);
  return (
    <Link
      to={exerciseHref(moduleId, stage.type, item.questionId, index)}
      className="flex items-center justify-between rounded border border-border bg-bg-raised px-4 py-2.5 text-sm text-text transition-colors duration-200 ease-out-motion hover:border-accent hover:bg-bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <span>{question?.title ?? item.questionId}</span>
      {solved && <span className="text-success">✓</span>}
    </Link>
  );
}

function stageSummary(stage: Stage, attempts: Attempt[], isLearnComplete: boolean): string {
  if (stage.type === 'learn') return isLearnComplete ? 'completed' : 'not started';
  const items = stageQuestionItems(stage);
  const solvedCount = items.filter((item) => isSolved(attempts, item.questionId)).length;
  return `${solvedCount} of ${items.length} solved`;
}

function firstUnsolvedItem(stage: Stage, attempts: Attempt[]): { item: Extract<StageItem, { type: 'question' }>; index: number } | null {
  const items = stageQuestionItems(stage);
  const index = items.findIndex((item) => !isSolved(attempts, item.questionId));
  const item = items[index];
  return index === -1 || !item ? null : { item, index };
}

export function ModuleStepper({ module, attempts, isLearnComplete }: ModuleStepperProps) {
  let currentIndex = -1;
  for (const [index, stage] of module.stages.entries()) {
    if (stage.items.length === 0) continue;
    if (!isStageComplete(stage, attempts, isLearnComplete)) {
      currentIndex = index;
      break;
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {module.stages.map((stage, index) => {
        if (stage.items.length === 0) {
          return (
            <div key={stage.type} className="rounded border border-border/50 px-4 py-3 text-sm text-text-muted opacity-60">
              {stage.title} — content coming later on the path
            </div>
          );
        }

        const completed = isStageComplete(stage, attempts, isLearnComplete);
        if (completed) {
          return (
            <div
              key={stage.type}
              className="flex items-center gap-2 rounded border border-border/50 px-4 py-2.5 text-sm text-text-muted"
            >
              <span className="text-success">✓</span>
              <span>
                {stage.title} — {stageSummary(stage, attempts, isLearnComplete)}
              </span>
            </div>
          );
        }

        if (index === currentIndex) {
          const questionItems = stageQuestionItems(stage);
          const unsolved = firstUnsolvedItem(stage, attempts);
          const startHref =
            stage.type === 'learn' ? `/modules/${module.id}/learn` : unsolved ? exerciseHref(module.id, stage.type, unsolved.item.questionId, unsolved.index) : `/modules/${module.id}`;
          const startLabel = stage.type === 'learn' ? 'Start Learn →' : 'Continue →';

          return (
            <section key={stage.type} className="rounded-lg border border-accent bg-bg-raised px-4 py-4">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-muted">{stage.title}</h2>
              <Link
                to={startHref}
                className="mb-3 block rounded bg-accent-solid px-4 py-2.5 text-center text-sm font-medium text-white transition-colors duration-200 ease-out-motion hover:bg-accent-solid/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                {startLabel}
              </Link>
              {questionItems.length > 0 && (
                <div className="flex flex-col gap-2">
                  {questionItems.map((item, itemIndex) => (
                    <ExerciseRow
                      key={item.questionId}
                      moduleId={module.id}
                      stage={stage}
                      item={item}
                      index={itemIndex}
                      attempts={attempts}
                    />
                  ))}
                </div>
              )}
            </section>
          );
        }

        // Upcoming — quiet but fully open, every item clickable, nothing disabled.
        const questionItems = stageQuestionItems(stage);
        return (
          <details key={stage.type} className="group rounded border border-border/50 px-4 py-3">
            <summary className="cursor-pointer text-sm text-text-muted marker:text-text-muted">
              {stage.title} — later on the path
            </summary>
            {stage.type === 'learn' ? (
              <Link
                to={`/modules/${module.id}/learn`}
                className="mt-3 block rounded border border-border bg-bg-raised px-4 py-2.5 text-sm text-text transition-colors duration-200 ease-out-motion hover:border-accent hover:bg-bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                Start Learn →
              </Link>
            ) : (
              <div className="mt-3 flex flex-col gap-2">
                {questionItems.map((item, itemIndex) => (
                  <ExerciseRow
                    key={item.questionId}
                    moduleId={module.id}
                    stage={stage}
                    item={item}
                    index={itemIndex}
                    attempts={attempts}
                  />
                ))}
              </div>
            )}
          </details>
        );
      })}
    </div>
  );
}
