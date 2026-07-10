// @vitest-environment node
//
// Runs every question's canonical `solution` through its own generated
// harness in a real Python interpreter (Pyodide, loaded from local
// node_modules — not the CDN — so this doesn't depend on network access in
// CI). This is the actual behavioural proof that harness.ts, comparators.ts,
// and every shipped question's tests are internally consistent; the
// string-level tests elsewhere only check the generated Python's shape.
//
// Pinned to the same Pyodide version the browser worker loads from the CDN
// (see workers/pyodide.worker.ts) so this validates against the same Python
// semantics real users run against.
import { describe, expect, it, beforeAll } from 'vitest';
import { loadPyodide, type PyodideInterface } from 'pyodide';
import { questions } from './registry';
import { buildHarness } from '../engine/grading/harness';
import type { HarnessReport } from '../engine/grading/types';

const SENTINEL_PATTERN = /([0-9a-fA-F-]{36})([\s\S]*)\1/;

describe('canonical solutions score 100% through their own harness', () => {
  let pyodide: PyodideInterface;

  beforeAll(async () => {
    pyodide = await loadPyodide();
  }, 60_000);

  for (const question of questions) {
    it(`${question.id}`, async () => {
      const harness = buildHarness(question.spec);

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

      const failures = report.results.filter((r) => !r.passed);
      if (failures.length > 0) {
        throw new Error(`canonical solution failed tests:\n${JSON.stringify(failures, null, 2)}`);
      }
      expect(failures).toEqual([]);
    }, 30_000);
  }
});
