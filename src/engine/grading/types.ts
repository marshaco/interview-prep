import type { Json, OpStep, TestGroup, VizFrame } from '../../content/types';

// Fraction/TestFailure/Scorecard/VizFrame live in content/types.ts, not here:
// Attempt (storage/types.ts) needs to store a Scorecard, and storage/ sits
// below engine/ in the layer order, so it can't import from engine/. Since
// those types only reference other content/types.ts data (no engine-runner
// specifics), they're defined there and re-exported here so every existing
// import site (grade.ts, ui/) keeps working unchanged.
export type { Fraction, TestFailure, Scorecard, VizFrame } from '../../content/types';

export interface TestCaseReportEntry {
  id: string;
  group: TestGroup;
  passed: boolean;
  label?: string;
  error?: string;
  // Only populated for the 'visible' group — hidden/edge failures must not
  // reveal their literal input, per ARCHITECTURE §6.4.

  // function mode:
  args?: Json[];
  expected?: Json;
  got?: Json;

  // class mode: `expected`/`got` above are reused for the diverging step's
  // expect value vs what the method actually returned.
  script?: OpStep[];
  failedStepIndex?: number;
}

/**
 * What the UI sees on RunResult.report — only present when status is 'ok'.
 * `frames` is populated only by a trace harness (engine/grading/trace.ts);
 * a grading harness always leaves it undefined, and vice versa `results` is
 * always empty for a trace run.
 */
export interface TestReport {
  results: TestCaseReportEntry[];
  frames?: VizFrame[];
}

/**
 * The raw JSON the harness prints between sentinels. Distinguishes
 * syntax/runtime failures (which short-circuit before any test runs) from a
 * normal 'ok' run. Internal to the runner — never exposed as RunResult.report.
 */
export interface HarnessReport {
  status: 'ok' | 'syntax_error' | 'runtime_error';
  message: string | null;
  results: TestCaseReportEntry[];
  frames?: VizFrame[];
}
