import type { Skill } from '../../types';

export const stackSkills: Skill[] = [
  { id: 'stack/push', moduleId: 'stack', title: 'push()', kind: 'method' },
  { id: 'stack/pop', moduleId: 'stack', title: 'pop()', kind: 'method' },
  { id: 'stack/peek', moduleId: 'stack', title: 'peek()', kind: 'method' },
  { id: 'stack/is-empty', moduleId: 'stack', title: 'is_empty()', kind: 'method' },
  { id: 'stack/valid-parentheses', moduleId: 'stack', title: 'Valid parentheses', kind: 'concept' },
  { id: 'stack/monotonic-stack', moduleId: 'stack', title: 'Monotonic stack', kind: 'concept' },
  { id: 'stack/expression-evaluation', moduleId: 'stack', title: 'Expression evaluation', kind: 'concept' },
  { id: 'stack/full-build', moduleId: 'stack', title: 'Build: Stack (list-backed)', kind: 'full_structure' },
  { id: 'stack/full-build-linked', moduleId: 'stack', title: 'Build: Stack (linked-list-backed)', kind: 'full_structure' },
  { id: 'stack/min-stack', moduleId: 'stack', title: 'Build: MinStack', kind: 'full_structure' },
];
