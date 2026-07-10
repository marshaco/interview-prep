import { describe, expect, it } from 'vitest';
import { grade } from './grade';
import type { RunResult } from '../runner/types';
import type { TestCaseReportEntry } from './types';

function okResult(results: TestCaseReportEntry[]): RunResult {
  return {
    runId: 'run-1',
    status: 'ok',
    stdout: '',
    stderr: '',
    report: { results },
    durationMs: 10,
  };
}

describe('grade', () => {
  it('scores correctness from visible+hidden and edgeCases from edge, weighted 70/30', () => {
    const result = okResult([
      { id: 'v1', group: 'visible', passed: true, args: [[1]], expected: [1], got: [1] },
      { id: 'h1', group: 'hidden', passed: true },
      { id: 'h2', group: 'hidden', passed: false, label: 'longer list' },
      { id: 'e1', group: 'edge', passed: true, label: 'empty list' },
    ]);

    const scorecard = grade('linked-list/append', result);

    expect(scorecard.correctness).toEqual({ correct: 2, total: 3 });
    expect(scorecard.edgeCases).toEqual({ correct: 1, total: 1 });
    // 70 * (2/3) + 30 * (1/1) = 46.666... + 30 = 76.67 -> rounds to 77
    expect(scorecard.overall).toBe(77);
  });

  it('treats an empty group as full credit rather than dividing by zero', () => {
    const result = okResult([{ id: 'v1', group: 'visible', passed: true, args: [[1]], expected: [1], got: [1] }]);
    const scorecard = grade('linked-list/append', result);
    expect(scorecard.edgeCases).toEqual({ correct: 0, total: 0 });
    expect(scorecard.overall).toBe(100);
  });

  it('carries literal args/expected/got through for visible failures', () => {
    const result = okResult([
      { id: 'v1', group: 'visible', passed: false, args: [[1, 2], 3], expected: [1, 2, 3], got: [1, 2] },
    ]);
    const scorecard = grade('linked-list/append', result);
    expect(scorecard.failures).toEqual([
      { id: 'v1', group: 'visible', label: undefined, error: undefined, args: [[1, 2], 3], expected: [1, 2, 3], got: [1, 2] },
    ]);
  });

  it('never leaks literal input for hidden/edge failures, only the category label', () => {
    const result = okResult([
      { id: 'h1', group: 'hidden', passed: false, label: 'duplicate values' },
      { id: 'e1', group: 'edge', passed: false, label: 'empty list', error: 'IndexError: pop from empty list' },
    ]);
    const scorecard = grade('linked-list/append', result);

    expect(scorecard.failures).toHaveLength(2);
    for (const failure of scorecard.failures) {
      expect(failure.args).toBeUndefined();
      expect(failure.expected).toBeUndefined();
      expect(failure.got).toBeUndefined();
    }
    expect(scorecard.failures[0]?.label).toBe('duplicate values');
    expect(scorecard.failures[1]?.error).toBe('IndexError: pop from empty list');
  });

  it('carries script/failedStepIndex through for class-mode visible failures', () => {
    const result = okResult([
      {
        id: 'v1',
        group: 'visible',
        passed: false,
        script: [{ op: 'append', args: [1] }, { op: 'to_list', expect: [1, 2] }],
        failedStepIndex: 1,
        expected: [1, 2],
        got: [1],
      },
    ]);
    const scorecard = grade('linked-list/build-singly-linked-list', result);
    expect(scorecard.failures[0]?.script).toEqual([{ op: 'append', args: [1] }, { op: 'to_list', expect: [1, 2] }]);
    expect(scorecard.failures[0]?.failedStepIndex).toBe(1);
  });

  it('reserves style/readability/complexity as null', () => {
    const scorecard = grade('linked-list/append', okResult([]));
    expect(scorecard.style).toBeNull();
    expect(scorecard.readability).toBeNull();
    expect(scorecard.complexity).toBeNull();
  });
});
