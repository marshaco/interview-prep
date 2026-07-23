import type { QuestionId } from '../../content/types';
import type { ReviewState } from '../../storage/types';

/** Fixed interval ladder (Review system spec §2) — rung index -> days until due. */
export const RUNG_INTERVALS_DAYS = [1, 3, 7, 14, 30, 60] as const;
export const MAX_RUNG = RUNG_INTERVALS_DAYS.length - 1;

/** Default "fast pass" threshold when a question doesn't override one — 10 minutes. */
export const DEFAULT_FAST_THRESHOLD_MS = 10 * 60 * 1000;

function addDaysToIso(iso: string, days: number): string {
  const date = new Date(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

function dueAtForRung(rung: number, now: string): string {
  const clamped = Math.max(0, Math.min(MAX_RUNG, rung));
  // Fallback mirrors the ladder's longest interval; unreachable given the
  // clamp above, but noUncheckedIndexedAccess can't see that statically.
  const days = RUNG_INTERVALS_DAYS[clamped] ?? 60;
  return addDaysToIso(now, days);
}

/**
 * An exercise enters the review pool the first time it's passed outside of
 * a review session (Review system spec §1) — rung 0, due tomorrow.
 */
export function enterReview(questionId: QuestionId, now: string): ReviewState {
  return { questionId, rung: 0, dueAt: dueAtForRung(0, now), lapses: 0, lastReviewedAt: now };
}

export interface ReviewOutcome {
  /** Did this review session item eventually pass before the queue moved on? */
  passed: boolean;
  /** Did the very first submit pass — no failed submits before it? Ignored when `passed` is false. */
  cleanPass: boolean;
  /** Was time-to-pass under the fast threshold? Only meaningful when `cleanPass` is true. */
  fast: boolean;
}

/**
 * Advances or lapses a reviewed exercise per the fixed interval ladder
 * (Review system spec §2) — this is the Phase-5-successor seam, documented
 * in ARCHITECTURE.md next to `selectNextAction` and the mastery formula:
 * swapping this for an SM-2-style algorithm later needs no consumer to
 * change, exactly like the per-skill scheduler this replaces was designed
 * to be swappable.
 *
 * - Failed (or abandoned without passing): lapse to rung 0, due tomorrow, lapses += 1.
 * - Clean pass, fast: advance 2 rungs (capped at MAX_RUNG).
 * - Clean pass, not fast: advance 1 rung.
 * - Scraped pass (multiple submits): stay on the current rung, rescheduled from `now`.
 */
export function scheduleReview(state: ReviewState, outcome: ReviewOutcome, now: string): ReviewState {
  if (!outcome.passed) {
    return {
      questionId: state.questionId,
      rung: 0,
      dueAt: dueAtForRung(0, now),
      lapses: state.lapses + 1,
      lastReviewedAt: now,
    };
  }

  const advance = outcome.cleanPass ? (outcome.fast ? 2 : 1) : 0;
  const rung = Math.min(MAX_RUNG, state.rung + advance);
  return {
    questionId: state.questionId,
    rung,
    dueAt: dueAtForRung(rung, now),
    lapses: state.lapses,
    lastReviewedAt: now,
  };
}
