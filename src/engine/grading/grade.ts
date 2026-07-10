import type { RunResult } from '../runner/types';
import type { Fraction, Scorecard, TestFailure } from './types';
import type { QuestionId } from '../../content/types';

function fractionOf(passedCount: number, total: number): Fraction {
  return { correct: passedCount, total };
}

function fractionScore(fraction: Fraction): number {
  return fraction.total === 0 ? 1 : fraction.correct / fraction.total;
}

/**
 * Converts a completed RunResult (status 'ok', report present) into a
 * Scorecard. Callers should handle non-'ok' statuses (timeout, syntax_error,
 * runtime_error, cancelled) separately — there is no per-test scorecard to
 * show when the code never finished running.
 */
export function grade(questionId: QuestionId, result: RunResult): Scorecard {
  const entries = result.report?.results ?? [];

  const correctnessEntries = entries.filter((e) => e.group === 'visible' || e.group === 'hidden');
  const edgeEntries = entries.filter((e) => e.group === 'edge');

  const correctness = fractionOf(correctnessEntries.filter((e) => e.passed).length, correctnessEntries.length);
  const edgeCases = fractionOf(edgeEntries.filter((e) => e.passed).length, edgeEntries.length);

  const overall = Math.round(70 * fractionScore(correctness) + 30 * fractionScore(edgeCases));

  const failures: TestFailure[] = entries
    .filter((e) => !e.passed)
    .map((e) => ({
      id: e.id,
      group: e.group,
      label: e.label,
      error: e.error,
      args: e.args,
      expected: e.expected,
      got: e.got,
    }));

  return {
    questionId,
    correctness,
    edgeCases,
    overall,
    failures,
    style: null,
    readability: null,
    complexity: null,
  };
}
