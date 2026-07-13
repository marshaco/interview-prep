import type { CodeQuestion, SkillId } from '../../content/types';
import type { Attempt, ReviewRecord, SkillMastery } from '../../storage/types';

export interface DueReviewItem {
  skillId: SkillId;
  overdueDays: number;
  masteryScore: number;
}

function daysBetween(fromIso: string, toIso: string): number {
  return Math.floor((Date.parse(toIso) - Date.parse(fromIso)) / 86_400_000);
}

/**
 * Today's Review queue per ARCHITECTURE §7.3: due records sorted by
 * (mastery asc, overdue-days desc), capped at a daily size. There's no
 * Settings UI yet to make the cap user-configurable, so it's a parameter
 * with a sane default rather than a stored preference.
 */
export function buildTodaysReview(
  reviewRecords: ReviewRecord[],
  masteryBySkill: ReadonlyMap<SkillId, SkillMastery>,
  todayIso: string,
  cap = 10,
): DueReviewItem[] {
  const due = reviewRecords.filter((record) => record.dueAt <= todayIso);

  const items: DueReviewItem[] = due.map((record) => ({
    skillId: record.skillId,
    overdueDays: Math.max(0, daysBetween(record.dueAt, todayIso)),
    masteryScore: masteryBySkill.get(record.skillId)?.score ?? 0,
  }));

  items.sort((a, b) => a.masteryScore - b.masteryScore || b.overdueDays - a.overdueDays);

  return items.slice(0, cap);
}

/**
 * Picks a question for a due skill, preferring one the user hasn't seen
 * most recently — cheap anti-memorization per ARCHITECTURE §7.3. When only
 * one question exercises the skill, or none have ever been attempted,
 * there's nothing to exclude and any candidate is fine.
 */
export function pickReviewQuestion(
  skillId: SkillId,
  questions: CodeQuestion[],
  attempts: Attempt[],
  random: () => number = Math.random,
): CodeQuestion | null {
  const candidates = questions.filter((q) => q.skillIds.includes(skillId));
  if (candidates.length <= 1) return candidates[0] ?? null;

  const candidateIds = new Set(candidates.map((q) => q.id));
  const relevantAttempts = attempts.filter((a) => candidateIds.has(a.questionId));

  let pool = candidates;
  if (relevantAttempts.length > 0) {
    const mostRecent = relevantAttempts.reduce((latest, a) => (a.createdAt > latest.createdAt ? a : latest));
    const withoutMostRecent = candidates.filter((q) => q.id !== mostRecent.questionId);
    // If every candidate but one has never been attempted, excluding the
    // most-recently-attempted one still leaves choices; only fall back to
    // the full pool if that exclusion would empty it out.
    pool = withoutMostRecent.length > 0 ? withoutMostRecent : candidates;
  }

  const index = Math.floor(random() * pool.length);
  return pool[index] ?? null;
}
