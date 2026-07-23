import type { CodeQuestion } from '../../content/types';
import type { Attempt } from '../../storage/types';

const REVIEW_TIME_MULTIPLIER = 0.6; // re-solving is faster than first-solving (Study plan spec §2)

export type EstimateContext = 'practice' | 'review';

/**
 * The calibration seam (Study plan spec §2): every minutes estimate the
 * plan engine reads goes through this one function. V1 returns the
 * content-authored `estimatedMinutes`, scaled down for review context.
 * `_attemptHistory` is unused today — reserved so a later phase can
 * replace the internals with the user's actual median solve time (the
 * `attempts` table already records `durationMs`) without any consumer's
 * call site changing.
 */
export function estimateMinutes(exercise: CodeQuestion, _attemptHistory: Attempt[], context: EstimateContext = 'practice'): number {
  return context === 'review' ? exercise.estimatedMinutes * REVIEW_TIME_MULTIPLIER : exercise.estimatedMinutes;
}
