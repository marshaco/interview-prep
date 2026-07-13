import type { CodeQuestion, ModuleId, ModuleKind, QuestionId, RoadmapModule, StageType } from './types';

export function validateQuestion(question: CodeQuestion): string[] {
  const errors: string[] = [];
  const prefix = question.id || '<missing id>';

  if (!question.id) {
    errors.push('question has no id');
  }
  // Widen past the 4-tuple type: this check exists for content that might
  // one day be loaded from non-TS-checked data, where the tuple guarantee
  // wouldn't hold — TS's static narrowing would otherwise mark this dead code.
  const hints: readonly string[] = question.hints;
  if (hints.length !== 4) {
    errors.push(`${prefix}: hints must have exactly 4 entries, got ${hints.length}`);
  }

  const spec = question.spec;
  if (!spec.entryPoint) {
    errors.push(`${prefix}: spec.entryPoint must be non-empty`);
  }

  if (question.visualization && spec.mode !== 'class') {
    errors.push(`${prefix}: visualization binding requires spec.mode 'class' (the trace harness snapshots an instance)`);
  }
  if (question.visualization && question.visualization.demoScript.length === 0) {
    errors.push(`${prefix}: visualization.demoScript must not be empty`);
  }
  if (spec.tests.length === 0) {
    errors.push(`${prefix}: spec.tests must not be empty`);
  }

  const seenTestIds = new Set<string>();
  for (const test of spec.tests) {
    if (seenTestIds.has(test.id)) {
      errors.push(`${prefix}: duplicate test id '${test.id}'`);
    }
    seenTestIds.add(test.id);

    if (test.comparator === 'checker' && !test.checker) {
      errors.push(`${prefix}: test '${test.id}' uses comparator 'checker' but has no checker body`);
    }

    if (spec.mode === 'function') {
      if (test.args === undefined || test.expected === undefined) {
        errors.push(`${prefix}: function-mode test '${test.id}' must have both args and expected`);
      }
      if (!spec.argTypes || !spec.resultType) {
        errors.push(`${prefix}: function-mode spec must have argTypes and resultType`);
      } else if (test.args && test.args.length !== spec.argTypes.length) {
        errors.push(
          `${prefix}: test '${test.id}' has ${test.args.length} args but spec.argTypes has ${spec.argTypes.length}`,
        );
      }
    }

    if (spec.mode === 'class') {
      if (!test.script || test.script.length === 0) {
        errors.push(`${prefix}: class-mode test '${test.id}' must have a non-empty script`);
      } else {
        for (const [index, step] of test.script.entries()) {
          if (!step.op) {
            errors.push(`${prefix}: test '${test.id}' step ${index} has no op`);
          }
        }
      }
    }
  }

  return errors;
}

export function validateRegistry(questions: CodeQuestion[]): string[] {
  const errors: string[] = [];

  const seenIds = new Set<string>();
  for (const question of questions) {
    if (seenIds.has(question.id)) {
      errors.push(`duplicate question id '${question.id}'`);
    }
    seenIds.add(question.id);
    errors.push(...validateQuestion(question));
  }

  return errors;
}

// Per ARCHITECTURE §4.3 / the ModuleKind architecture invariant: a module's
// stages must match its kind's template exactly. Mismatches (e.g. an
// `algorithm` module with `guided_build`) fail validation — never
// special-cased in the engine or UI.
const ALLOWED_STAGE_TYPES: Record<ModuleKind, StageType[]> = {
  data_structure: ['learn', 'guided_build', 'independent_build', 'method_drills', 'interview_mode'],
  algorithm: ['learn', 'guided_apply', 'algorithm_drills', 'interview_mode'],
};

