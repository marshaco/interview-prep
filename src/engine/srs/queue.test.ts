import { describe, expect, it } from 'vitest';
import { buildTodaysReview, pickReviewQuestion } from './queue';
import type { Attempt, ReviewRecord, SkillMastery } from '../../storage/types';
import type { CodeQuestion } from '../../content/types';

const TODAY = '2026-01-10T00:00:00.000Z';

function fakeQuestion(id: string, skillIds: string[]): CodeQuestion {
  return {
    id,
    kind: 'method_impl',
    moduleId: 'linked-list',
    skillIds,
    title: id,
    prompt: '',
    starterCode: '',
    solution: '',
    hints: ['a', 'b', 'c', 'd'],
    spec: { mode: 'function', entryPoint: 'fn', argTypes: [], resultType: 'value', tests: [] },
  };
}

function fakeAttempt(questionId: string, createdAt: string): Attempt {
  return {
    id: crypto.randomUUID(),
    questionId,
    code: '',
    scorecard: { questionId, correctness: { correct: 1, total: 1 }, edgeCases: { correct: 1, total: 1 }, overall: 100, failures: [], style: null, readability: null, complexity: null },
    hintsUsed: 0,
    durationMs: 0,
    createdAt,
  };
}

describe('buildTodaysReview', () => {
  it('excludes records not yet due', () => {
    const records: ReviewRecord[] = [
      { skillId: 'a', ease: 2.5, intervalDays: 1, dueAt: '2026-01-05T00:00:00.000Z', lapses: 0 },
      { skillId: 'b', ease: 2.5, intervalDays: 1, dueAt: '2026-01-20T00:00:00.000Z', lapses: 0 },
    ];
    const result = buildTodaysReview(records, new Map(), TODAY, []);
    expect(result.map((r) => r.skillId)).toEqual(['a']);
  });

  it('sorts by mastery ascending, then overdue-days descending', () => {
    const records: ReviewRecord[] = [
      { skillId: 'high-mastery', ease: 2.5, intervalDays: 1, dueAt: '2026-01-09T00:00:00.000Z', lapses: 0 },
      { skillId: 'low-mastery', ease: 2.5, intervalDays: 1, dueAt: '2026-01-09T00:00:00.000Z', lapses: 0 },
      { skillId: 'low-mastery-more-overdue', ease: 2.5, intervalDays: 1, dueAt: '2026-01-01T00:00:00.000Z', lapses: 0 },
    ];
    const mastery = new Map<string, SkillMastery>([
      ['high-mastery', { skillId: 'high-mastery', score: 90, attempts: 5, updatedAt: '' }],
      ['low-mastery', { skillId: 'low-mastery', score: 20, attempts: 5, updatedAt: '' }],
      ['low-mastery-more-overdue', { skillId: 'low-mastery-more-overdue', score: 20, attempts: 5, updatedAt: '' }],
    ]);
    const result = buildTodaysReview(records, mastery, TODAY, []);
    expect(result.map((r) => r.skillId)).toEqual(['low-mastery-more-overdue', 'low-mastery', 'high-mastery']);
  });

  it('treats a skill with no mastery record as score 0 (most urgent)', () => {
    const records: ReviewRecord[] = [
      { skillId: 'never-attempted', ease: 2.5, intervalDays: 1, dueAt: '2026-01-09T00:00:00.000Z', lapses: 0 },
      { skillId: 'attempted', ease: 2.5, intervalDays: 1, dueAt: '2026-01-09T00:00:00.000Z', lapses: 0 },
    ];
    const mastery = new Map<string, SkillMastery>([['attempted', { skillId: 'attempted', score: 1, attempts: 5, updatedAt: '' }]]);
    const result = buildTodaysReview(records, mastery, TODAY, []);
    expect(result[0]?.skillId).toBe('never-attempted');
  });

  it('caps the queue size', () => {
    const records: ReviewRecord[] = Array.from({ length: 20 }, (_, i) => ({
      skillId: `s${i}`,
      ease: 2.5,
      intervalDays: 1,
      dueAt: '2026-01-01T00:00:00.000Z',
      lapses: 0,
    }));
    expect(buildTodaysReview(records, new Map(), TODAY, [], 5)).toHaveLength(5);
  });

  it('is never empty for a brand new user — unattempted skills fill the queue', () => {
    const result = buildTodaysReview([], new Map(), TODAY, ['a', 'b', 'c']);
    expect(result.map((r) => r.skillId)).toEqual(['a', 'b', 'c']);
  });

  it('puts real overdue reviews ahead of unattempted skills', () => {
    const records: ReviewRecord[] = [{ skillId: 'overdue', ease: 2.5, intervalDays: 1, dueAt: '2026-01-01T00:00:00.000Z', lapses: 0 }];
    const mastery = new Map<string, SkillMastery>([['overdue', { skillId: 'overdue', score: 80, attempts: 5, updatedAt: '' }]]);
    const result = buildTodaysReview(records, mastery, TODAY, ['overdue', 'fresh']);
    expect(result.map((r) => r.skillId)).toEqual(['overdue', 'fresh']);
  });

  it('only uses unattempted skills to pad remaining slots, never past the cap', () => {
    const records: ReviewRecord[] = Array.from({ length: 3 }, (_, i) => ({
      skillId: `overdue${i}`,
      ease: 2.5,
      intervalDays: 1,
      dueAt: '2026-01-01T00:00:00.000Z',
      lapses: 0,
    }));
    const result = buildTodaysReview(records, new Map(), TODAY, ['fresh1', 'fresh2', 'fresh3', 'fresh4'], 5);
    expect(result).toHaveLength(5);
    expect(result.filter((r) => r.skillId.startsWith('fresh'))).toHaveLength(2);
  });

  it('does not re-add a skill that already has a review record, even if not due', () => {
    const records: ReviewRecord[] = [{ skillId: 'not-due-yet', ease: 2.5, intervalDays: 1, dueAt: '2026-01-20T00:00:00.000Z', lapses: 0 }];
    const result = buildTodaysReview(records, new Map(), TODAY, ['not-due-yet', 'fresh']);
    expect(result.map((r) => r.skillId)).toEqual(['fresh']);
  });
});

