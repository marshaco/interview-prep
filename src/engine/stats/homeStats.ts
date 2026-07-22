import type { Attempt } from '../../storage/types';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** Distinct questions passed within the 7 days ending at `nowIso`, inclusive. */
export function countSolvedThisWeek(attempts: Attempt[], nowIso: string): number {
  const cutoff = Date.parse(nowIso) - WEEK_MS;
  const solvedIds = new Set(
    attempts.filter((a) => a.scorecard.overall === 100 && Date.parse(a.createdAt) >= cutoff).map((a) => a.questionId),
  );
  return solvedIds.size;
}

/** Distinct questions ever passed, across all time — Home's "total mastered" stat. */
export function countTotalMastered(attempts: Attempt[]): number {
  return new Set(attempts.filter((a) => a.scorecard.overall === 100).map((a) => a.questionId)).size;
}
