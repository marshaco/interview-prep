import type { SkillId } from '../../content/types';
import type { ReviewRecord } from '../../storage/types';

const EASE_MIN = 1.3;
const EASE_MAX = 2.8;
const EASE_DEFAULT = 2.5;
const LAPSE_EASE_PENALTY = 0.2;
const LAPSE_INTERVAL_DAYS = 1;
const QUALITY_LAPSE_THRESHOLD = 3;
const HINT_QUALITY_PENALTY_THRESHOLD = 3;

/** Grades an attempt into SM-2 quality (0-5) from its scorecard and hint usage. */
export function deriveReviewQuality(overall: number, hintsUsed: number): number {
  const base = Math.round(overall / 20); // 20-point bucketing of the scorecard, independent of module mastery
  const penalty = hintsUsed >= HINT_QUALITY_PENALTY_THRESHOLD ? 1 : 0;
  return Math.max(0, Math.min(5, base - penalty));
}

function clampEase(ease: number): number {
  return Math.max(EASE_MIN, Math.min(EASE_MAX, ease));
}

function addDaysToIso(iso: string, days: number): string {
  const date = new Date(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

/**
 * SM-2-lite: (record, quality, now) -> record, per ARCHITECTURE §7.3.
 * Accepts `record: undefined` for a skill with no review history yet,
 * rather than requiring a separate initialization call at every call site.
 */
export function review(record: ReviewRecord | undefined, skillId: SkillId, quality: number, now: string): ReviewRecord {
  const ease = record?.ease ?? EASE_DEFAULT;
  const intervalDays = record?.intervalDays ?? 1;
  const lapses = record?.lapses ?? 0;

  if (quality < QUALITY_LAPSE_THRESHOLD) {
    return {
      skillId,
      ease: clampEase(ease - LAPSE_EASE_PENALTY),
      intervalDays: LAPSE_INTERVAL_DAYS,
      dueAt: addDaysToIso(now, LAPSE_INTERVAL_DAYS),
      lapses: lapses + 1,
    };
  }

  const easeDelta = quality === 5 ? 0.1 : quality === 4 ? 0.05 : -0.05; // quality === 3
  const nextEase = clampEase(ease + easeDelta);
  const nextIntervalDays = Math.max(1, Math.round(intervalDays * nextEase));

  return {
    skillId,
    ease: nextEase,
    intervalDays: nextIntervalDays,
    dueAt: addDaysToIso(now, nextIntervalDays),
    lapses,
  };
}
