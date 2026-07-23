import { describe, expect, it } from 'vitest';
import { selectNextAction, type ProgressSnapshot } from './selectNextAction';
import type { CodeQuestion, RoadmapModule } from '../../content/types';
import type { Attempt, ReviewState } from '../../storage/types';

const TODAY = '2026-01-10T00:00:00.000Z';

function fakeQuestion(id: string, moduleId: string): CodeQuestion {
  return {
    id,
    kind: 'method_impl',
    moduleId,
    skillIds: [],
    title: `Question ${id}`,
    prompt: '',
    starterCode: '',
    solution: '',
    hints: ['a', 'b', 'c', 'd'],
    spec: { mode: 'function', entryPoint: 'fn', argTypes: [], resultType: 'value', tests: [] },
    reviewable: true,
    estimatedMinutes: 20,
  };
}

function passingAttempt(questionId: string): Attempt {
  return {
    id: crypto.randomUUID(),
    questionId,
    code: '',
    scorecard: { questionId, correctness: { correct: 1, total: 1 }, edgeCases: { correct: 1, total: 1 }, overall: 100, failures: [], style: null, readability: null, complexity: null },
    hintsUsed: 0,
    durationMs: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    context: 'practice',
  };
}

function baseSnapshot(overrides: Partial<ProgressSnapshot> = {}): ProgressSnapshot {
  return {
    modules: [],
    questions: [],
    attempts: [],
    reviewStates: [],
    learnCompletions: new Set(),
    todayIso: TODAY,
    ...overrides,
  };
}

