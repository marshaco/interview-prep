import { describe, expect, it } from 'vitest';
import { countSolvedThisWeek, countTotalMastered } from './homeStats';
import type { Attempt } from '../../storage/types';

const NOW = '2026-01-10T00:00:00.000Z';

function attempt(questionId: string, createdAt: string, overall = 100): Attempt {
  return {
    id: crypto.randomUUID(),
    questionId,
    code: '',
    scorecard: { questionId, correctness: { correct: 1, total: 1 }, edgeCases: { correct: 1, total: 1 }, overall, failures: [], style: null, readability: null, complexity: null },
    hintsUsed: 0,
    durationMs: 0,
    createdAt,
    context: 'practice',
  };
}

describe('countSolvedThisWeek', () => {
  it('counts a passing attempt from today', () => {
    expect(countSolvedThisWeek([attempt('q1', NOW)], NOW)).toBe(1);
  });

  it('excludes a passing attempt from more than 7 days ago', () => {
    expect(countSolvedThisWeek([attempt('q1', '2026-01-01T00:00:00.000Z')], NOW)).toBe(0);
  });

  it('excludes a failing attempt regardless of date', () => {
    expect(countSolvedThisWeek([attempt('q1', NOW, 40)], NOW)).toBe(0);
  });

  it('counts each question once, even with multiple passing attempts this week', () => {
    const attempts = [attempt('q1', NOW), attempt('q1', NOW)];
    expect(countSolvedThisWeek(attempts, NOW)).toBe(1);
  });
});

describe('countTotalMastered', () => {
  it('counts distinct passed questions across all time', () => {
    const attempts = [attempt('q1', '2025-01-01T00:00:00.000Z'), attempt('q2', NOW), attempt('q2', NOW, 40)];
    expect(countTotalMastered(attempts)).toBe(2);
  });

  it('is 0 with no passing attempts', () => {
    expect(countTotalMastered([attempt('q1', NOW, 40)])).toBe(0);
  });
});
