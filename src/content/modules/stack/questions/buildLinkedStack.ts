import type { CodeQuestion } from '../../../types';

export const buildLinkedStack: CodeQuestion = {
  id: 'stack/build-linked-stack',
  kind: 'full_impl',
  moduleId: 'stack',
  skillIds: ['stack/full-build-linked'],
  title: 'Build: Stack (linked-list-backed)',
  prompt: `## Build a full Stack class (linked-list-backed)

Implement the same \`Stack\` behavior as before, but backed by singly
linked nodes instead of a Python list. Track a \`top\` pointer:

- \`push(value)\` — attach a new node in front of \`top\`
- \`pop()\` — remove and return the value at \`top\`
- \`peek()\` — return the value at \`top\` without removing it
- \`is_empty()\` — return \`True\`/\`False\`
- \`to_list()\` — return the contents bottom-to-top as a plain Python list

Grading only checks the observable behavior — from the outside, this
should be indistinguishable from the list-backed version.
`,
  starterCode: `class Node:
    def __init__(self, val):
        self.val = val
        self.next = None


class Stack:
    def __init__(self):
        self.top = None

    def push(self, value):
        # TODO

    def pop(self):
        # TODO

    def peek(self):
        # TODO

    def is_empty(self):
        # TODO

    def to_list(self):
        # TODO: bottom-to-top, so walk from top and reverse.
`,
  solution: `class Node:
    def __init__(self, val):
        self.val = val
        self.next = None


class Stack:
    def __init__(self):
        self.top = None

    def push(self, value):
        node = Node(value)
        node.next = self.top
        self.top = node

    def pop(self):
        value = self.top.val
        self.top = self.top.next
        return value

    def peek(self):
        return self.top.val

    def is_empty(self):
        return self.top is None

    def to_list(self):
        result = []
        cur = self.top
        while cur is not None:
            result.append(cur.val)
            cur = cur.next
        return result[::-1]
`,
  hints: [
    'This is prepend/delete-the-head from the Linked List module, wearing different method names — push is prepend, pop is remove-and-return-the-head.',
    'top being None is the empty-stack case everywhere — is_empty is just that check, and push/pop must handle top starting out None.',
    'to_list walks from top via .next, which visits top-to-bottom — reverse the result to get bottom-to-top, matching the list-backed version\'s output.',
    'push: node.next = self.top; self.top = node. pop: value = self.top.val; self.top = self.top.next; return value. peek: return self.top.val. is_empty: return self.top is None. to_list: walk collecting .val, then reverse.',
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
};
