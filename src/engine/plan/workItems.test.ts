import { describe, expect, it } from 'vitest';
import { remainingWorkItems } from './workItems';
import type { CodeQuestion, RoadmapModule } from '../../content/types';

const TODAY = '2026-01-05';

function fakeQuestion(id: string, moduleId: string): CodeQuestion {
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
  };
}

describe('remainingWorkItems', () => {
  it('lists the Learn stage before any exercise, then exercises in ladder order', () => {
    const q1 = fakeQuestion('m1/q1', 'm1');
    const q2 = fakeQuestion('m1/q2', 'm1');
    const modules: RoadmapModule[] = [
      {
        id: 'm1',
        kind: 'algorithm',
        title: 'M1',
        summary: '',
        prerequisites: [],
        skills: [],
        stages: [
          { type: 'learn', title: 'Learn', items: [{ type: 'lesson', lesson: { id: 'l', title: 'L', body: '' } }] },
          {
            type: 'algorithm_drills',
            title: 'Drills',
            items: [
              { type: 'question', questionId: 'm1/q1' },
              { type: 'question', questionId: 'm1/q2' },
            ],
          },
        ],
      },
    ];

    const items = remainingWorkItems(modules, [q1, q2], [], new Set(), TODAY);

    expect(items).toEqual([
      { kind: 'learn', moduleId: 'm1' },
      { kind: 'exercise', moduleId: 'm1', questionId: 'm1/q1', title: 'm1/q1' },
      { kind: 'exercise', moduleId: 'm1', questionId: 'm1/q2', title: 'm1/q2' },
    ]);
  });

  it('is empty when every in-scope item is already solved/complete', () => {
    const q1 = fakeQuestion('m1/q1', 'm1');
    const modules: RoadmapModule[] = [
      { id: 'm1', kind: 'algorithm', title: 'M1', summary: '', prerequisites: [], skills: [], stages: [{ type: 'algorithm_drills', title: 'Drills', items: [{ type: 'question', questionId: 'm1/q1' }] }] },
    ];
    const attempts = [
      {
        id: 'a1',
        questionId: 'm1/q1',
        code: '',
        scorecard: { questionId: 'm1/q1', correctness: { correct: 1, total: 1 }, edgeCases: { correct: 1, total: 1 }, overall: 100, failures: [], style: null, readability: null, complexity: null },
        hintsUsed: 0,
        durationMs: 0,
        createdAt: '2026-01-01T00:00:00.000Z',
        context: 'practice' as const,
      },
    ];

    expect(remainingWorkItems(modules, [q1], attempts, new Set(), TODAY)).toEqual([]);
  });

  it('moves to the next module once the current one is fully solved', () => {
    const q1 = fakeQuestion('first/q1', 'first');
    const q2 = fakeQuestion('second/q1', 'second');
    const modules: RoadmapModule[] = [
      { id: 'first', kind: 'algorithm', title: 'First', summary: '', prerequisites: [], skills: [], stages: [{ type: 'algorithm_drills', title: 'D', items: [{ type: 'question', questionId: 'first/q1' }] }] },
      { id: 'second', kind: 'algorithm', title: 'Second', summary: '', prerequisites: ['first'], skills: [], stages: [{ type: 'algorithm_drills', title: 'D', items: [{ type: 'question', questionId: 'second/q1' }] }] },
    ];

    const items = remainingWorkItems(modules, [q1, q2], [], new Set(), TODAY);

    expect(items).toEqual([
      { kind: 'exercise', moduleId: 'first', questionId: 'first/q1', title: 'first/q1' },
      { kind: 'exercise', moduleId: 'second', questionId: 'second/q1', title: 'second/q1' },
    ]);
  });
});
