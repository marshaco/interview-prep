import { describe, expect, it } from 'vitest';
import { computeExerciseScore, computeModuleMastery, computeSkillScore } from './mastery';
import type { CodeQuestion, RoadmapModule } from '../../content/types';
import type { Attempt } from '../../storage/types';

function fakeAttempt(overrides: Partial<Attempt> & { questionId: string }): Attempt {
  return {
    id: crypto.randomUUID(),
    code: '',
    scorecard: { questionId: overrides.questionId, correctness: { correct: 1, total: 1 }, edgeCases: { correct: 1, total: 1 }, overall: 100, failures: [], style: null, readability: null, complexity: null },
    hintsUsed: 0,
    durationMs: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function passing(questionId: string, createdAt: string, hintsUsed = 0): Attempt {
  return fakeAttempt({ questionId, createdAt, hintsUsed, scorecard: { questionId, correctness: { correct: 1, total: 1 }, edgeCases: { correct: 1, total: 1 }, overall: 100, failures: [], style: null, readability: null, complexity: null } });
}

function failing(questionId: string, createdAt: string): Attempt {
  return fakeAttempt({ questionId, createdAt, scorecard: { questionId, correctness: { correct: 0, total: 1 }, edgeCases: { correct: 0, total: 1 }, overall: 40, failures: [], style: null, readability: null, complexity: null } });
}

function fakeQuestion(id: string, skillIds: string[]): CodeQuestion {
  return {
    id,
    kind: 'method_impl',
    moduleId: 'm',
    skillIds,
    title: id,
    prompt: '',
    starterCode: '',
    solution: '',
    hints: ['a', 'b', 'c', 'd'],
    spec: { mode: 'function', entryPoint: 'fn', argTypes: [], resultType: 'value', tests: [] },
  };
}

describe('computeExerciseScore', () => {
  it('is 0 for a question that has never been attempted', () => {
    expect(computeExerciseScore([])).toBe(0);
  });

  it('is 0 when every attempt failed', () => {
    expect(computeExerciseScore([failing('q1', '2026-01-01T00:00:00.000Z')])).toBe(0);
  });

  it('is 1.0 for a clean solve: no hints, passes on the first submit', () => {
    expect(computeExerciseScore([passing('q1', '2026-01-01T00:00:00.000Z')])).toBe(1);
  });

  it('decays by 0.85 per hint used on the passing attempt', () => {
    const score = computeExerciseScore([passing('q1', '2026-01-01T00:00:00.000Z', 2)]);
    expect(score).toBeCloseTo(0.85 ** 2, 10);
  });

  it('decays by 0.9 per failed submit before the eventual pass', () => {
    const attempts = [
      failing('q1', '2026-01-01T00:00:00.000Z'),
      failing('q1', '2026-01-02T00:00:00.000Z'),
      passing('q1', '2026-01-03T00:00:00.000Z'),
    ];
    expect(computeExerciseScore(attempts)).toBeCloseTo(0.9 ** 2, 10);
  });

  it('floors the score at 0.4 for any eventual pass, however many hints/fails it took', () => {
    const attempts = [
      failing('q1', '2026-01-01T00:00:00.000Z'),
      failing('q1', '2026-01-02T00:00:00.000Z'),
      failing('q1', '2026-01-03T00:00:00.000Z'),
      failing('q1', '2026-01-04T00:00:00.000Z'),
      passing('q1', '2026-01-05T00:00:00.000Z', 4),
    ];
    expect(computeExerciseScore(attempts)).toBe(0.4);
  });

  it('only counts failures strictly before the first pass, ignoring attempts after it', () => {
    const attempts = [
      passing('q1', '2026-01-01T00:00:00.000Z'),
      failing('q1', '2026-01-02T00:00:00.000Z'), // a later re-attempt that happens to fail
    ];
    expect(computeExerciseScore(attempts)).toBe(1);
  });

  it('is order-independent — attempts may be passed in any order', () => {
    const attempts = [passing('q1', '2026-01-03T00:00:00.000Z'), failing('q1', '2026-01-01T00:00:00.000Z')];
    const reversed = [...attempts].reverse();
    expect(computeExerciseScore(attempts)).toBe(computeExerciseScore(reversed));
  });
});

describe('computeModuleMastery', () => {
  function fakeModule(overrides: Partial<RoadmapModule> = {}): RoadmapModule {
    return {
      id: 'm',
      kind: 'data_structure',
      title: 'M',
      summary: '',
      prerequisites: [],
      skills: [],
      stages: [
        { type: 'guided_build', title: 'Guided Build', items: [{ type: 'question', questionId: 'q1' }, { type: 'question', questionId: 'q2' }] },
      ],
      ...overrides,
    };
  }

  it('is 0 for a module with no exercises and no Learn stage', () => {
    const module = fakeModule({ stages: [] });
    expect(computeModuleMastery(module, [], false)).toBe(0);
  });

  it('is the mean of exercise scores when there is no Learn stage', () => {
    const module = fakeModule();
    const attempts = [passing('q1', '2026-01-01T00:00:00.000Z'), failing('q2', '2026-01-01T00:00:00.000Z')];
    expect(computeModuleMastery(module, attempts, false)).toBe(0.5);
  });

  it('counts a completed Learn stage as one more exercise-equivalent', () => {
    const module = fakeModule({
      stages: [
        { type: 'learn', title: 'Learn', items: [{ type: 'lesson', lesson: { id: 'l', title: 'L', body: '' } }] },
        { type: 'guided_build', title: 'Guided Build', items: [{ type: 'question', questionId: 'q1' }] },
      ],
    });
    const attempts = [passing('q1', '2026-01-01T00:00:00.000Z')];
    // Learn complete (1) + q1 passed clean (1) -> mean = 1
    expect(computeModuleMastery(module, attempts, true)).toBe(1);
    // Learn not complete (0) + q1 passed clean (1) -> mean = 0.5
    expect(computeModuleMastery(module, attempts, false)).toBe(0.5);
  });

  it('does not count an empty Learn stage (no lessons authored yet) as an exercise-equivalent', () => {
    const module = fakeModule({
      stages: [
        { type: 'learn', title: 'Learn', items: [] },
        { type: 'guided_build', title: 'Guided Build', items: [{ type: 'question', questionId: 'q1' }] },
      ],
    });
    const attempts = [passing('q1', '2026-01-01T00:00:00.000Z')];
    expect(computeModuleMastery(module, attempts, true)).toBe(1);
  });
});

describe('computeSkillScore', () => {
  it('is 0 when no question is tagged with this skill', () => {
    expect(computeSkillScore('ghost/skill', [fakeQuestion('q1', ['other'])], [])).toBe(0);
  });

  it('is the mean exercise score across every question tagged with the skill', () => {
    const questions = [fakeQuestion('q1', ['s']), fakeQuestion('q2', ['s'])];
    const attempts = [passing('q1', '2026-01-01T00:00:00.000Z'), failing('q2', '2026-01-01T00:00:00.000Z')];
    expect(computeSkillScore('s', questions, attempts)).toBe(0.5);
  });

  it('ignores questions tagged with other skills', () => {
    const questions = [fakeQuestion('q1', ['s']), fakeQuestion('q2', ['other'])];
    const attempts = [passing('q1', '2026-01-01T00:00:00.000Z'), failing('q2', '2026-01-01T00:00:00.000Z')];
    expect(computeSkillScore('s', questions, attempts)).toBe(1);
  });
});
