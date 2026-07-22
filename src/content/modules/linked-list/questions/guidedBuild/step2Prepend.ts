import type { CodeQuestion } from '../../../../types';

export const step2Prepend: CodeQuestion = {
  id: 'linked-list/guided-build/2-prepend',
  kind: 'method_impl',
  moduleId: 'linked-list',
  skillIds: ['linked-list/prepend'],
  title: 'prepend',
  prompt: `## Guided Build 2 of 4: prepend

\`append\` is done. Now implement \`prepend(value)\`: attach a new node
holding \`value\` to the **front** of the list.
`,
  starterCode: `class Node:
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

    def prepend(self, value):
        # TODO: attach a new node holding value to the front of the list.
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

    def prepend(self, value):
        node = Node(value)
        node.next = self.head
        self.head = node

    def to_list(self):
        result = []
        cur = self.head
        while cur is not None:
            result.append(cur.val)
            cur = cur.next
        return result
`,
  hints: [
    'No walking needed this time — the new node just needs to point at whatever self.head currently is.',
    'A node\'s .next can be set at construction time; you don\'t have to build it and wire .next as a separate step.',
    'node = Node(value); node.next = self.head; then self.head = node.',
    'def prepend(self, value): node = Node(value); node.next = self.head; self.head = node.',
  ],
  visualization: {
    kind: 'linked_list',
    demoScript: [
      { op: 'append', args: [1] },
      { op: 'append', args: [2] },
      { op: 'prepend', args: [0] },
    ],
  },
  spec: {
    mode: 'class',
    entryPoint: 'LinkedList',
    tests: [
      {
        id: 'prepend-onto-append',
        group: 'visible',
        comparator: 'deep',
        script: [
          { op: 'append', args: [1] },
          { op: 'prepend', args: [0] },
          { op: 'to_list', expect: [0, 1] },
        ],
      },
      {
        id: 'prepend-twice',
        group: 'visible',
        comparator: 'deep',
        script: [
          { op: 'prepend', args: [1] },
          { op: 'prepend', args: [2] },
          { op: 'to_list', expect: [2, 1] },
        ],
      },
      {
        id: 'prepend-onto-longer-list',
        group: 'hidden',
        comparator: 'deep',
        label: 'prepend onto an existing multi-node list',
        script: [
          { op: 'append', args: [1] },
          { op: 'append', args: [2] },
          { op: 'prepend', args: [0] },
          { op: 'to_list', expect: [0, 1, 2] },
        ],
      },
      {
        id: 'mix-append-and-prepend',
        group: 'hidden',
        comparator: 'deep',
        label: 'mix of append and prepend',
        script: [
          { op: 'prepend', args: [5] },
          { op: 'append', args: [6] },
          { op: 'to_list', expect: [5, 6] },
        ],
      },
      {
        id: 'prepend-into-empty',
        group: 'edge',
        comparator: 'deep',
        label: 'prepend into an empty list',
        script: [
          { op: 'prepend', args: [1] },
          { op: 'to_list', expect: [1] },
        ],
      },
      {
        id: 'prepend-duplicate-values',
        group: 'edge',
        comparator: 'deep',
        label: 'duplicate values',
        script: [
          { op: 'prepend', args: [1] },
          { op: 'prepend', args: [1] },
          { op: 'to_list', expect: [1, 1] },
        ],
      },
    ],
  },
};
