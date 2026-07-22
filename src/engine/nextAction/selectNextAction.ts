import { orderModulesByDag } from '../roadmap/dag';
import type { CodeQuestion, ModuleId, QuestionId, RoadmapModule, StageType } from '../../content/types';
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

/**
 * The single recommended next thing across the whole app — Triecode UI
 * spec §7. V1 policy: due reviews win; otherwise the first incomplete
 * exercise in ladder order within the first incomplete module in DAG order.
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

  for (const module of orderModulesByDag(snapshot.modules)) {
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
  }

  return { kind: 'none' };
}
