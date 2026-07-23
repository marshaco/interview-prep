import { describe, expect, it } from 'vitest';
import { projectPlan } from './projectPlan';
import { localDateIso } from '../srs/streaks';
import type { CodeQuestion, RoadmapModule } from '../../content/types';
import type { PlanInputs, PlanProgress } from './projectPlan';

const NOW = '2026-01-05T12:00:00.000Z'; // noon UTC — safely the same local calendar day in any realistic test-runner timezone
const ALL_DAYS: [boolean, boolean, boolean, boolean, boolean, boolean, boolean] = [true, true, true, true, true, true, true];

function fakeQuestion(id: string, moduleId: string, overrides: Partial<CodeQuestion> = {}): CodeQuestion {
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
    estimatedMinutes: 20,
    ...overrides,
  };
}

function moduleWithQuestions(id: string, questions: CodeQuestion[], prerequisites: string[] = []): RoadmapModule {
  return {
    id,
    kind: 'algorithm',
    title: id,
    summary: '',
    prerequisites,
    skills: [],
    stages: [{ type: 'algorithm_drills', title: 'Drills', items: questions.map((q) => ({ type: 'question', questionId: q.id })) }],
  };
}

const NO_PROGRESS: PlanProgress = { attempts: [], learnCompletions: new Set() };

