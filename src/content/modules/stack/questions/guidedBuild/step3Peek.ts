import type { CodeQuestion } from '../../../../types';

export const step3Peek: CodeQuestion = {
  id: 'stack/guided-build/3-peek',
  kind: 'method_impl',
  moduleId: 'stack',
  skillIds: ['stack/peek'],
  title: 'peek',
  prompt: `## Guided Build 3 of 4: peek

\`push\` and \`pop\` are done. Now implement \`peek()\`: return the top item
**without** removing it. Assume \`peek\` is never called on an empty stack.
`,
  starterCode: `class Stack:
    def __init__(self):
        self.items = []

    def push(self, value):
        self.items.append(value)

    def pop(self):
        return self.items.pop()

    def peek(self):
        # TODO: return the top item without removing it.

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

    def to_list(self):
        return list(self.items)
`,
  hints: [
    'This is almost identical to pop — the only difference is the item stays on the stack afterward.',
    'Indexing the last element of a list (self.items[-1]) reads it without removing anything.',
    'return self.items[-1] — no .pop() call, since that would remove the item.',
    'def peek(self): return self.items[-1].',
  ],
  spec: {
    mode: 'class',
    entryPoint: 'Stack',
    tests: [
      {
        id: 'peek-after-push',
        group: 'visible',
        comparator: 'deep',
        script: [
          { op: 'push', args: [1] },
          { op: 'push', args: [2] },
          { op: 'peek', expect: 2 },
          { op: 'to_list', expect: [1, 2] },
        ],
      },
      {
        id: 'peek-does-not-remove',
        group: 'visible',
        comparator: 'deep',
        script: [
          { op: 'push', args: [5] },
          { op: 'peek', expect: 5 },
          { op: 'peek', expect: 5 },
          { op: 'to_list', expect: [5] },
        ],
      },
      {
        id: 'peek-after-pop',
        group: 'hidden',
        comparator: 'deep',
        label: 'peek reflects the new top after a pop',
        script: [
          { op: 'push', args: [1] },
          { op: 'push', args: [2] },
          { op: 'pop', expect: 2 },
          { op: 'peek', expect: 1 },
        ],
      },
      {
        id: 'peek-after-multiple-pushes',
        group: 'hidden',
        comparator: 'deep',
        label: 'peek after several pushes',
        script: [
          { op: 'push', args: [1] },
          { op: 'push', args: [2] },
          { op: 'push', args: [3] },
          { op: 'peek', expect: 3 },
        ],
      },
      {
        id: 'peek-duplicate-values',
        group: 'edge',
        comparator: 'deep',
        label: 'duplicate values',
        script: [
          { op: 'push', args: [4] },
          { op: 'push', args: [4] },
          { op: 'peek', expect: 4 },
        ],
      },
      {
        id: 'peek-falsy-value',
        group: 'edge',
        comparator: 'deep',
        label: 'top value is falsy (0)',
        script: [
          { op: 'push', args: [0] },
          { op: 'peek', expect: 0 },
        ],
      },
    ],
  },
  reviewable: false,
};
