import type { CodeQuestion } from '../../../types';

export const buildMinStack: CodeQuestion = {
  id: 'stack/build-min-stack',
  kind: 'full_impl',
  moduleId: 'stack',
  skillIds: ['stack/min-stack'],
  title: 'Build: MinStack',
  prompt: `## Build a full MinStack class

Implement a \`MinStack\` class supporting \`push\`, \`pop\`, \`top\`, and
\`get_min\` — all in O(1):

- \`push(value)\` — add to the top
- \`pop()\` — remove and return the top item
- \`top()\` — return the top item without removing it
- \`get_min()\` — return the minimum value currently on the stack

The naive \`get_min\` re-scans the whole stack — O(n). Do better: keep a
**second stack** tracking the running minimum alongside the main one, so
every operation stays O(1).
`,
  starterCode: `class MinStack:
    def __init__(self):
        self.items = []
        self.mins = []

    def push(self, value):
        # TODO: push value, and push the new running minimum onto self.mins.
        pass

    def pop(self):
        # TODO: pop from both stacks; return the popped value.
        pass

    def top(self):
        # TODO
        pass

    def get_min(self):
        # TODO
        pass
`,
  solution: `class MinStack:
    def __init__(self):
        self.items = []
        self.mins = []

    def push(self, value):
        self.items.append(value)
        if not self.mins or value <= self.mins[-1]:
            self.mins.append(value)
        else:
            self.mins.append(self.mins[-1])

    def pop(self):
        self.mins.pop()
        return self.items.pop()

    def top(self):
        return self.items[-1]

    def get_min(self):
        return self.mins[-1]
`,
  hints: [
    'Re-scanning for the minimum on every get_min call is O(n) — you need the answer ready in O(1), which means tracking it as you go.',
    'Push onto self.mins every single time you push onto self.items — even when the new value isn\'t a new minimum — so the two stacks always stay the same length and pop in lock-step.',
    'When pushing, the new running minimum is value if self.mins is empty or value <= self.mins[-1], otherwise it stays self.mins[-1]. pop must pop both stacks together.',
    'push: self.items.append(value); self.mins.append(value if not self.mins or value <= self.mins[-1] else self.mins[-1]). pop: self.mins.pop(); return self.items.pop(). top: return self.items[-1]. get_min: return self.mins[-1].',
  ],
  spec: {
    mode: 'class',
    entryPoint: 'MinStack',
    tests: [
      {
        id: 'classic-example',
        group: 'visible',
        comparator: 'deep',
        script: [
          { op: 'push', args: [-2] },
          { op: 'push', args: [0] },
          { op: 'push', args: [-3] },
          { op: 'get_min', expect: -3 },
          { op: 'pop', expect: -3 },
          { op: 'top', expect: 0 },
          { op: 'get_min', expect: -2 },
        ],
      },
      {
        id: 'increasing-values',
        group: 'visible',
        comparator: 'deep',
        script: [
          { op: 'push', args: [1] },
          { op: 'push', args: [2] },
          { op: 'get_min', expect: 1 },
          { op: 'top', expect: 2 },
        ],
      },
      {
        id: 'duplicate-minimum',
        group: 'hidden',
        comparator: 'deep',
        label: 'minimum value pushed more than once',
        script: [
          { op: 'push', args: [5] },
          { op: 'push', args: [3] },
          { op: 'push', args: [3] },
          { op: 'get_min', expect: 3 },
          { op: 'pop', expect: 3 },
          { op: 'get_min', expect: 3 },
          { op: 'pop', expect: 3 },
          { op: 'get_min', expect: 5 },
        ],
      },
      {
        id: 'minimum-drops-then-recovers',
        group: 'hidden',
        comparator: 'deep',
        label: 'minimum changes as values are popped',
        script: [
          { op: 'push', args: [3] },
          { op: 'push', args: [1] },
          { op: 'push', args: [2] },
          { op: 'get_min', expect: 1 },
          { op: 'pop', expect: 2 },
          { op: 'get_min', expect: 1 },
          { op: 'pop', expect: 1 },
          { op: 'get_min', expect: 3 },
        ],
      },
      {
        id: 'single-element',
        group: 'edge',
        comparator: 'deep',
        label: 'single element on the stack',
        script: [
          { op: 'push', args: [4] },
          { op: 'get_min', expect: 4 },
          { op: 'top', expect: 4 },
          { op: 'pop', expect: 4 },
        ],
      },
      {
        id: 'negative-and-zero',
        group: 'edge',
        comparator: 'deep',
        label: 'negative values and zero',
        script: [
          { op: 'push', args: [-1] },
          { op: 'push', args: [0] },
          { op: 'get_min', expect: -1 },
          { op: 'top', expect: 0 },
        ],
      },
    ],
  },
};