describe('projectPlan', () => {
  it('finishes on day 0 when the daily budget covers the whole in-scope backlog', () => {
    const q1 = fakeQuestion('m1/q1', 'm1', { estimatedMinutes: 20 });
    const content = { modules: [moduleWithQuestions('m1', [q1])], questions: [q1] };
    const plan: PlanInputs = { scope: 'all', minutesPerDay: 20, activeDays: ALL_DAYS };

    const result = projectPlan(plan, NO_PROGRESS, [], content, NOW, 5);

    expect(result.finishDateIso).toBe(localDateIso(new Date(NOW)));
    expect(result.dailyLoad[0]?.newCount).toBe(1);
    expect(result.totalRemainingMinutes).toBe(20);
  });

  it('never finishes when the daily budget cannot cover even one item', () => {
    const q1 = fakeQuestion('m1/q1', 'm1', { estimatedMinutes: 20 });
    const content = { modules: [moduleWithQuestions('m1', [q1])], questions: [q1] };
    const plan: PlanInputs = { scope: 'all', minutesPerDay: 10, activeDays: ALL_DAYS };

    const result = projectPlan(plan, NO_PROGRESS, [], content, NOW, 5);

    expect(result.finishDateIso).toBeNull();
    expect(result.dailyLoad.every((d) => d.newCount === 0)).toBe(true);
  });

  it('charges a flat 15 minutes for an incomplete Learn stage, regardless of lesson count', () => {
    const q1 = fakeQuestion('m1/q1', 'm1', { estimatedMinutes: 10 });
    const modules: RoadmapModule[] = [
      {
        id: 'm1',
        kind: 'algorithm',
        title: 'M1',
        summary: '',
        prerequisites: [],
        skills: [],
        stages: [
          {
            type: 'learn',
            title: 'Learn',
            items: [
              { type: 'lesson', lesson: { id: 'l1', title: 'L1', body: '' } },
              { type: 'lesson', lesson: { id: 'l2', title: 'L2', body: '' } },
              { type: 'lesson', lesson: { id: 'l3', title: 'L3', body: '' } },
            ],
          },
          { type: 'algorithm_drills', title: 'Drills', items: [{ type: 'question', questionId: 'm1/q1' }] },
        ],
      },
    ];
    const content = { modules, questions: [q1] };
    const plan: PlanInputs = { scope: 'all', minutesPerDay: 15, activeDays: ALL_DAYS };

    const result = projectPlan(plan, NO_PROGRESS, [], content, NOW, 5);

    expect(result.totalRemainingMinutes).toBe(25); // 15 (Learn, flat) + 10 (the drill)
    expect(result.dailyLoad[0]?.items).toEqual([{ kind: 'learn', moduleId: 'm1' }]);
  });

  it('skips inactive weekdays entirely — no budget consumed, backlog untouched until the next active day', () => {
    const q1 = fakeQuestion('m1/q1', 'm1', { estimatedMinutes: 20 });
    const content = { modules: [moduleWithQuestions('m1', [q1])], questions: [q1] };

    const todayWeekday = new Date(NOW).getDay();
    const activeDays: [boolean, boolean, boolean, boolean, boolean, boolean, boolean] = [false, false, false, false, false, false, false];
    activeDays[(todayWeekday + 2) % 7] = true; // only the day after tomorrow is active

    const plan: PlanInputs = { scope: 'all', minutesPerDay: 20, activeDays };
    const result = projectPlan(plan, NO_PROGRESS, [], content, NOW, 5);

    expect(result.dailyLoad[0]?.isActiveDay).toBe(false);
    expect(result.dailyLoad[1]?.isActiveDay).toBe(false);
    expect(result.dailyLoad[2]?.isActiveDay).toBe(true);
    expect(result.dailyLoad[0]?.newCount).toBe(0);
    expect(result.dailyLoad[1]?.newCount).toBe(0);
    expect(result.dailyLoad[2]?.newCount).toBe(1);
    expect(result.finishDateIso).toBe(result.dailyLoad[2]?.dateIso);
  });

  it('grows total review load in aggregate over a multi-week projection as simulated solves accumulate', () => {
    const questions = Array.from({ length: 20 }, (_, i) => fakeQuestion(`m1/q${i}`, 'm1', { estimatedMinutes: 10 }));
    const content = { modules: [moduleWithQuestions('m1', questions)], questions };
    const plan: PlanInputs = { scope: 'all', minutesPerDay: 15, activeDays: ALL_DAYS };

    const result = projectPlan(plan, NO_PROGRESS, [], content, NOW, 28);

    const firstWeek = result.dailyLoad.slice(0, 7).reduce((sum, d) => sum + d.reviewMinutes, 0);
    const fourthWeek = result.dailyLoad.slice(21, 28).reduce((sum, d) => sum + d.reviewMinutes, 0);
    expect(fourthWeek).toBeGreaterThan(firstWeek);
  });

  it('does not enter non-reviewable exercises (e.g. guided-build steps) into the review pool', () => {
    const q1 = fakeQuestion('m1/q1', 'm1', { estimatedMinutes: 5, reviewable: false });
    const content = { modules: [moduleWithQuestions('m1', [q1])], questions: [q1] };
    const plan: PlanInputs = { scope: 'all', minutesPerDay: 5, activeDays: ALL_DAYS };

    const result = projectPlan(plan, NO_PROGRESS, [], content, NOW, 10);

    expect(result.finishDateIso).toBe(localDateIso(new Date(NOW)));
    // Every subsequent day should show zero review activity — nothing ever entered the pool.
    expect(result.dailyLoad.every((d) => d.reviewCount === 0)).toBe(true);
  });

  it('recomputing later with unchanged progress (as if days were missed) does not inflate remaining work — only shifts which dates it lands on', () => {
    const questions = Array.from({ length: 5 }, (_, i) => fakeQuestion(`m1/q${i}`, 'm1', { estimatedMinutes: 20 }));
    const content = { modules: [moduleWithQuestions('m1', questions)], questions };
    const plan: PlanInputs = { scope: 'all', minutesPerDay: 20, activeDays: ALL_DAYS };

    const earlier = projectPlan(plan, NO_PROGRESS, [], content, '2026-01-05T12:00:00.000Z', 30);
    const later = projectPlan(plan, NO_PROGRESS, [], content, '2026-01-12T12:00:00.000Z', 30); // 7 "missed" days later, same progress

    expect(later.totalRemainingMinutes).toBe(earlier.totalRemainingMinutes);
  });

  it('scopes to only the chosen module plus its ancestors, ignoring unrelated modules', () => {
    const inScopeQ = fakeQuestion('root/q1', 'root', { estimatedMinutes: 20 });
    const outOfScopeQ = fakeQuestion('other/q1', 'other', { estimatedMinutes: 20 });
    const modules = [moduleWithQuestions('root', [inScopeQ]), moduleWithQuestions('other', [outOfScopeQ])];
    const content = { modules, questions: [inScopeQ, outOfScopeQ] };
    const plan: PlanInputs = { scope: 'root', minutesPerDay: 20, activeDays: ALL_DAYS };

    const result = projectPlan(plan, NO_PROGRESS, [], content, NOW, 5);

    expect(result.totalRemainingMinutes).toBe(20); // only root/q1, not other/q1
  });
});
