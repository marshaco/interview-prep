import { describe, expect, it } from 'vitest';
import { validateDag, validateModule, validateModuleRegistry, validateQuestion, validateRegistry } from './validate';
import { modules, questions } from './registry';
import type { CodeQuestion, RoadmapModule } from './types';

function baseQuestion(overrides: Partial<CodeQuestion> = {}): CodeQuestion {
  return {
    id: 'test/question',
    kind: 'method_impl',
    moduleId: 'test',
    skillIds: ['test/skill'],
    title: 'question',
    prompt: 'prompt',
    starterCode: 'pass',
    solution: 'pass',
    hints: ['a', 'b', 'c', 'd'],
    spec: {
      mode: 'function',
      entryPoint: 'fn',
      argTypes: ['value'],
      resultType: 'value',
      tests: [{ id: 't1', group: 'visible', args: [1], expected: 1, comparator: 'deep' }],
    },
    ...overrides,
  };
}

describe('validateQuestion', () => {
  it('accepts a well-formed function-mode question', () => {
    expect(validateQuestion(baseQuestion())).toEqual([]);
  });

  it('accepts a well-formed class-mode question', () => {
    const question = baseQuestion({
      spec: {
        mode: 'class',
        entryPoint: 'Thing',
        tests: [{ id: 't1', group: 'visible', comparator: 'deep', script: [{ op: 'append', args: [1] }] }],
      },
    });
    expect(validateQuestion(question)).toEqual([]);
  });

  it('flags a missing entryPoint', () => {
    const question = baseQuestion({ spec: { ...baseQuestion().spec, entryPoint: '' } });
    expect(validateQuestion(question).some((e) => e.includes('entryPoint'))).toBe(true);
  });

  it('flags a visualization binding on a function-mode question', () => {
    const question = baseQuestion({
      visualization: { kind: 'linked_list', demoScript: [{ op: 'append', args: [1] }] },
    });
    expect(validateQuestion(question).some((e) => e.includes("visualization binding requires spec.mode 'class'"))).toBe(
      true,
    );
  });

  it('accepts a visualization binding on a class-mode question', () => {
    const question = baseQuestion({
      spec: {
        mode: 'class',
        entryPoint: 'Thing',
        tests: [{ id: 't1', group: 'visible', comparator: 'deep', script: [{ op: 'append', args: [1] }] }],
      },
      visualization: { kind: 'linked_list', demoScript: [{ op: 'append', args: [1] }] },
    });
    expect(validateQuestion(question)).toEqual([]);
  });

  it('flags an empty demoScript on a visualization binding', () => {
    const question = baseQuestion({
      spec: {
        mode: 'class',
        entryPoint: 'Thing',
        tests: [{ id: 't1', group: 'visible', comparator: 'deep', script: [{ op: 'append', args: [1] }] }],
      },
      visualization: { kind: 'linked_list', demoScript: [] },
    });
    expect(validateQuestion(question).some((e) => e.includes('demoScript must not be empty'))).toBe(true);
  });

  it('flags an empty tests array', () => {
    const question = baseQuestion({ spec: { ...baseQuestion().spec, tests: [] } });
    expect(validateQuestion(question).some((e) => e.includes('tests must not be empty'))).toBe(true);
  });

  it('flags duplicate test ids within one question', () => {
    const question = baseQuestion({
      spec: {
        ...baseQuestion().spec,
        tests: [
          { id: 'dup', group: 'visible', args: [1], expected: 1, comparator: 'deep' },
          { id: 'dup', group: 'edge', args: [2], expected: 2, comparator: 'deep' },
        ],
      },
    });
    expect(validateQuestion(question).some((e) => e.includes("duplicate test id 'dup'"))).toBe(true);
  });

  it('flags a checker comparator with no checker body', () => {
    const question = baseQuestion({
      spec: {
        ...baseQuestion().spec,
        tests: [{ id: 't1', group: 'visible', args: [1], expected: 1, comparator: 'checker' }],
      },
    });
    expect(validateQuestion(question).some((e) => e.includes("comparator 'checker'"))).toBe(true);
  });

  it('flags a function-mode test missing args/expected', () => {
    const question = baseQuestion({
      spec: {
        ...baseQuestion().spec,
        tests: [{ id: 't1', group: 'visible', comparator: 'deep' }],
      },
    });
    expect(validateQuestion(question).some((e) => e.includes('must have both args and expected'))).toBe(true);
  });

  it('flags an args/argTypes length mismatch', () => {
    const question = baseQuestion({
      spec: {
        ...baseQuestion().spec,
        argTypes: ['value', 'value'],
        tests: [{ id: 't1', group: 'visible', args: [1], expected: 1, comparator: 'deep' }],
      },
    });
    expect(validateQuestion(question).some((e) => e.includes('has 1 args but spec.argTypes has 2'))).toBe(true);
  });

  it('flags a class-mode test with an empty script', () => {
    const question = baseQuestion({
      spec: { mode: 'class', entryPoint: 'Thing', tests: [{ id: 't1', group: 'visible', comparator: 'deep', script: [] }] },
    });
    expect(validateQuestion(question).some((e) => e.includes('non-empty script'))).toBe(true);
  });

  it('flags a script step with no op', () => {
    const question = baseQuestion({
      spec: {
        mode: 'class',
        entryPoint: 'Thing',
        tests: [{ id: 't1', group: 'visible', comparator: 'deep', script: [{ op: '' }] }],
      },
    });
    expect(validateQuestion(question).some((e) => e.includes('has no op'))).toBe(true);
  });

  it('flags a hints array with the wrong length', () => {
    // TS's tuple type prevents constructing this directly; validate.ts guards
    // against it anyway in case content is ever loaded from non-TS-checked data.
    const question = baseQuestion({ hints: ['a', 'b', 'c'] as unknown as CodeQuestion['hints'] });
    expect(validateQuestion(question).some((e) => e.includes('hints must have exactly 4 entries'))).toBe(true);
  });
});