export function validateModule(module: RoadmapModule, questionIds: ReadonlySet<QuestionId>): string[] {
  const errors: string[] = [];
  const prefix = module.id || '<missing module id>';

  const allowedTypes: readonly StageType[] = ALLOWED_STAGE_TYPES[module.kind];
  for (const stage of module.stages) {
    if (!allowedTypes.includes(stage.type)) {
      errors.push(`${prefix}: stage type '${stage.type}' is not valid for kind '${module.kind}'`);
    }
    for (const item of stage.items) {
      if (item.type === 'question' && !questionIds.has(item.questionId)) {
        errors.push(`${prefix}: stage '${stage.type}' references unknown question '${item.questionId}'`);
      }
    }
  }

  if (module.skills.length === 0) {
    errors.push(`${prefix}: module has no skills`);
  }
  for (const skill of module.skills) {
    if (skill.moduleId !== module.id) {
      errors.push(`${prefix}: skill '${skill.id}' has moduleId '${skill.moduleId}', expected '${module.id}'`);
    }
  }

  return errors;
}

export function validateModuleRegistry(modules: RoadmapModule[], questions: CodeQuestion[]): string[] {
  const questionIds = new Set(questions.map((q) => q.id));
  const errors: string[] = [];

  const seenIds = new Set<string>();
  for (const module of modules) {
    if (seenIds.has(module.id)) {
      errors.push(`duplicate module id '${module.id}'`);
    }
    seenIds.add(module.id);
    errors.push(...validateModule(module, questionIds));
  }

  return errors;
}

// The fixed 18-node V1 catalog per ARCHITECTURE §4.1 — 6 Data Structures, 12
// Algorithms. Checked by id (not just count) so a typo'd id fails loudly
// instead of silently swapping in an unexpected node.
const EXPECTED_MODULE_IDS: ModuleId[] = [
  'stack',
  'linked-list',
  'trees',
  'tries',
  'heap-pq',
  'graphs',
  'arrays-hashing',
  'two-pointers',
  'binary-search',
  'sliding-window',
  'backtracking',
  'intervals',
  'greedy',
  'advanced-graphs',
  'dp-1d',
  'dp-2d',
  'bit-manipulation',
  'math-geometry',
];

function findDagCycle(modules: RoadmapModule[]): ModuleId | null {
  const byId = new Map(modules.map((m) => [m.id, m]));
  const state = new Map<ModuleId, 'visiting' | 'done'>();

  function visit(id: ModuleId): ModuleId | null {
    const current = state.get(id);
    if (current === 'done') return null;
    if (current === 'visiting') return id;

    state.set(id, 'visiting');
    const module = byId.get(id);
    if (module) {
      for (const prereqId of module.prerequisites) {
        const cyclePoint = visit(prereqId);
        if (cyclePoint) return cyclePoint;
      }
    }
    state.set(id, 'done');
    return null;
  }

  for (const module of modules) {
    const cyclePoint = visit(module.id);
    if (cyclePoint) return cyclePoint;
  }
  return null;
}

/** DAG integrity: all 18 catalog ids present, no dangling prerequisite edges, no cycles. */
export function validateDag(modules: RoadmapModule[]): string[] {
  const errors: string[] = [];
  const idSet = new Set(modules.map((m) => m.id));

  for (const id of EXPECTED_MODULE_IDS) {
    if (!idSet.has(id)) {
      errors.push(`roadmap DAG is missing expected module '${id}'`);
    }
  }
  const expectedSet = new Set(EXPECTED_MODULE_IDS);
  for (const id of idSet) {
    if (!expectedSet.has(id)) {
      errors.push(`roadmap DAG has module '${id}' not in the 18-module V1 catalog`);
    }
  }

  for (const module of modules) {
    for (const prereqId of module.prerequisites) {
      if (!idSet.has(prereqId)) {
        errors.push(`${module.id}: prerequisite '${prereqId}' does not reference a known module`);
      }
    }
  }

  const cyclePoint = findDagCycle(modules);
  if (cyclePoint) {
    errors.push(`roadmap DAG has a cycle involving '${cyclePoint}'`);
  }

  return errors;
}
