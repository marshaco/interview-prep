import { describe, expect, it } from 'vitest';
import { todayTarget } from './todayTarget';
import type { CodeQuestion, RoadmapModule } from '../../content/types';
import type { Attempt, ReviewState } from '../../storage/types';
import type { PlanInputs } from './projectPlan';

const NOW = '2026-01-05T12:00:00.000Z';
const ALL_DAYS: [boolean, boolean, boolean, boolean, boolean, boolean, boolean] = [true, true, true, true, true, true, true];
const NONE_ACTIVE: [boolean, boolean, boolean, boolean, boolean, boolean, boolean] = [false, false, false, false, false, false, false];

function fakeQuestion(id: string, moduleId: string, estimatedMinutes: number): CodeQuestion {
  return {
    id,
    kind: 'method_impl',
    moduleId,
    skillIds: [],
    title: id,
    prompt: '',
    starterCode: '',
    solution: '',
    hints: ['a', 'b', 'c', 'd'],
    spec: { mode: 'function', entryPoint: 'fn', argTypes: [], resultType: 'value', tests: [] },
    reviewable: true,
    estimatedMinutes,
  };
}

function moduleWithQuestions(id: string, questions: CodeQuestion[]): RoadmapModule {
  return {
    id,
    kind: 'algorithm',
    title: id,
    summary: '',
    prerequisites: [],
    skills: [],
    stages: [{ type: 'algorithm_drills', title: 'Drills', items: questions.map((q) => ({ type: 'question', questionId: q.id })) }],
  };
}

function fakeAttempt(questionId: string, createdAt: string, durationMs: number): Attempt {
  return {
    id: `a-${questionId}-${createdAt}`,
    questionId,
    code: '',
    scorecard: { questionId, correctness: { correct: 1, total: 1 }, edgeCases: { correct: 1, total: 1 }, overall: 100, failures: [], style: null, readability: null, complexity: null },
    hintsUsed: 0,
    durationMs,
    createdAt,
    context: 'practice',
  };
}

describe('todayTarget', () => {
  it("reflects today's due reviews and next new exercises", () => {
    const q1 = fakeQuestion('m1/q1', 'm1', 20);
    const content = { modules: [moduleWithQuestions('m1', [q1])], questions: [q1] };
    const plan: PlanInputs = { scope: 'all', minutesPerDay: 20, activeDays: ALL_DAYS };

    const target = todayTarget(plan, { attempts: [], learnCompletions: new Set() }, [], content, NOW);

    expect(target.isActiveDay).toBe(true);
    expect(target.budgetMinutes).toBe(20);
    expect(target.newExerciseCount).toBe(1);
    expect(target.dueReviewCount).toBe(0);
  });

  it('is a rest day with zero budget when the weekday is toggled off', () => {
    const q1 = fakeQuestion('m1/q1', 'm1', 20);
    const content = { modules: [moduleWithQuestions('m1', [q1])], questions: [q1] };
    const plan: PlanInputs = { scope: 'all', minutesPerDay: 20, activeDays: NONE_ACTIVE };

    const target = todayTarget(plan, { attempts: [], learnCompletions: new Set() }, [], content, NOW);

    expect(target.isActiveDay).toBe(false);
    expect(target.budgetMinutes).toBe(0);
    expect(target.newExerciseCount).toBe(0);
  });

  it('counts minutes actually spent today from real attempt durations, marking done-for-today once the budget is met', () => {
    const q1 = fakeQuestion('m1/q1', 'm1', 20);
    const content = { modules: [moduleWithQuestions('m1', [q1])], questions: [q1] };
    const plan: PlanInputs = { scope: 'all', minutesPerDay: 15, activeDays: ALL_DAYS };
    const attempts = [fakeAttempt('m1/q1', NOW, 16 * 60_000)]; // 16 real minutes spent today

    const target = todayTarget(plan, { attempts, learnCompletions: new Set() }, [], content, NOW);

    expect(target.minutesSpentToday).toBeCloseTo(16, 10);
    expect(target.isDoneForToday).toBe(true);
  });

  it('is not done for today when minutes spent so far are under the budget', () => {
    const q1 = fakeQuestion('m1/q1', 'm1', 20);
    const content = { modules: [moduleWithQuestions('m1', [q1])], questions: [q1] };
    const plan: PlanInputs = { scope: 'all', minutesPerDay: 30, activeDays: ALL_DAYS };
    const attempts = [fakeAttempt('m1/q1', NOW, 5 * 60_000)];

    const target = todayTarget(plan, { attempts, learnCompletions: new Set() }, [], content, NOW);

    expect(target.isDoneForToday).toBe(false);
  });

  it('an item overdue by many days still counts as exactly one due review today — no backlog multiplication', () => {
    const q1 = fakeQuestion('m1/q1', 'm1', 20);
    const content = { modules: [moduleWithQuestions('m1', [q1])], questions: [q1] };
    const plan: PlanInputs = { scope: 'all', minutesPerDay: 30, activeDays: ALL_DAYS };
    const longOverdueState: ReviewState = {
      questionId: 'm1/q1',
      rung: 0,
      dueAt: '2025-01-01T00:00:00.000Z', // over a year overdue relative to NOW
      lapses: 0,
      lastReviewedAt: '2024-12-31T00:00:00.000Z',
    };

    const target = todayTarget(plan, { attempts: [], learnCompletions: new Set() }, [longOverdueState], content, NOW);

    expect(target.dueReviewCount).toBe(1);
  });
});