describe('selectNextAction', () => {
  it('recommends review when at least one review state is due', () => {
    const reviewStates: ReviewState[] = [
      { questionId: 'q1', rung: 0, dueAt: '2026-01-01T00:00:00.000Z', lapses: 0, lastReviewedAt: '2025-12-31T00:00:00.000Z' },
    ];
    const result = selectNextAction(baseSnapshot({ reviewStates }));
    expect(result).toEqual({ kind: 'review', dueCount: 1 });
  });

  it('does not recommend review for a state not yet due', () => {
    const reviewStates: ReviewState[] = [
      { questionId: 'q1', rung: 0, dueAt: '2026-02-01T00:00:00.000Z', lapses: 0, lastReviewedAt: '2026-01-01T00:00:00.000Z' },
    ];
    const result = selectNextAction(baseSnapshot({ reviewStates }));
    expect(result.kind).not.toBe('review');
  });

  it('recommends the Learn stage of the first module (DAG order) when it has content and is not complete', () => {
    const modules: RoadmapModule[] = [
      {
        id: 'root',
        kind: 'algorithm',
        title: 'Root',
        summary: '',
        prerequisites: [],
        skills: [],
        stages: [{ type: 'learn', title: 'Learn', items: [{ type: 'lesson', lesson: { id: 'l', title: 'L', body: '' } }] }],
      },
    ];
    const result = selectNextAction(baseSnapshot({ modules }));
    expect(result).toEqual({ kind: 'learn', moduleId: 'root', moduleTitle: 'Root', href: '/modules/root/learn' });
  });

  it('skips a Learn stage with no lessons authored yet (a ghost module) straight to its exercises', () => {
    const modules: RoadmapModule[] = [
      {
        id: 'root',
        kind: 'algorithm',
        title: 'Root',
        summary: '',
        prerequisites: [],
        skills: [],
        stages: [
          { type: 'learn', title: 'Learn', items: [] },
          { type: 'algorithm_drills', title: 'Drills', items: [{ type: 'question', questionId: 'q1' }] },
        ],
      },
    ];
    const questions = [fakeQuestion('q1', 'root')];
    const result = selectNextAction(baseSnapshot({ modules, questions }));
    expect(result).toEqual({
      kind: 'exercise',
      moduleId: 'root',
      moduleTitle: 'Root',
      questionId: 'q1',
      questionTitle: 'Question q1',
      href: '/questions/q1',
    });
  });

  it('skips a completed Learn stage and recommends the first unsolved exercise', () => {
    const modules: RoadmapModule[] = [
      {
        id: 'root',
        kind: 'data_structure',
        title: 'Root',
        summary: '',
        prerequisites: [],
        skills: [],
        stages: [
          { type: 'learn', title: 'Learn', items: [{ type: 'lesson', lesson: { id: 'l', title: 'L', body: '' } }] },
          {
            type: 'guided_build',
            title: 'Guided Build',
            items: [
              { type: 'question', questionId: 'q1' },
              { type: 'question', questionId: 'q2' },
            ],
          },
        ],
      },
    ];
    const questions = [fakeQuestion('q1', 'root'), fakeQuestion('q2', 'root')];
    const attempts = [passingAttempt('q1')];
    const result = selectNextAction(
      baseSnapshot({ modules, questions, attempts, learnCompletions: new Set(['root']) }),
    );
    expect(result).toEqual({
      kind: 'exercise',
      moduleId: 'root',
      moduleTitle: 'Root',
      questionId: 'q2',
      questionTitle: 'Question q2',
      href: '/modules/root/guided-build/2',
    });
  });

  it('moves to the next module once the current one is fully solved', () => {
    const modules: RoadmapModule[] = [
      {
        id: 'first',
        kind: 'algorithm',
        title: 'First',
        summary: '',
        prerequisites: [],
        skills: [],
        stages: [{ type: 'algorithm_drills', title: 'Drills', items: [{ type: 'question', questionId: 'q1' }] }],
      },
      {
        id: 'second',
        kind: 'algorithm',
        title: 'Second',
        summary: '',
        prerequisites: ['first'],
        skills: [],
        stages: [{ type: 'algorithm_drills', title: 'Drills', items: [{ type: 'question', questionId: 'q2' }] }],
      },
    ];
    const questions = [fakeQuestion('q1', 'first'), fakeQuestion('q2', 'second')];
    const attempts = [passingAttempt('q1')];
    const result = selectNextAction(baseSnapshot({ modules, questions, attempts }));
    expect(result.kind).toBe('exercise');
    expect(result.kind === 'exercise' && result.moduleId).toBe('second');
  });

  it('returns "none" when every module has no content and nothing is due', () => {
    const modules: RoadmapModule[] = [
      { id: 'ghost', kind: 'algorithm', title: 'Ghost', summary: '', prerequisites: [], skills: [], stages: [] },
    ];
    const result = selectNextAction(baseSnapshot({ modules }));
    expect(result).toEqual({ kind: 'none' });
  });

  it('recommends an in-progress downstream module over an untouched earlier one in DAG order', () => {
    const modules: RoadmapModule[] = [
      {
        id: 'root',
        kind: 'algorithm',
        title: 'Root',
        summary: '',
        prerequisites: [],
        skills: [],
        stages: [{ type: 'learn', title: 'Learn', items: [{ type: 'lesson', lesson: { id: 'l', title: 'L', body: '' } }] }],
      },
      {
        id: 'downstream',
        kind: 'data_structure',
        title: 'Downstream',
        summary: '',
        prerequisites: ['root'],
        skills: [],
        stages: [
          { type: 'learn', title: 'Learn', items: [{ type: 'lesson', lesson: { id: 'l2', title: 'L2', body: '' } }] },
          { type: 'guided_build', title: 'Guided Build', items: [{ type: 'question', questionId: 'q1' }] },
        ],
      },
    ];
    const questions = [fakeQuestion('q1', 'downstream')];
    // root's Learn is untouched; downstream's Learn is complete (momentum) but its
    // Guided Build isn't — the amended policy should stick with downstream.
    const result = selectNextAction(baseSnapshot({ modules, questions, learnCompletions: new Set(['downstream']) }));
    expect(result.kind).toBe('exercise');
    expect(result.kind === 'exercise' && result.moduleId).toBe('downstream');
  });

  it('falls back to strict DAG order when nothing has been started anywhere', () => {
    const modules: RoadmapModule[] = [
      {
        id: 'root',
        kind: 'algorithm',
        title: 'Root',
        summary: '',
        prerequisites: [],
        skills: [],
        stages: [{ type: 'learn', title: 'Learn', items: [{ type: 'lesson', lesson: { id: 'l', title: 'L', body: '' } }] }],
      },
      {
        id: 'downstream',
        kind: 'data_structure',
        title: 'Downstream',
        summary: '',
        prerequisites: ['root'],
        skills: [],
        stages: [{ type: 'learn', title: 'Learn', items: [{ type: 'lesson', lesson: { id: 'l2', title: 'L2', body: '' } }] }],
      },
    ];
    const result = selectNextAction(baseSnapshot({ modules }));
    expect(result).toEqual({ kind: 'learn', moduleId: 'root', moduleTitle: 'Root', href: '/modules/root/learn' });
  });

  it('never restricts — its output is a recommendation only, callers must be free to ignore it', () => {
    // This is a documentation-style assertion: selectNextAction returns
    // plain data (no isLocked/disabled field of any kind).
    const result = selectNextAction(baseSnapshot());
    expect(result).not.toHaveProperty('disabled');
    expect(result).not.toHaveProperty('locked');
  });
});
