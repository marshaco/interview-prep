export type ModuleId = string;
export type SkillId = string;
export type QuestionId = string;

export type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

/**
 * How a JSON value maps to/from the Python value the harness passes into or
 * reads back from the user's function. Linked-list method drills operate on
 * real ListNode objects, not plain JSON, so the harness converts around the
 * call. `linked_list_with_cycle` args are `{ values: number[], cyclePos:
 * number | null }` — cyclePos wires the tail's `next` back to that index.
 * Only meaningful in function mode — class-mode methods take/return plain
 * values directly (the instance itself holds the structure).
 */
export type IoType = 'value' | 'linked_list' | 'linked_list_with_cycle';

export type TestGroup = 'visible' | 'hidden' | 'edge';

export type ComparatorKind = 'deep' | 'unordered' | 'float_close' | 'checker';

/** One call in a class-mode script, e.g. { op: 'append', args: [1] } or { op: 'to_list', expect: [1] }. */
export interface OpStep {
  op: string;
  args?: Json[];
  expect?: Json;
}

export interface TestCase {
  id: string;
  group: TestGroup;
  comparator: ComparatorKind;
  /**
   * Category label shown for hidden/edge failures ("empty list", "single
   * node") without revealing the literal input, per ARCHITECTURE §6.4.
   * Not required for visible tests since their literal input is always shown.
   */
  label?: string;
  /** Required iff comparator === 'checker': a Python fn body, given `got` and `expected`, returning bool. */
  checker?: string;

  // function mode only:
  args?: Json[];
  expected?: Json;

  // class mode only — whole-script pass/fail: every `expect` step must match
  // for the TestCase to pass.
  script?: OpStep[];
}

export interface HarnessSpec {
  mode: 'function' | 'class';
  entryPoint: string; // function name, or class name in class mode
  argTypes?: IoType[]; // function mode only
  resultType?: IoType; // function mode only
  tests: TestCase[];
}

export interface CodeQuestion {
  id: QuestionId;
  kind: 'method_impl' | 'full_impl' | 'algorithm_problem' | 'debugging';
  moduleId: ModuleId;
  skillIds: SkillId[];
  title: string;
  prompt: string; // markdown
  starterCode: string;
  solution: string; // canonical solution, also run through its own harness in CI
  hints: [string, string, string, string]; // nudge -> concept -> pseudocode -> near-solution
  spec: HarnessSpec;
}
