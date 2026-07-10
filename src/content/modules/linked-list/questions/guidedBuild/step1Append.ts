import type { CodeQuestion } from '../../../../types';

export const step1Append: CodeQuestion = {
  id: 'linked-list/guided-build/1-append',
  kind: 'method_impl',
  moduleId: 'linked-list',
  skillIds: ['linked-list/append'],
  title: 'Guided Build 1/4: append',
  prompt: `## Guided Build 1 of 4: append

You're building the \`LinkedList\` class one method at a time. \`Node\`,
\`__init__\`, and \`to_list\` are already written and working — \`to_list\` is
your readout for every test in this stage, so you can see the effect of
each method you add.

Implement \`append(value)\`: attach a new node holding \`value\` to the end
of the list.
`,
  starterCode: `class Node:
    def __init__(self, val):
        self.val = val
        self.next = None


class LinkedList:
    def __init__(self):
        self.head = None

    def append(self, value):
        # TODO: attach a new node holding value to the end of the list.
        pass

    def to_list(self):
        result = []
        cur = self.head
        while cur is not None:
            result.append(cur.val)
            cur = cur.next
        return result
`,
  solution: `class Node:
    def __init__(self, val):
        self.val = val
        self.next = None


class LinkedList:
    def __init__(self):
        self.head = None

    def append(self, value):
        node = Node(value)
        if self.head is None:
            self.head = node
            return
        cur = self.head
        while cur.next is not None:
            cur = cur.next
        cur.next = node

    def to_list(self):
        result = []
        cur = self.head
        while cur is not None:
            result.append(cur.val)
            cur = cur.next
        return result
`,
  hints: [
    'You\'ve written this exact walk before in the append method drill — the only difference is the list lives on self.head instead of being passed in and returned.',
    'Handle self.head being None first: an empty list just becomes the new node.',
    'Otherwise, walk with a `cur` pointer starting at self.head until `cur.next is None`, then attach the new node there.',
    'node = Node(value); if self.head is None: self.head = node; return. Otherwise cur = self.head; while cur.next is not None: cur = cur.next; then cur.next = node.',
  ],
  spec: {
    mode: 'class',
    entryPoint: 'LinkedList',
    tests: [
      {
        id: 'append-three',
        group: 'visible',
        comparator: 'deep',
        script: [
          { op: 'append', args: [1] },
          { op: 'append', args: [2] },
          { op: 'append', args: [3] },
          { op: 'to_list', expect: [1, 2, 3] },
        ],
      },
      {
        id: 'append-to-empty',
        group: 'visible',
        comparator: 'deep',
        script: [
          { op: 'append', args: [5] },
          { op: 'to_list', expect: [5] },
        ],
      },
      {
        id: 'append-two',
        group: 'hidden',
        comparator: 'deep',
        label: 'append multiple values',
        script: [
          { op: 'append', args: [1] },
          { op: 'append', args: [2] },
          { op: 'to_list', expect: [1, 2] },
        ],
      },
      {
        id: 'append-duplicate-values',
        group: 'hidden',
        comparator: 'deep',
        label: 'duplicate values',
        script: [
          { op: 'append', args: [7] },
          { op: 'append', args: [7] },
          { op: 'to_list', expect: [7, 7] },
        ],
      },
      {
        id: 'empty-list',
        group: 'edge',
        comparator: 'deep',
        label: 'empty list, to_list before any append',
        script: [{ op: 'to_list', expect: [] }],
      },
      {
        id: 'append-falsy-value',
        group: 'edge',
        comparator: 'deep',
        label: 'appended value is falsy (0)',
        script: [
          { op: 'append', args: [0] },
          { op: 'to_list', expect: [0] },
        ],
      },
    ],
  },
};
