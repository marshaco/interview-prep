import type { CodeQuestion } from '../../../../types';

export const step1Push: CodeQuestion = {
  id: 'stack/guided-build/1-push',
  kind: 'method_impl',
  moduleId: 'stack',
  skillIds: ['stack/push'],
  title: 'push',
  prompt: `## Guided Build 1 of 4: push

You're building a \`Stack\` class one method at a time, backed by a plain
Python list. \`__init__\` and \`to_list\` are already written — \`to_list\`
is your readout for every test in this stage, bottom of the stack first.

Implement \`push(value)\`: add \`value\` to the top of the stack.
`,
  starterCode: `class Stack:
    def __init__(self):
        self.items = []

    def push(self, value):
        # TODO: add value to the top of the stack.

    def to_list(self):
        return list(self.items)
`,
  solution: `class Stack:
    def __init__(self):
        self.items = []

    def push(self, value):
        self.items.append(value)

    def to_list(self):
        return list(self.items)
`,
  hints: [
    'The top of the stack is one end of the underlying list — pick whichever end has an O(1) insert.',
    'Python\'s list.append() adds to the end in O(1) amortized; that end is your top.',
    'self.items.append(value) is the entire method.',
    'def push(self, value): self.items.append(value).',
  ],
  spec: {
    mode: 'class',
    entryPoint: 'Stack',
    tests: [
      {
        id: 'push-three',
        group: 'visible',
        comparator: 'deep',
        script: [
          { op: 'push', args: [1] },
          { op: 'push', args: [2] },
          { op: 'push', args: [3] },
          { op: 'to_list', expect: [1, 2, 3] },
        ],
      },
      {
        id: 'push-one',
        group: 'visible',
        comparator: 'deep',
        script: [
          { op: 'push', args: [5] },
          { op: 'to_list', expect: [5] },
        ],
      },
      {
        id: 'push-many',
        group: 'hidden',
        comparator: 'deep',
        label: 'push several values',
        script: [
          { op: 'push', args: [1] },
          { op: 'push', args: [2] },
          { op: 'push', args: [3] },
          { op: 'push', args: [4] },
          { op: 'to_list', expect: [1, 2, 3, 4] },
        ],
      },
      {
        id: 'push-duplicate-values',
        group: 'hidden',
        comparator: 'deep',
        label: 'duplicate values',
        script: [
          { op: 'push', args: [7] },
          { op: 'push', args: [7] },
          { op: 'to_list', expect: [7, 7] },
        ],
      },
      {
        id: 'empty-stack',
        group: 'edge',
        comparator: 'deep',
        label: 'empty stack, to_list before any push',
        script: [{ op: 'to_list', expect: [] }],
      },
      {
        id: 'push-falsy-value',
        group: 'edge',
        comparator: 'deep',
        label: 'pushed value is falsy (0)',
        script: [
          { op: 'push', args: [0] },
          { op: 'to_list', expect: [0] },
        ],
      },
    ],
  },
  reviewable: false,
};
