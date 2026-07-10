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
 */
export type IoType = 'value' | 'linked_list' | 'linked_list_with_cycle';

export type TestGroup = 'visible' | 'hidden' | 'edge';

export interface TestCase {
  id: string;
  group: TestGroup;
  args: Json[];
  expected: Json;
  comparator: 'deep' | 'unordered';
  /**
   * Category label shown for hidden/edge failures ("empty list", "single
   * node") without revealing the literal input, per ARCHITECTURE §6.4.
   * Not required for visible tests since their literal input is always shown.
   */
  label?: string;
}

export interface HarnessSpec {
  mode: 'function'; // class mode (operation scripts) arrives in Phase 1
  entryPoint: string;
  argTypes: IoType[];
  resultType: IoType;
  tests: TestCase[];
}

export interface CodeQuestion {
  id: QuestionId;
  kind: 'method_impl' | 'full_impl' | 'pattern_problem' | 'debugging';
  moduleId: ModuleId;
  skillIds: SkillId[];
  title: string;
  prompt: string; // markdown
  starterCode: string;
  solution: string; // canonical solution, also run through its own harness in CI (Phase 1)
  hints: [string, string, string, string]; // nudge -> concept -> pseudocode -> near-solution
  spec: HarnessSpec;
}
