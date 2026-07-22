import { orderModulesByDag } from '../roadmap/dag';
import type { CodeQuestion, ModuleId, QuestionId, RoadmapModule, Stage, StageType } from '../../content/types';
import type { Attempt, ReviewRecord } from '../../storage/types';

export type NextAction =
  | { kind: 'review'; dueCount: number }
  | { kind: 'learn'; moduleId: ModuleId; moduleTitle: string; href: string }
  | { kind: 'exercise'; moduleId: ModuleId; moduleTitle: string; questionId: QuestionId; questionTitle: string; href: string }
  | { kind: 'none' };

export interface ProgressSnapshot {
  modules: RoadmapModule[];
  questions: CodeQuestion[];
  attempts: Attempt[];
  reviewRecords: ReviewRecord[];
  learnCompletions: ReadonlySet<ModuleId>;
  todayIso: string;
}

// Exported for reuse by the Module page's stage stepper (Triecode UI spec §6),
// which needs the same "where does this question live" logic per stage —
// not just for the single globally-recommended next action.
export const STEPPER_STAGE_SLUG: Partial<Record<StageType, string>> = {
  guided_build: 'guided-build',
  guided_apply: 'guided-apply',
};

export function isSolved(attempts: Attempt[], questionId: QuestionId): boolean {
  return attempts.some((a) => a.questionId === questionId && a.scorecard.overall === 100);
}

export function exerciseHref(moduleId: ModuleId, stageType: StageType, questionId: QuestionId, stepIndex: number): string {
  const slug = STEPPER_STAGE_SLUG[stageType];
  return slug ? `/modules/${moduleId}/${slug}/${stepIndex + 1}` : `/questions/${questionId}`;
}

// Exported for reuse by the Module page's stepper, which needs the same
// per-stage completion check to decide collapsed/current/upcoming state.
export function isStageComplete(stage: Stage, attempts: Attempt[], isLearnComplete: boolean): boolean {
  if (stage.items.length === 0) return false;
  if (stage.type === 'learn') return isLearnComplete;
  return stage.items.every((item) => item.type !== 'question' || isSolved(attempts, item.questionId));
}

type ModuleProgress = 'untouched' | 'in-progress' | 'complete';

/** At least one non-empty stage completed, but not every non-empty stage — "some momentum, not finished." */
function moduleProgress(module: RoadmapModule, attempts: Attempt[], learnCompletions: ReadonlySet<ModuleId>): ModuleProgress {
  const isLearnComplete = learnCompletions.has(module.id);
  const nonEmptyStages = module.stages.filter((stage) => stage.items.length > 0);
  if (nonEmptyStages.length === 0) return 'untouched';

  const completedCount = nonEmptyStages.filter((stage) => isStageComplete(stage, attempts, isLearnComplete)).length;
  if (completedCount === 0) return 'untouched';
  if (completedCount === nonEmptyStages.length) return 'complete';
  return 'in-progress';
}

/** The first incomplete step within one module — Learn first, then the first unsolved question in stage/ladder order. Null if the module has nothing incomplete (or nothing at all). */
function nextStepInModule(module: RoadmapModule, snapshot: ProgressSnapshot): NextAction | null {
  const learnStage = module.stages.find((stage) => stage.type === 'learn');
  if (learnStage && learnStage.items.length > 0 && !snapshot.learnCompletions.has(module.id)) {
    return { kind: 'learn', moduleId: module.id, moduleTitle: module.title, href: `/modules/${module.id}/learn` };
  }

  for (const stage of module.stages) {
    if (stage.type === 'learn') continue;
    const questionItems = stage.items.filter((item) => item.type === 'question');
    for (const [index, item] of questionItems.entries()) {
      if (item.type !== 'question' || isSolved(snapshot.attempts, item.questionId)) continue;
      const question = snapshot.questions.find((q) => q.id === item.questionId);
      return {
        kind: 'exercise',
        moduleId: module.id,
        moduleTitle: module.title,
        questionId: item.questionId,
        questionTitle: question?.title ?? item.questionId,
        href: exerciseHref(module.id, stage.type, item.questionId, index),
      };
    }
  }

  return null;
}

/**
 * The single recommended next thing across the whole app — Triecode UI
 * spec §7. V1 policy: due reviews win; otherwise an in-progress module
 * (some stage completed, module not finished) wins over an untouched one,
 * regardless of DAG position — that matches how studying actually works:
 * finish what you started before backfilling earlier modules. DAG order
 * still breaks ties within each group (in-progress vs. untouched), and is
 * the sole ordering when nothing has been started yet.
 *
 * This function only ever recommends — it has no notion of "locked" and
 * no consumer may use its output to disable navigation. Phase 5 replaces
 * the review-urgency policy with the real SM-2-lite due check (already
 * true here) and may add smarter exercise ordering; the signature (a full
 * ProgressSnapshot in, one NextAction out) is designed to absorb that
 * without consumers changing.
 */
export function selectNextAction(snapshot: ProgressSnapshot): NextAction {
  const dueCount = snapshot.reviewRecords.filter((r) => r.dueAt <= snapshot.todayIso).length;
  if (dueCount > 0) {
    return { kind: 'review', dueCount };
  }

  const ordered = orderModulesByDag(snapshot.modules);
  const inProgress = ordered.filter((m) => moduleProgress(m, snapshot.attempts, snapshot.learnCompletions) === 'in-progress');
  const untouched = ordered.filter((m) => moduleProgress(m, snapshot.attempts, snapshot.learnCompletions) === 'untouched');

  for (const module of [...inProgress, ...untouched]) {
    const step = nextStepInModule(module, snapshot);
    if (step) return step;
  }

  return { kind: 'none' };
}
