// @vitest-environment node
//
// Runs every visualization-bound question's canonical `solution` through its
// own trace harness in a real Python interpreter (Pyodide), mirroring
// canonicalSolutions.test.ts's rigor but for the trace-frame protocol
// (ARCHITECTURE §9) instead of grading. Proves trace.ts's duck-typed
// `.head`/`.next` walk actually produces the frames LinkedListView expects,
// not just that the generated Python has the right shape.
import { describe, expect, it, beforeAll } from 'vitest';
import { loadPyodide, type PyodideInterface } from 'pyodide';
import { questions } from './registry';
import { buildTraceHarness } from '../engine/grading/trace';
import type { HarnessReport } from '../engine/grading/types';

const SENTINEL_PATTERN = /([0-9a-fA-F-]{36})([\s\S]*)\1/;

// Expected final-frame state for each visualization-bound question's demo
// script, hand-verified against the demoScript authored alongside it.
const EXPECTED_FINAL_STATE: Record<string, unknown[]> = {
  'linked-list/guided-build/1-append': [1, 2, 3],
  'linked-list/guided-build/2-prepend': [0, 1, 2],
  'linked-list/guided-build/3-delete': [1, 3],
  'linked-list/build-singly-linked-list': [0, 1, 3],
  'linked-list/build-doubly-linked-list': [0, 1, 3],
  'linked-list/build-circular-linked-list': [1, 2, 3, 4, '<cycle>'],
};

describe('visualization-bound canonical solutions trace correctly', () => {
  let pyodide: PyodideInterface;

  beforeAll(async () => {
    pyodide = await loadPyodide();
  }, 60_000);

  const visualizedQuestions = questions.filter((q) => q.visualization);

  it('covers every question this test file knows the expected final state for', () => {
    expect(visualizedQuestions.map((q) => q.id).sort()).toEqual(Object.keys(EXPECTED_FINAL_STATE).sort());
  });

  for (const question of visualizedQuestions) {
    it(`${question.id}`, async () => {
      const visualization = question.visualization;
      if (!visualization) throw new Error('filtered above; unreachable');

      const harness = buildTraceHarness(question.spec, visualization.demoScript);

      const stdoutChunks: string[] = [];
      const stderrChunks: string[] = [];
      pyodide.setStdout({ batched: (text) => stdoutChunks.push(text) });
      pyodide.setStderr({ batched: (text) => stderrChunks.push(text) });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call -- pyodide's own .d.ts isn't fully resolved by eslint's type-aware parser here; tsc typechecks this file cleanly.
      pyodide.globals.set('__user_code__', question.solution);

      await pyodide.runPythonAsync(harness);

      const rawStdout = stdoutChunks.join('\n');
      const match = SENTINEL_PATTERN.exec(rawStdout);
      if (!match) {
        throw new Error(`harness produced no report; stderr:\n${stderrChunks.join('\n')}`);
      }

      const report = JSON.parse(match[2] ?? '') as HarnessReport;
      if (report.status !== 'ok') {
        throw new Error(`harness reported ${report.status}: ${report.message ?? '(no message)'}`);
      }

      const frames = report.frames ?? [];
      expect(frames).toHaveLength(visualization.demoScript.length);
      expect(frames.at(-1)?.state).toEqual(EXPECTED_FINAL_STATE[question.id]);
    }, 30_000);
  }
});
