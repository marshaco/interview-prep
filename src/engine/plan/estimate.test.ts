import { describe, expect, it } from 'vitest';
import { estimateMinutes } from './estimate';
import type { CodeQuestion } from '../../content/types';

function fakeQuestion(estimatedMinutes: number): CodeQuestion {
  return {
    id: 'q1',
    kind: 'method_impl',
    moduleId: 'm',
    skillIds: [],
    title: 'q1',
    prompt: '',
    starterCode: '',
    solution: '',
    hints: ['a', 'b', 'c', 'd'],
    spec: { mode: 'function', entryPoint: 'fn', argTypes: [], resultType: 'value', tests: [] },
    reviewable: true,
    estimatedMinutes,
  };
}

describe('estimateMinutes', () => {
  it('returns the content estimate as-is in practice context', () => {
    expect(estimateMinutes(fakeQuestion(20), [], 'practice')).toBe(20);
  });

  it('defaults to practice context when none is given', () => {
    expect(estimateMinutes(fakeQuestion(20), [])).toBe(20);
  });

  it('scales the estimate by 0.6 in review context', () => {
    expect(estimateMinutes(fakeQuestion(20), [], 'review')).toBeCloseTo(12, 10);
  });
});
