import { describe, expect, it } from 'vitest';
import { resolvePlanInputs } from './resolvePlanInputs';
import type { CodeQuestion, RoadmapModule } from '../../content/types';
import type { PlanProgress } from './projectPlan';
import type { PlanRecord } from '../../storage/types';

const NOW = '2026-01-05T12:00:00.000Z';
const ALL_DAYS: [boolean, boolean, boolean, boolean, boolean, boolean, boolean] = [true, true, true, true, true, true, true];
const NO_PROGRESS: PlanProgress = { attempts: [], learnCompletions: new Set() };

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

describe('resolvePlanInputs', () => {
  it('passes pace-mode minutesPerDay straight through', () => {
    const plan: PlanRecord = {
      scope: ['m1'],
      pace: { mode: 'pace', minutesPerDay: 30 },
      activeDays: ALL_DAYS,
      createdAt: NOW,
      pausedAt: null,
    };
    const content = { modules: [], questions: [] };

    const inputs = resolvePlanInputs(plan, NO_PROGRESS, [], content, NOW);

    expect(inputs.minutesPerDay).toBe(30);
    expect(inputs.scope).toEqual(['m1']);
  });

  it('derives a concrete minutesPerDay from a date-mode plan', () => {
    const questions = [fakeQuestion('m1/q1', 'm1', 20), fakeQuestion('m1/q2', 'm1', 20), fakeQuestion('m1/q3', 'm1', 20)];
    const content = { modules: [moduleWithQuestions('m1', questions)], questions };
    const plan: PlanRecord = {
      scope: ['m1'],
      pace: { mode: 'date', targetDate: '2026-01-05' }, // same day as NOW — needs the whole 60 min today
      activeDays: ALL_DAYS,
      createdAt: NOW,
      pausedAt: null,
    };

    const inputs = resolvePlanInputs(plan, NO_PROGRESS, [], content, NOW);

    expect(inputs.minutesPerDay).toBe(60);
  });
});
