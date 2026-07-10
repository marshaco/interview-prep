import { describe, expect, it } from 'vitest';
import { validateQuestion, validateRegistry } from './validate';
import { questions } from './registry';
import type { CodeQuestion } from './types';

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
