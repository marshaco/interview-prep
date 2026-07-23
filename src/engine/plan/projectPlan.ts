import { resolveScopeModuleIds, type PlanScope } from './scope';
import { remainingWorkItems, type PlanWorkItem } from './workItems';
import { estimateMinutes } from './estimate';
import { scheduleReview, enterReview } from '../srs/scheduler';
import { addDaysIso, localDateIso } from '../srs/streaks';
import type { CodeQuestion, ModuleId, RoadmapModule } from '../../content/types';
import type { Attempt, ReviewState } from '../../storage/types';

export const LEARN_STAGE_MINUTES = 15; // flat per Learn stage, not per lesson (Study plan spec §2)
export const DEFAULT_HORIZON_DAYS = 730; // ~2 years — generous cap so infeasibility can actually be detected

// Review cost is estimatedMinutes * 0.6, which is not always exactly
// representable in floating point (e.g. 18 * 0.6 === 10.799999999999999) —
// without this tolerance, an item that should fit a budget exactly could be
// wrongly deferred a day by a `cost > budget` comparison that's off by a
// fraction of a millisecond's worth of a minute.
const BUDGET_EPSILON = 1e-6;

export interface PlanInputs {
  scope: PlanScope;
  minutesPerDay: number;
  activeDays: [boolean, boolean, boolean, boolean, boolean, boolean, boolean]; // Sun-Sat, matches Date#getDay()
}

export interface PlanContent {
  modules: RoadmapModule[];
  questions: CodeQuestion[];
}

export interface PlanProgress {
  attempts: Attempt[];
  learnCompletions: ReadonlySet<ModuleId>;
}

export type DayPlanItem =
  | { kind: 'review'; moduleId: ModuleId; questionId: string }
  | PlanWorkItem;

export interface DayLoad {
  dateIso: string; // YYYY-MM-DD, local
  isActiveDay: boolean;
  reviewCount: number;
  reviewMinutes: number;
  newCount: number;
  newMinutes: number;
  items: DayPlanItem[];
}

export interface Projection {
  /** The calendar date the in-scope new-content backlog is fully solved, or null if not reached within `horizonDays`. Reviews continue indefinitely in real life and are not part of "finished." */
  finishDateIso: string | null;
  dailyLoad: DayLoad[];
  /** Total minutes of *new* content remaining, at the projection's start — reviews are perpetual and have no finite total. */
  totalRemainingMinutes: number;
}

function weekdayOf(dateIso: string): number {
  const [year, month, day] = dateIso.split('-').map(Number);
  return new Date(year ?? 0, (month ?? 1) - 1, day ?? 0).getDay();
}

/**
 * Simulates a plan day by day from `now` (Study plan spec §3): each active
 * day spends its minute budget on due reviews first (at review cost, most
 * overdue first), then remaining budget on the in-scope new-content
 * backlog in `selectNextAction` order (at practice cost). Every simulated
 * solve is assumed a clean, not-fast pass and — if the exercise is
 * reviewable — enters the same pure review scheduler used everywhere else
 * (`enterReview`/`scheduleReview`), so future review load is *projected*,
 * never separately estimated. Pure and clock-free: everything needed is a
 * parameter, nothing is read from storage or `Date.now()` internally.
 */
