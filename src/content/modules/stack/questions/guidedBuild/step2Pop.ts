import type { CodeQuestion } from '../../../../types';

export const step2Pop: CodeQuestion = {
  id: 'stack/guided-build/2-pop',
  kind: 'method_impl',
  moduleId: 'stack',
  skillIds: ['stack/pop'],
  title: 'Guided Build 2/4: pop',
  prompt: `## Guided Build 2 of 4: pop

\`push\` is done. Now implement \`pop()\`: remove and return the top item.
Assume \`pop\` is never called on an empty stack.
`,
  starterCode: `class Stack:
    def __init__(self):
        self.items = []

    def push(self, value):
        self.items.append(value)

    def pop(self):
        # TODO: remove and return the top item.
        pass

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

    def to_list(self):
        return list(self.items)
`,
  hints: [
    'The top is the same end you pushed onto — pop from that same end.',
    'Python\'s list.pop() with no argument removes and returns the last element in O(1).',
    'self.items.pop() both removes the top item and returns it — no separate read-then-remove needed.',
    'def pop(self): return self.items.pop().',
  ],
  spec: {
    mode: 'class',
    entryPoint: 'Stack',
    tests: [
      {
        id: 'push-then-pop',
        group: 'visible',
        comparator: 'deep',
        script: [
          { op: 'push', args: [1] },
          { op: 'push', args: [2] },
          { op: 'pop', expect: 2 },
          { op: 'to_list', expect: [1] },
        ],
      },
      {
        id: 'pop-only-item',
        group: 'visible',
        comparator: 'deep',
        script: [
          { op: 'push', args: [5] },
          { op: 'pop', expect: 5 },
          { op: 'to_list', expect: [] },
        ],
      },
      {
        id: 'pop-twice',
        group: 'hidden',
        comparator: 'deep',
        label: 'pop twice in a row',
        script: [
          { op: 'push', args: [1] },
          { op: 'push', args: [2] },
          { op: 'push', args: [3] },
          { op: 'pop', expect: 3 },
          { op: 'pop', expect: 2 },
          { op: 'to_list', expect: [1] },
        ],
      },
      {
        id: 'push-pop-push',
        group: 'hidden',
        comparator: 'deep',
        label: 'interleaved push and pop',
        script: [
          { op: 'push', args: [1] },
          { op: 'pop', expect: 1 },
          { op: 'push', args: [2] },
          { op: 'to_list', expect: [2] },
        ],
      },
      {
        id: 'pop-duplicate-values',
        group: 'edge',
        comparator: 'deep',
        label: 'duplicate values',
        script: [
          { op: 'push', args: [9] },
          { op: 'push', args: [9] },
          { op: 'pop', expect: 9 },
          { op: 'to_list', expect: [9] },
        ],
      },
      {
        id: 'pop-falsy-value',
        group: 'edge',
        comparator: 'deep',
        label: 'popped value is falsy (0)',
        script: [
          { op: 'push', args: [0] },
          { op: 'pop', expect: 0 },
          { op: 'to_list', expect: [] },
        ],
      },
    ],
  },
};