describe('validateRegistry', () => {
  it('flags duplicate question ids across the registry', () => {
    const q1 = baseQuestion({ id: 'dup' });
    const q2 = baseQuestion({ id: 'dup' });
    expect(validateRegistry([q1, q2]).some((e) => e.includes("duplicate question id 'dup'"))).toBe(true);
  });

  it('the real content registry has no validation errors', () => {
    expect(validateRegistry(questions)).toEqual([]);
  });
});

function baseModule(overrides: Partial<RoadmapModule> = {}): RoadmapModule {
  return {
    id: 'test-module',
    kind: 'data_structure',
    title: 'Test Module',
    summary: 'summary',
    prerequisites: [],
    skills: [{ id: 'test-module/skill', moduleId: 'test-module', title: 'skill', kind: 'method' }],
    stages: [{ type: 'learn', title: 'Learn', items: [] }],
    ...overrides,
  };
}

describe('validateModule', () => {
  it('accepts a well-formed data_structure module', () => {
    const module = baseModule({
      stages: [
        { type: 'learn', title: 'Learn', items: [] },
        { type: 'guided_build', title: 'Guided Build', items: [{ type: 'question', questionId: 'q1' }] },
        { type: 'independent_build', title: 'Independent Build', items: [] },
        { type: 'method_drills', title: 'Method Drills', items: [] },
      ],
    });
    expect(validateModule(module, new Set(['q1']))).toEqual([]);
  });

  it('accepts a well-formed algorithm module', () => {
    const module = baseModule({
      kind: 'algorithm',
      stages: [
        { type: 'learn', title: 'Learn', items: [] },
        { type: 'guided_apply', title: 'Guided Apply', items: [] },
        { type: 'algorithm_drills', title: 'Algorithm Drills', items: [] },
      ],
    });
    expect(validateModule(module, new Set())).toEqual([]);
  });

  it('flags a data_structure-only stage type on an algorithm module', () => {
    const module = baseModule({
      kind: 'algorithm',
      stages: [{ type: 'guided_build', title: 'Guided Build', items: [] }],
    });
    expect(validateModule(module, new Set()).some((e) => e.includes("stage type 'guided_build'"))).toBe(true);
  });

  it('flags an algorithm-only stage type on a data_structure module', () => {
    const module = baseModule({
      kind: 'data_structure',
      stages: [{ type: 'algorithm_drills', title: 'Algorithm Drills', items: [] }],
    });
    expect(validateModule(module, new Set()).some((e) => e.includes("stage type 'algorithm_drills'"))).toBe(true);
  });

  it('flags a stage item referencing an unknown question', () => {
    const module = baseModule({
      stages: [{ type: 'method_drills', title: 'Method Drills', items: [{ type: 'question', questionId: 'ghost' }] }],
    });
    expect(validateModule(module, new Set()).some((e) => e.includes("unknown question 'ghost'"))).toBe(true);
  });

  it('flags a module with no skills', () => {
    const module = baseModule({ skills: [] });
    expect(validateModule(module, new Set()).some((e) => e.includes('has no skills'))).toBe(true);
  });

  it("flags a skill whose moduleId doesn't match its owning module", () => {
    const module = baseModule({
      skills: [{ id: 'test-module/skill', moduleId: 'other-module', title: 'skill', kind: 'method' }],
    });
    expect(validateModule(module, new Set()).some((e) => e.includes("moduleId 'other-module'"))).toBe(true);
  });
});

describe('validateModuleRegistry', () => {
  it('flags duplicate module ids', () => {
    const m1 = baseModule({ id: 'dup' });
    const m2 = baseModule({ id: 'dup' });
    expect(validateModuleRegistry([m1, m2], []).some((e) => e.includes("duplicate module id 'dup'"))).toBe(true);
  });

  it('the real module registry has no validation errors', () => {
    expect(validateModuleRegistry(modules, questions)).toEqual([]);
  });
});

function baseDagModule(overrides: Partial<RoadmapModule> = {}): RoadmapModule {
  return {
    id: 'm',
    kind: 'data_structure',
    title: 'm',
    summary: 's',
    prerequisites: [],
    skills: [],
    stages: [],
    ...overrides,
  };
}

describe('validateDag', () => {
  it('flags a missing expected catalog id', () => {
    const incomplete = modules.filter((m) => m.id !== 'math-geometry');
    expect(validateDag(incomplete).some((e) => e.includes("missing expected module 'math-geometry'"))).toBe(true);
  });

  it('flags a module id outside the 18-module catalog', () => {
    const extra = [...modules, baseDagModule({ id: 'not-in-catalog' })];
    expect(validateDag(extra).some((e) => e.includes("'not-in-catalog' not in the 18-module"))).toBe(true);
  });

  it('flags a dangling prerequisite edge', () => {
    const broken = modules.map((m) => (m.id === 'stack' ? { ...m, prerequisites: ['does-not-exist'] } : m));
    expect(broken.find((m) => m.id === 'stack')).toBeDefined();
    expect(validateDag(broken).some((e) => e.includes("prerequisite 'does-not-exist'"))).toBe(true);
  });

  it('flags a cycle', () => {
    const a = baseDagModule({ id: 'a', prerequisites: ['b'] });
    const b = baseDagModule({ id: 'b', prerequisites: ['a'] });
    expect(validateDag([a, b]).some((e) => e.includes('has a cycle'))).toBe(true);
  });

  it('the real 18-module catalog has a clean DAG', () => {
    expect(validateDag(modules)).toEqual([]);
  });
});
