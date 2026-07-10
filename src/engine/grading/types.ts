import type { Json, QuestionId, TestGroup } from '../../content/types';

export interface TestCaseReportEntry {
  id: string;
  group: TestGroup;
  passed: boolean;
  label?: string;
  error?: string;
  // Only populated for the 'visible' group — hidden/edge failures must not
  // reveal their literal input, per ARCHITECTURE §6.4.
  args?: Json[];
  expected?: Json;
  got?: Json;
}

/** What the UI sees on RunResult.report — only present when status is 'ok'. */
export interface TestReport {
  results: TestCaseReportEntry[];
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
}

export interface Fraction {
  correct: number;
  total: number;
}

export interface TestFailure {
  id: string;
  group: TestGroup;
  label?: string;
  error?: string;
  args?: Json[];
  expected?: Json;
  got?: Json;
}

export interface Scorecard {
  questionId: QuestionId;
  correctness: Fraction; // visible + hidden groups
  edgeCases: Fraction; // edge group
  overall: number; // 0-100, weighted 70/30 correctness/edgeCases
  failures: TestFailure[];
  // Reserved, null in V1 — populated when AI review / complexity analysis land.
  style: null;
  readability: null;
  complexity: null;
}
