import { selectNextAction } from '../nextAction/selectNextAction';
import type { CodeQuestion, ModuleId, QuestionId, RoadmapModule } from '../../content/types';
import type { Attempt } from '../../storage/types';

// Safety cap against a runaway loop bug — far above any realistic catalog
// size (the full 18-module V1 catalog has on the order of a few hundred
// exercises), never a real limit in practice.
const MAX_WORK_ITEMS = 2000;

export type PlanWorkItem =
  | { kind: 'learn'; moduleId: ModuleId }
  | { kind: 'exercise'; moduleId: ModuleId; questionId: QuestionId; title: string };

function fakePassingAttempt(questionId: QuestionId): Attempt {
  return {
    id: `plan-sim-${questionId}`,
    questionId,
    code: '',
    scorecard: {
      questionId,
      correctness: { correct: 1, total: 1 },
      edgeCases: { correct: 1, total: 1 },
      overall: 100,
      failures: [],
      style: null,
      readability: null,
      complexity: null,
    },
    hintsUsed: 0,
    durationMs: 0,
    createdAt: '1970-01-01T00:00:00.000Z',
    context: 'practice',
  };
}

/**
 * The full remaining "new content" backlog for a scope, in exactly the
 * order `selectNextAction` would recommend one item at a time (Study plan
 * spec §3) — built by literally re-running `selectNextAction` against a
 * snapshot that incrementally "completes" each item, rather than
 * re-deriving a second ordering policy that could drift from the one
 * Home's hero already uses. `reviewStates` is always empty here: review
 * urgency is handled separately by the day-by-day simulation
 * (`projectPlan`, driving the real scheduler), not this ordering.
 */
export function remainingWorkItems(
  scopedModules: RoadmapModule[],
  questions: CodeQuestion[],
  attempts: Attempt[],
  learnCompletions: ReadonlySet<ModuleId>,
  todayIso: string,
): PlanWorkItem[] {
  const items: PlanWorkItem[] = [];
  let simulatedAttempts = attempts;
  let simulatedLearnCompletions = learnCompletions;

  for (let i = 0; i < MAX_WORK_ITEMS; i++) {
    const action = selectNextAction({
      modules: scopedModules,
      questions,
      attempts: simulatedAttempts,
      reviewStates: [],
      learnCompletions: simulatedLearnCompletions,
      todayIso,
    });

    if (action.kind === 'none' || action.kind === 'review') break;

    if (action.kind === 'learn') {
      items.push({ kind: 'learn', moduleId: action.moduleId });
      simulatedLearnCompletions = new Set([...simulatedLearnCompletions, action.moduleId]);
    } else {
      items.push({ kind: 'exercise', moduleId: action.moduleId, questionId: action.questionId, title: action.questionTitle });
      simulatedAttempts = [...simulatedAttempts, fakePassingAttempt(action.questionId)];
    }
  }

  return items;
}
