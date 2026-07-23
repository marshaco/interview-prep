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

/**
 * One snapshot of a class-mode structure's observable state, taken after a
 * scripted operation runs (ARCHITECTURE §9). Post-hoc replay data, not a
 * live debugger — the harness produces the whole sequence in one run.
 */
export interface VizFrame {
  step: number;
  label: string;
  state: Json;
}

/**
 * `kind` doubles as the renderer selector in ui/components/viz/ — new
 * structure kinds (tree, heap, graph) add a new `kind` value and a new
 * renderer, never touching the frame protocol itself or existing renderers.
 * `linked_list` assumes the class-under-test exposes `.head` and each node
 * exposes `.val`/`.next`, the convention every linked-list question in this
 * module already follows.
 */
export interface VisualizationBinding {
  kind: 'linked_list';
  demoScript: OpStep[];
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
  visualization?: VisualizationBinding; // optional (§9), class-mode only
  /**
   * Whether a passed attempt enters the spaced-review pool (Review system
   * spec §1). Convention, not a computed default: guided-build/guided-apply
   * steps are authored `false` (re-solving one method inside a pre-written
   * scaffold is low-value repetition); independent-build, method-drill, and
   * algorithm-drill questions are authored `true`. Required (not inferred
   * from stage type) so content/validate.ts can assert every question made
   * a deliberate choice, with no `if (stage === ...)` branching anywhere
   * that reads it.
   */
  reviewable: boolean;
  /**
   * Review-session "fast pass" threshold in ms — a clean pass under this
   * advances two rungs instead of one (Review system spec §2). Optional;
   * falls back to DEFAULT_FAST_THRESHOLD_MS (engine/srs/scheduler.ts).
   */
  reviewFastThresholdMs?: number;
  /**
   * Minutes a first-time solve is expected to take (Study plan spec §2) —
   * read only through `engine/plan/estimate.ts`'s `estimateMinutes`, never
   * directly, so a later calibration pass can replace content estimates
   * with the user's actual median solve time without any consumer
   * changing. Authoring convention (like `reviewable`), not a computed
   * default: guided-build/guided-apply steps 5, independent-build 15,
   * method/algorithm drills 20 — individual exercises may override.
   * CI-validated as a number in [1, 120].
   */
  estimatedMinutes: number;
}

// Grading result shapes. Defined here (not in engine/grading/types.ts, which
// re-exports these) because storage/types.ts's Attempt needs to store a
// Scorecard, and storage/ sits below engine/ in the layer order — it can't
// import from engine/. These three only reference other types already in
// this file, so they have no engine-runner-specific dependency anyway.

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
  script?: OpStep[];
  failedStepIndex?: number;
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

// --- Module / stage content model (ARCHITECTURE §4.1-§4.4) ---

export type ModuleKind = 'data_structure' | 'algorithm';
export type ModuleCategory = 'Data Structures' | 'Algorithms'; // display grouping; derived 1:1 from kind

export type StageType =
  | 'learn' // both kinds
  | 'guided_build' // data_structure only
  | 'independent_build' // data_structure only
  | 'method_drills' // data_structure only
  | 'guided_apply' // algorithm only
  | 'algorithm_drills'; // algorithm only

/** One box in a static illustrative diagram — a lesson aid, not user data. */
export interface SequenceDiagramNode {
  value: string | number;
  label?: string; // small caption under the box, e.g. "head", "left", "top"
  highlight?: boolean;
}

/**
 * A static, hand-authored illustration for a Learn-stage lesson — boxes
 * optionally linked by arrows (a linked list / stack), optionally circular
 * (a circular linked list), with optional pointer labels (two pointers).
 * Unlike VizFrame (§9), this never depends on user code — it's fixed
 * content, rendered once, the same for every learner.
 */
export interface SequenceDiagramSpec {
  nodes: SequenceDiagramNode[];
  connected?: boolean; // draw arrows between consecutive boxes
  circular?: boolean; // loop the last box's arrow back to the first
  caption?: string;
}

/**
 * A lesson figure the learner can manipulate instead of just reading (Triecode
 * UI spec §9) — local component state, never touches user code or storage.
 * `kind` selects the renderer in ui/components/viz/InteractiveFigure.tsx, the
 * same "kind doubles as renderer selector" pattern VisualizationBinding uses:
 * a new figure adds a new `kind` value and a new renderer, nothing else.
 */
export interface InteractiveFigureBinding {
  kind: 'stack_push_pop';
}

export interface LessonSection {
  id: string;
  title: string;
  body: string; // markdown
  diagram?: SequenceDiagramSpec;
  interactiveFigure?: InteractiveFigureBinding;
}

export type StageItem = { type: 'lesson'; lesson: LessonSection } | { type: 'question'; questionId: QuestionId };

export interface Stage {
  type: StageType;
  title: string;
  items: StageItem[];
}

export interface Skill {
  id: SkillId;
  moduleId: ModuleId;
  title: string;
  kind: 'method' | 'full_structure' | 'algorithm_application' | 'concept';
}

export interface RoadmapModule {
  id: ModuleId;
  kind: ModuleKind;
  title: string;
  summary: string;
  prerequisites: ModuleId[];
  stages: Stage[];
  skills: Skill[];
}
