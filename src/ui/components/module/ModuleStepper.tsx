import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import { getQuestion } from '../../../content/registry';
import { exerciseHref, isSolved, isStageComplete } from '../../../engine/nextAction/selectNextAction';
import type { Attempt } from '../../../storage/types';
import type { RoadmapModule, Stage, StageItem } from '../../../content/types';

interface ModuleStepperProps {
  module: RoadmapModule;
  attempts: Attempt[];
  isLearnComplete: boolean;
}

type GlyphState = 'completed' | 'current' | 'upcoming';

/** The rail glyph — check / accent dot / hollow dot — same fixed footprint so the connecting rail lines up through all three states. */
function StageGlyph({ state }: { state: GlyphState }) {
  return (
    <span className="flex h-5 w-5 shrink-0 items-center justify-center">
      {state === 'completed' && (
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-success text-[11px] text-white">✓</span>
      )}
      {state === 'current' && <span className="h-2.5 w-2.5 rounded-full bg-accent" />}
      {state === 'upcoming' && <span className="h-2.5 w-2.5 rounded-full border-2 border-border" />}
    </span>
  );
}

function stageQuestionItems(stage: Stage): Extract<StageItem, { type: 'question' }>[] {
  return stage.items.filter((item): item is Extract<StageItem, { type: 'question' }> => item.type === 'question');
}

/** A collapsed stage row that expands to reveal its content — used for both completed stages (so you can always go back and reread/redo them) and upcoming ones. */
function ExpandableStage({
  module,
  stage,
  attempts,
  summary,
  learnLinkLabel,
}: {
  module: RoadmapModule;
  stage: Stage;
  attempts: Attempt[];
  summary: string;
  learnLinkLabel: string;
}) {
  const questionItems = stageQuestionItems(stage);
  return (
    <details className="group rounded border border-border/50 px-4 py-3">
      <summary className="cursor-pointer text-sm text-text-muted marker:text-text-muted">{summary}</summary>
      {stage.type === 'learn' ? (
        <Link
          to={`/modules/${module.id}/learn`}
          className="mt-3 inline-flex rounded border border-border bg-bg-raised px-4 py-2 text-sm text-text transition-colors duration-200 ease-out-motion hover:border-accent hover:bg-bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {learnLinkLabel}
        </Link>
      ) : (
        <div className="mt-3 flex flex-col gap-2">
          {questionItems.map((item, itemIndex) => (
            <ExerciseRow key={item.questionId} moduleId={module.id} stage={stage} item={item} index={itemIndex} attempts={attempts} />
          ))}
        </div>
      )}
    </details>
  );
}

/** One question row — used in both the current stage's list and an upcoming/completed stage's expanded list. */
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

/** Only called once a stage is already known complete — for Learn that's simply "completed"; for exercise stages, the solved count is still worth showing since it's always the full count. */
function stageSummary(stage: Stage, attempts: Attempt[]): string {
  if (stage.type === 'learn') return 'completed';
  const items = stageQuestionItems(stage);
  const solvedCount = items.filter((item) => isSolved(attempts, item.questionId)).length;
  return `${solvedCount} of ${items.length} solved`;
}

/** "4 exercises" / "3 lessons" — for an upcoming stage's collapsed row, distinct per stage instead of a repeated phrase. */
function stageItemCountLabel(stage: Stage): string {
  if (stage.type === 'learn') {
    const count = stage.items.filter((item) => item.type === 'lesson').length;
    return `${count} lesson${count === 1 ? '' : 's'}`;
  }
  const count = stageQuestionItems(stage).length;
  return `${count} exercise${count === 1 ? '' : 's'}`;
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
    <div className="flex flex-col">
      {module.stages.map((stage, index) => {
        const isLastRow = index === module.stages.length - 1;
        const hasContent = stage.items.length > 0;
        const completed = hasContent && isStageComplete(stage, attempts, isLearnComplete);
        const isCurrent = index === currentIndex;
        const glyphState: GlyphState = completed ? 'completed' : isCurrent ? 'current' : 'upcoming';

        let content: ReactNode;

        if (!hasContent) {
          content = (
            <div className="rounded border border-border/50 px-4 py-3 text-sm text-text-muted opacity-60">
              {stage.title} — content coming later on the path
            </div>
          );
        } else if (completed) {
          content = (
            <ExpandableStage
              module={module}
              stage={stage}
              attempts={attempts}
              summary={`${stage.title} — ${stageSummary(stage, attempts)}`}
              learnLinkLabel="Read again →"
            />
          );
        } else if (isCurrent) {
          const questionItems = stageQuestionItems(stage);
          const unsolved = firstUnsolvedItem(stage, attempts);
          const startHref =
            stage.type === 'learn' ? `/modules/${module.id}/learn` : unsolved ? exerciseHref(module.id, stage.type, unsolved.item.questionId, unsolved.index) : `/modules/${module.id}`;
          const startLabel = stage.type === 'learn' ? 'Start →' : 'Continue →';

          content = (
            <section className="rounded-lg border border-accent bg-bg-raised px-4 py-4">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-muted">{stage.title}</h2>
              <Link
                to={startHref}
                className="mb-3 inline-flex rounded bg-accent-solid px-6 py-2.5 text-sm font-medium text-white transition-colors duration-200 ease-out-motion hover:bg-accent-solid/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
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
        } else {
          // Upcoming — quiet but fully open, every item clickable, nothing disabled.
          content = (
            <ExpandableStage
              module={module}
              stage={stage}
              attempts={attempts}
              summary={`${stage.title} · ${stageItemCountLabel(stage)}`}
              learnLinkLabel="Start →"
            />
          );
        }

        return (
          <div key={stage.type} className="flex gap-4">
            <div className="flex flex-col items-center">
              <StageGlyph state={glyphState} />
              {!isLastRow && <div className="w-px flex-1 bg-border" />}
            </div>
            <div className="min-w-0 flex-1 pb-4">{content}</div>
          </div>
        );
      })}
    </div>
  );
}
