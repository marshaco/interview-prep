import type { CodeQuestion } from '../../../../types';

export const step4IsEmpty: CodeQuestion = {
  id: 'stack/guided-build/4-is-empty',
  kind: 'method_impl',
  moduleId: 'stack',
  skillIds: ['stack/is-empty'],
  title: 'is_empty',
  prompt: `## Guided Build 4 of 4: is_empty

Last method. Implement \`is_empty()\`: return \`True\` if the stack has no
items, \`False\` otherwise. Once this passes, your \`Stack\` class is
complete — the same shape as the Independent Build questions in the next
stage.
`,
  starterCode: `class Stack:
    def __init__(self):
        self.items = []

    def push(self, value):
        self.items.append(value)

    def pop(self):
        return self.items.pop()

    def peek(self):
        return self.items[-1]

    def is_empty(self):
        # TODO: return True if the stack has no items.

    def to_list(self):
        return list(self.items)
`,
  solution: `class Stack:
    def __init__(self):
        self.items = []

    def push(self, value):
        self.items.append(value)

    def pop(self):
        return self.items.pop()

    def peek(self):
        return self.items[-1]

    def is_empty(self):
        return len(self.items) == 0

    def to_list(self):
        return list(self.items)
`,
  hints: [
    'You already have a container that knows its own length.',
    'An empty list has length 0 — no need to track a separate counter.',
    'return len(self.items) == 0.',
    'def is_empty(self): return len(self.items) == 0.',
  ],
  spec: {
    mode: 'class',
    entryPoint: 'Stack',
    tests: [
      {
        id: 'empty-on-init',
        group: 'visible',
        comparator: 'deep',
        script: [{ op: 'is_empty', expect: true }],
      },
      {
        id: 'not-empty-after-push',
        group: 'visible',
        comparator: 'deep',
        script: [
          { op: 'push', args: [1] },
          { op: 'is_empty', expect: false },
        ],
      },
      {
        id: 'empty-after-pop-only-item',
        group: 'hidden',
        comparator: 'deep',
        label: 'empty again after popping the only item',
        script: [
          { op: 'push', args: [1] },
          { op: 'pop', expect: 1 },
          { op: 'is_empty', expect: true },
        ],
      },
      {
        id: 'not-empty-with-several-items',
        group: 'hidden',
        comparator: 'deep',
        label: 'not empty with several items on the stack',
        script: [
          { op: 'push', args: [1] },
          { op: 'push', args: [2] },
          { op: 'push', args: [3] },
          { op: 'is_empty', expect: false },
        ],
      },
      {
        id: 'empty-after-pushing-and-popping-all',
        group: 'edge',
        comparator: 'deep',
        label: 'empty after pushing and popping every item',
        script: [
          { op: 'push', args: [1] },
          { op: 'push', args: [2] },
          { op: 'pop', expect: 2 },
          { op: 'pop', expect: 1 },
          { op: 'is_empty', expect: true },
        ],
      },
      {
        id: 'not-empty-with-falsy-value',
        group: 'edge',
        comparator: 'deep',
        label: 'not empty when the only item is falsy (0)',
        script: [
          { op: 'push', args: [0] },
          { op: 'is_empty', expect: false },
        ],
      },
    ],
  },
};
