import type { CodeQuestion, ModuleKind, QuestionId, RoadmapModule, StageType } from './types';

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
