import { deriveThird } from './deriveThird';
import type { PlanContent, PlanInputs, PlanProgress } from './projectPlan';
import type { PlanRecord, ReviewState } from '../../storage/types';

/**
 * Resolves a stored `PlanRecord` (which holds only one of pace or a finish
 * date, per the strict mode split — Study plan revision spec §3) into a
 * concrete `PlanInputs` with an actual `minutesPerDay`, deriving it via
 * `deriveThird` when the plan is in date mode. Every consumer (the hero's
 * plan line, plan details) goes through this one function, so the day list
 * and the finish date always come from the same resolved pace — never two
 * independent derivations that could disagree.
 */
export function resolvePlanInputs(
  plan: PlanRecord,
  progress: PlanProgress,
  reviewStates: ReviewState[],
  content: PlanContent,
  now: string,
): PlanInputs {
  if (plan.pace.mode === 'pace') {
    return { scope: plan.scope, minutesPerDay: plan.pace.minutesPerDay, activeDays: plan.activeDays };
  }
  const derived = deriveThird(
    plan.scope,
    plan.activeDays,
    { kind: 'date', targetDate: plan.pace.targetDate },
    progress,
    reviewStates,
    content,
    now,
  );
  return { scope: plan.scope, minutesPerDay: derived.minutesPerDay, activeDays: plan.activeDays };
}
