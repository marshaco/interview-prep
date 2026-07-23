import type { CodeQuestion } from '../../../types';

export const buildListBackedStack: CodeQuestion = {
  id: 'stack/build-list-backed-stack',
  kind: 'full_impl',
  moduleId: 'stack',
  skillIds: ['stack/full-build'],
  title: 'Build: Stack (list-backed)',
  prompt: `## Build a full Stack class (list-backed)

Implement a \`Stack\` class from scratch, storing its items in a plain
Python list:

- \`push(value)\` — add to the top
- \`pop()\` — remove and return the top item
- \`peek()\` — return the top item without removing it
- \`is_empty()\` — return \`True\`/\`False\`
- \`to_list()\` — return the contents bottom-to-top as a plain Python list

This is the same behavior as the Guided Build stage, assembled in one go.
`,
  starterCode: `class Stack:
    def __init__(self):
        self.items = []

    def push(self, value):
        # TODO

    def pop(self):
        # TODO

    def peek(self):
        # TODO

    def is_empty(self):
        # TODO

    def to_list(self):
        # TODO
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
    'The top of the stack is the end of the underlying list — push, pop, and peek all operate there.',
    'is_empty and to_list both read the list without mutating it; only push/pop change its length.',
    'This is exactly the four Guided Build methods assembled into one class — no new logic is needed beyond what you already wrote there.',
    'push: self.items.append(value). pop: return self.items.pop(). peek: return self.items[-1]. is_empty: return len(self.items) == 0. to_list: return list(self.items).',
  ],
  spec: {
    mode: 'class',
    entryPoint: 'Stack',
    tests: [
      {
        id: 'push-sequence',
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
        id: 'pop-and-peek',
        group: 'visible',
        comparator: 'deep',
        script: [
          { op: 'push', args: [1] },
          { op: 'push', args: [2] },
          { op: 'pop', expect: 2 },
          { op: 'peek', expect: 1 },
        ],
      },
      {
        id: 'is-empty-transitions',
        group: 'hidden',
        comparator: 'deep',
        label: 'is_empty reflects push/pop transitions',
        script: [
          { op: 'is_empty', expect: true },
          { op: 'push', args: [1] },
          { op: 'is_empty', expect: false },
          { op: 'pop', expect: 1 },
          { op: 'is_empty', expect: true },
        ],
      },
      {
        id: 'interleaved-operations',
        group: 'hidden',
        comparator: 'deep',
        label: 'interleaved push, pop, and peek',
        script: [
          { op: 'push', args: [1] },
          { op: 'push', args: [2] },
          { op: 'pop', expect: 2 },
          { op: 'push', args: [3] },
          { op: 'peek', expect: 3 },
          { op: 'to_list', expect: [1, 3] },
        ],
      },
      {
        id: 'empty-stack',
        group: 'edge',
        comparator: 'deep',
        label: 'empty stack',
        script: [
          { op: 'is_empty', expect: true },
          { op: 'to_list', expect: [] },
        ],
      },
      {
        id: 'push-pop-falsy-value',
        group: 'edge',
        comparator: 'deep',
        label: 'falsy value (0) pushed and popped',
        script: [
          { op: 'push', args: [0] },
          { op: 'peek', expect: 0 },
          { op: 'pop', expect: 0 },
          { op: 'is_empty', expect: true },
        ],
      },
    ],
  },
  reviewable: true,
  estimatedMinutes: 15,
};
