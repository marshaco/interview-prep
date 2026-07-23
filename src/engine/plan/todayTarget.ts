import { projectPlan, type DayPlanItem, type PlanContent, type PlanInputs, type PlanProgress } from './projectPlan';
import type { ReviewState } from '../../storage/types';

export interface DayTarget {
  dateIso: string;
  isActiveDay: boolean;
  budgetMinutes: number;
  dueReviewCount: number;
  newExerciseCount: number;
  items: DayPlanItem[];
  minutesSpentToday: number;
  isDoneForToday: boolean;
}

function minutesSpentOn(attempts: { createdAt: string; durationMs: number }[], dateIso: string): number {
  const day = dateIso.slice(0, 10);
  return attempts.filter((a) => a.createdAt.slice(0, 10) === day).reduce((sum, a) => sum + a.durationMs, 0) / 60_000;
}

/**
 * Today's slice of the plan (Study plan spec §3) — recomputed from scratch
 * on every call, never read from a stored calendar, which is what makes a
 * missed day simply vanish into a recomputed forecast instead of
 * accumulating a "behind" backlog. `minutesSpentToday` is real, historical
 * (from attempt durations) — distinct from the simulated minutes
 * `projectPlan` would charge, since the plan strip shows actual progress
 * against the target, not the simulation's own bookkeeping.
 */
export function todayTarget(plan: PlanInputs, progress: PlanProgress, reviewStates: ReviewState[], content: PlanContent, now: string): DayTarget {
  const projection = projectPlan(plan, progress, reviewStates, content, now, 1);
  const day = projection.dailyLoad[0];
  if (!day) {
    // Unreachable: horizonDays=1 always produces exactly one entry.
    throw new Error('projectPlan produced no daily load for horizonDays=1');
  }

  const minutesSpentToday = minutesSpentOn(progress.attempts, now);

  return {
    dateIso: day.dateIso,
    isActiveDay: day.isActiveDay,
    budgetMinutes: day.isActiveDay ? plan.minutesPerDay : 0,
    dueReviewCount: day.reviewCount,
    newExerciseCount: day.newCount,
    items: day.items,
    minutesSpentToday,
    isDoneForToday: day.isActiveDay && minutesSpentToday >= plan.minutesPerDay,
  };
}