export function projectPlan(
  plan: PlanInputs,
  progress: PlanProgress,
  reviewStates: ReviewState[],
  content: PlanContent,
  now: string,
  horizonDays: number = DEFAULT_HORIZON_DAYS,
): Projection {
  const scopeIds = resolveScopeModuleIds(plan.scope, content.modules);
  const scopedModules = content.modules.filter((m) => scopeIds.has(m.id));
  const scopedQuestionIds = new Set(
    scopedModules.flatMap((m) => m.stages.flatMap((s) => s.items.filter((i) => i.type === 'question').map((i) => i.questionId))),
  );
  const questionsById = new Map(content.questions.map((q) => [q.id, q]));
  const today = localDateIso(new Date(now));

  let backlog = remainingWorkItems(scopedModules, content.questions, progress.attempts, progress.learnCompletions, today);
  const totalRemainingMinutes = backlog.reduce((sum, item) => {
    if (item.kind === 'learn') return sum + LEARN_STAGE_MINUTES;
    const question = questionsById.get(item.questionId);
    return sum + (question ? estimateMinutes(question, [], 'practice') : 0);
  }, 0);

  let simulatedReviewStates = reviewStates.filter((s) => scopedQuestionIds.has(s.questionId));

  const dailyLoad: DayLoad[] = [];
  let finishDateIso: string | null = backlog.length === 0 ? today : null;

  for (let dayOffset = 0; dayOffset < horizonDays; dayOffset++) {
    const dateIso = dayOffset === 0 ? today : addDaysIso(today, dayOffset);
    const isActiveDay = plan.activeDays[weekdayOf(dateIso)] ?? false;
    let budget = isActiveDay ? plan.minutesPerDay : 0;

    const items: DayPlanItem[] = [];
    let reviewCount = 0;
    let reviewMinutes = 0;
    let newCount = 0;
    let newMinutes = 0;

    // Due reviews first, most-overdue-first (ties by lower rung) — same
    // urgency policy as engine/srs/queue.ts's buildReviewQueue.
    const dueTodaySorted = simulatedReviewStates
      .filter((s) => s.dueAt.slice(0, 10) <= dateIso)
      .sort((a, b) => a.dueAt.localeCompare(b.dueAt) || a.rung - b.rung);

    for (const state of dueTodaySorted) {
      const question = questionsById.get(state.questionId);
      if (!question) continue;
      const cost = estimateMinutes(question, [], 'review');
      if (cost > budget + BUDGET_EPSILON) break; // remaining due reviews simply stay due — no partial credit, no backlog concept

      budget -= cost;
      reviewCount += 1;
      reviewMinutes += cost;
      items.push({ kind: 'review', moduleId: question.moduleId, questionId: state.questionId });

      const advanced = scheduleReview(state, { passed: true, cleanPass: true, fast: false }, `${dateIso}T00:00:00.000Z`);
      simulatedReviewStates = simulatedReviewStates.filter((s) => s.questionId !== state.questionId).concat(advanced);
    }

    // Then new content, at practice cost, until the budget runs out.
    while (backlog.length > 0) {
      const next = backlog[0];
      if (!next) break;

      if (next.kind === 'learn') {
        if (LEARN_STAGE_MINUTES > budget + BUDGET_EPSILON) break;
        budget -= LEARN_STAGE_MINUTES;
        newCount += 1;
        newMinutes += LEARN_STAGE_MINUTES;
        items.push(next);
        backlog = backlog.slice(1);
        continue;
      }

      const question = questionsById.get(next.questionId);
      if (!question) {
        // A dangling reference (shouldn't happen — remainingWorkItems only
        // ever returns ids selectNextAction resolved against real content).
        // Skip defensively rather than crash the projection.
        backlog = backlog.slice(1);
        continue;
      }
      const cost = estimateMinutes(question, [], 'practice');
      if (cost > budget + BUDGET_EPSILON) break;

      budget -= cost;
      newCount += 1;
      newMinutes += cost;
      items.push(next);
      backlog = backlog.slice(1);

      if (question.reviewable) {
        simulatedReviewStates = simulatedReviewStates.concat(enterReview(next.questionId, `${dateIso}T00:00:00.000Z`));
      }
    }

    dailyLoad.push({ dateIso, isActiveDay, reviewCount, reviewMinutes, newCount, newMinutes, items });

    if (backlog.length === 0 && finishDateIso === null) {
      finishDateIso = dateIso;
    }
  }

  return { finishDateIso, dailyLoad, totalRemainingMinutes };
}
