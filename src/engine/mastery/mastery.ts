import type { CodeQuestion, QuestionId, RoadmapModule, SkillId } from '../../content/types';
import type { Attempt } from '../../storage/types';

const HINT_DECAY = 0.85; // per hint revealed on the passing attempt
const FAIL_DECAY = 0.9; // per failed submit before the eventual pass
const MIN_PASS_SCORE = 0.4; // floor for any eventual pass, however many hints/fails it took

/**
 * One exercise's mastery contribution, 0-1 — Triecode UI spec §11 (replaces
 * ARCHITECTURE §7.2's per-skill EWMA). 1.0 for a clean solve (no hints,
 * passes on the first submit); each hint revealed on the passing attempt
 * multiplies by 0.85, each failed submit before that pass multiplies by
 * 0.9, floored at 0.4 once passed at all. 0 if never passed. Takes the
 * question's full attempt history (any order) so a future time-decay
 * pass (Phase 5) can slot in without changing callers.
 */
export function computeExerciseScore(attempts: Attempt[]): number {
  const sorted = [...attempts].sort((a, b) => (a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0));
  let failuresBeforePass = 0;
  for (const attempt of sorted) {
    if (attempt.scorecard.overall === 100) {
      const raw = HINT_DECAY ** attempt.hintsUsed * FAIL_DECAY ** failuresBeforePass;
      return Math.max(MIN_PASS_SCORE, raw);
    }
    failuresBeforePass += 1;
  }
  return 0;
}

function groupAttemptsByQuestion(attempts: Attempt[]): Map<QuestionId, Attempt[]> {
  const byQuestion = new Map<QuestionId, Attempt[]>();
  for (const attempt of attempts) {
    const existing = byQuestion.get(attempt.questionId);
    if (existing) existing.push(attempt);
    else byQuestion.set(attempt.questionId, [attempt]);
  }
  return byQuestion;
}

function moduleQuestionIds(module: RoadmapModule): QuestionId[] {
  return module.stages.flatMap((stage) =>
    stage.items.filter((item) => item.type === 'question').map((item) => item.questionId),
  );
}

/**
 * Module mastery (0-1): the mean of every exercise's score, plus one more
 * exercise-equivalent for a completed Learn stage (1 if marked complete, 0
 * otherwise) when the module has one. This is the only number that may
 * drive a displayed percentage (ProgressRing) — nothing computes
 * solved/total as mastery.
 */
export function computeModuleMastery(module: RoadmapModule, attempts: Attempt[], isLearnComplete: boolean): number {
  const byQuestion = groupAttemptsByQuestion(attempts);
  const scores = moduleQuestionIds(module).map((id) => computeExerciseScore(byQuestion.get(id) ?? []));

  const hasLearnStage = module.stages.some((stage) => stage.type === 'learn' && stage.items.length > 0);
  if (hasLearnStage) {
    scores.push(isLearnComplete ? 1 : 0);
  }

  if (scores.length === 0) return 0;
  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
}

/**
 * Per-skill score (0-1): the mean exercise score across every question
 * tagged with this skill. Spaced repetition schedules individual skills,
 * not whole modules, so the SRS queue (engine/srs/queue.ts) needs this
 * finer granularity — it reuses computeExerciseScore rather than a second
 * formula.
 */
export function computeSkillScore(skillId: SkillId, questions: CodeQuestion[], attempts: Attempt[]): number {
  const relevant = questions.filter((q) => q.skillIds.includes(skillId));
  if (relevant.length === 0) return 0;
  const byQuestion = groupAttemptsByQuestion(attempts);
  const scores = relevant.map((q) => computeExerciseScore(byQuestion.get(q.id) ?? []));
  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
}