describe('pickReviewQuestion', () => {
  it('returns null when no question exercises the skill', () => {
    expect(pickReviewQuestion('ghost/skill', [fakeQuestion('q1', ['other'])], [])).toBeNull();
  });

  it('returns the only candidate when there is exactly one', () => {
    const q = fakeQuestion('q1', ['s']);
    expect(pickReviewQuestion('s', [q], [])).toBe(q);
  });

  it('excludes the most-recently-attempted candidate when there is a choice', () => {
    const q1 = fakeQuestion('q1', ['s']);
    const q2 = fakeQuestion('q2', ['s']);
    const attempts = [fakeAttempt('q1', '2026-01-01T00:00:00.000Z'), fakeAttempt('q2', '2026-01-05T00:00:00.000Z')];
    // q2 was attempted most recently, so it should be excluded — q1 is the only valid pick.
    const result = pickReviewQuestion('s', [q1, q2], attempts, () => 0.99);
    expect(result?.id).toBe('q1');
  });

  it('falls back to the full pool if excluding the most recent would empty it', () => {
    const q1 = fakeQuestion('q1', ['s']);
    const attempts = [fakeAttempt('q1', '2026-01-01T00:00:00.000Z')];
    const result = pickReviewQuestion('s', [q1], attempts);
    expect(result?.id).toBe('q1');
  });

  it('picks randomly among untouched candidates using the injected RNG', () => {
    const q1 = fakeQuestion('q1', ['s']);
    const q2 = fakeQuestion('q2', ['s']);
    const q3 = fakeQuestion('q3', ['s']);
    const first = pickReviewQuestion('s', [q1, q2, q3], [], () => 0);
    const last = pickReviewQuestion('s', [q1, q2, q3], [], () => 0.99);
    expect(first?.id).toBe('q1');
    expect(last?.id).toBe('q3');
  });
});
