import { projectPlan, type PlanContent, type PlanProgress } from './projectPlan';
import type { PlanScope } from './scope';
import type { ReviewState } from '../../storage/types';

export const MIN_PACE_MINUTES = 10;
export const MAX_PACE_MINUTES = 180; // "any daily pace under 3h" — the setup UI's infeasibility copy names this bound

export type TriangleInput = { kind: 'pace'; minutesPerDay: number } | { kind: 'date'; targetDate: string };

export interface TriangleResult {
  feasible: boolean;
  minutesPerDay: number;
  finishDateIso: string | null;
}

/**
 * The triangle solver (Study plan spec §1): scope + active days are fixed,
 * and exactly one of {minutesPerDay, targetDate} is given — this derives
 * the other via `projectPlan`. Solving for pace given a date binary-
 * searches minutesPerDay, since a larger daily budget can only finish the
 * same in-scope backlog on the same day or earlier (never later) —
 * `projectPlan`'s finish date is monotonically non-increasing in pace.
 */
export function deriveThird(
  scope: PlanScope,
  activeDays: [boolean, boolean, boolean, boolean, boolean, boolean, boolean],
  input: TriangleInput,
  progress: PlanProgress,
  reviewStates: ReviewState[],
  content: PlanContent,
  now: string,
): TriangleResult {
  const finishAt = (minutesPerDay: number): string | null =>
    projectPlan({ scope, minutesPerDay, activeDays }, progress, reviewStates, content, now).finishDateIso;

  if (input.kind === 'pace') {
    const finishDateIso = finishAt(input.minutesPerDay);
    return { feasible: finishDateIso !== null, minutesPerDay: input.minutesPerDay, finishDateIso };
  }

  const bestPossible = finishAt(MAX_PACE_MINUTES);
  if (bestPossible === null || bestPossible > input.targetDate) {
    return { feasible: false, minutesPerDay: MAX_PACE_MINUTES, finishDateIso: bestPossible };
  }

  let lo = MIN_PACE_MINUTES;
  let hi = MAX_PACE_MINUTES;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    const finishDateIso = finishAt(mid);
    if (finishDateIso !== null && finishDateIso <= input.targetDate) {
      hi = mid;
    } else {
      lo = mid + 1;
    }
  }
  return { feasible: true, minutesPerDay: lo, finishDateIso: finishAt(lo) };
}
