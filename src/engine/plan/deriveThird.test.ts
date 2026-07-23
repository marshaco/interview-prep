import { describe, expect, it } from 'vitest';
import { deriveThird, MAX_PACE_MINUTES } from './deriveThird';
import { localDateIso, addDaysIso } from '../srs/streaks';
import type { CodeQuestion, RoadmapModule } from '../../content/types';
import type { PlanProgress } from './projectPlan';

const NOW = '2026-01-05T12:00:00.000Z';
const TODAY = localDateIso(new Date(NOW));
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

describe('deriveThird', () => {
  it('derives a finish date from a given pace', () => {
    const questions = [fakeQuestion('m1/q1', 'm1', 20), fakeQuestion('m1/q2', 'm1', 20), fakeQuestion('m1/q3', 'm1', 20)];
    const content = { modules: [moduleWithQuestions('m1', questions)], questions };

    const result = deriveThird('all', ALL_DAYS, { kind: 'pace', minutesPerDay: 60 }, NO_PROGRESS, [], content, NOW);

    expect(result.feasible).toBe(true);
    expect(result.finishDateIso).toBe(TODAY);
  });

  it('derives the minimum pace that reaches a given target date', () => {
    const questions = [fakeQuestion('m1/q1', 'm1', 20), fakeQuestion('m1/q2', 'm1', 20), fakeQuestion('m1/q3', 'm1', 20)];
    const content = { modules: [moduleWithQuestions('m1', questions)], questions };

    const result = deriveThird('all', ALL_DAYS, { kind: 'date', targetDate: TODAY }, NO_PROGRESS, [], content, NOW);

    expect(result.feasible).toBe(true);
    expect(result.minutesPerDay).toBe(60); // the whole 60-minute backlog must fit in one day to finish today
    expect(result.finishDateIso).toBe(TODAY);
  });

  it('reports infeasibility in plain data (not an exception) when no pace under the cap reaches the date', () => {
    const questions = Array.from({ length: 50 }, (_, i) => fakeQuestion(`m1/q${i}`, 'm1', 20)); // 1000 minutes of backlog
    const content = { modules: [moduleWithQuestions('m1', questions)], questions };
    const tomorrow = addDaysIso(TODAY, 1);

    const result = deriveThird('all', ALL_DAYS, { kind: 'date', targetDate: tomorrow }, NO_PROGRESS, [], content, NOW);

    expect(result.feasible).toBe(false);
    expect(result.minutesPerDay).toBe(MAX_PACE_MINUTES);
  });

  it('a smaller scope reaches the same target date at a lower derived pace', () => {
    const smallQuestions = [fakeQuestion('small/q1', 'small', 20)];
    const bigQuestions = [
      fakeQuestion('big/q1', 'big', 20),
      fakeQuestion('big/q2', 'big', 20),
      fakeQuestion('big/q3', 'big', 20),
      fakeQuestion('big/q4', 'big', 20),
    ];

    const smallResult = deriveThird(
      'small',
      ALL_DAYS,
      { kind: 'date', targetDate: TODAY },
      NO_PROGRESS,
      [],
      { modules: [moduleWithQuestions('small', smallQuestions)], questions: smallQuestions },
      NOW,
    );
    const bigResult = deriveThird(
      'big',
      ALL_DAYS,
      { kind: 'date', targetDate: TODAY },
      NO_PROGRESS,
      [],
      { modules: [moduleWithQuestions('big', bigQuestions)], questions: bigQuestions },
      NOW,
    );

    expect(smallResult.minutesPerDay).toBeLessThan(bigResult.minutesPerDay);
  });
});
