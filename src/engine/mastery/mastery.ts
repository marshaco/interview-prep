import type { Skill, SkillId } from '../../content/types';
import type { SkillMastery } from '../../storage/types';

const MAX_STARS = 5;

const EWMA_ATTEMPT_WEIGHT = 0.7;
const EWMA_PRIOR_WEIGHT = 0.3;
const HINT_CAP_THRESHOLD = 3; // hints 3-4 used -> attempt capped at 60
const HINT_CAPPED_SCORE = 60;
const MIN_ATTEMPTS_FOR_FULL_RANGE = 2; // < 2 attempts -> max 3 stars
const LOW_EVIDENCE_STAR_CAP = 3;

/**
 * score' = 0.7 * attemptScore + 0.3 * score (EWMA, recent-weighted), per
 * ARCHITECTURE §7.2. On the very first attempt for a skill there is no prior
 * score to blend with — treating a nonexistent prior as 0 would understate a
 * good first attempt (e.g. a perfect 100 would blend down to 70), so the
 * first observation is taken as-is instead.
 */
export function updateMastery(
  previous: SkillMastery | undefined,
  skillId: SkillId,
  attemptScore: number,
  hintsUsed: number,
  now: string,
): SkillMastery {
  const effectiveAttemptScore = hintsUsed >= HINT_CAP_THRESHOLD ? Math.min(attemptScore, HINT_CAPPED_SCORE) : attemptScore;

  const score =
    previous === undefined
      ? effectiveAttemptScore
      : EWMA_ATTEMPT_WEIGHT * effectiveAttemptScore + EWMA_PRIOR_WEIGHT * previous.score;

  return {
    skillId,
    score,
    attempts: (previous?.attempts ?? 0) + 1,
    updatedAt: now,
  };
}

/** Stars are a display function over the stored raw score, capped by evidence. */
export function masteryStars(mastery: SkillMastery): number {
  const rawStars = Math.floor(mastery.score / 20);
  if (mastery.attempts < MIN_ATTEMPTS_FOR_FULL_RANGE) {
    return Math.min(rawStars, LOW_EVIDENCE_STAR_CAP);
  }
  return rawStars;
}

/**
 * Module-level roadmap progress (0-1): average star rating across the
 * module's skills, out of the 5-star max. A skill with no mastery record
 * yet (never attempted) counts as 0 stars, not "excluded from the average"
 * — an unattempted skill is not evidence of mastery.
 */
export function moduleProgress(skills: Skill[], masteryBySkill: ReadonlyMap<SkillId, SkillMastery>): number {
  if (skills.length === 0) return 0;
  const totalStars = skills.reduce((sum, skill) => {
    const mastery = masteryBySkill.get(skill.id);
    return sum + (mastery ? masteryStars(mastery) : 0);
  }, 0);
  return totalStars / (skills.length * MAX_STARS);
}
