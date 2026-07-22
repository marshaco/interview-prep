import type { CodeQuestion } from '../../../types';

export const buildCircularLinkedList: CodeQuestion = {
  id: 'linked-list/build-circular-linked-list',
  kind: 'full_impl',
  moduleId: 'linked-list',
  skillIds: ['linked-list/full-build-circular'],
  title: 'Build: CircularLinkedList',
  prompt: `## Build a full CircularLinkedList class

Implement a \`CircularLinkedList\` class where the last node's \`.next\`
points back to the first node instead of \`None\`:

- \`append(value)\` — add to the end, keeping the circular link
- \`to_list(limit)\` — return the values of up to \`limit\` nodes, starting
  from \`head\` and wrapping around if \`limit\` exceeds the list's length
  (e.g. a 2-node list with \`limit=5\` returns 5 values, repeating)
- \`length()\` — return the true number of distinct nodes, **without**
  looping forever

There is no \`None\` to stop at here — every method has to reason about the
circular link explicitly instead of relying on it running out.
`,
  starterCode: `class CNode:
    def __init__(self, val):
        self.val = val
        self.next = None


class CircularLinkedList:
    def __init__(self):
        self.head = None

    def append(self, value):
        # TODO

    def to_list(self, limit):
        # TODO

    def length(self):
        # TODO
`,
  solution: `class CNode:
    def __init__(self, val):
        self.val = val
        self.next = None


class CircularLinkedList:
    def __init__(self):
        self.head = None

    def append(self, value):
        node = CNode(value)
        if self.head is None:
            node.next = node
            self.head = node
            return
        tail = self.head
        while tail.next is not self.head:
            tail = tail.next
        tail.next = node
        node.next = self.head

    def to_list(self, limit):
        result = []
        if self.head is None:
            return result
        cur = self.head
        for _ in range(limit):
            result.append(cur.val)
            cur = cur.next
        return result

    def length(self):
        if self.head is None:
            return 0
        count = 1
        cur = self.head.next
        while cur is not self.head:
            count += 1
            cur = cur.next
        return count
`,
  hints: [
    'Every walk in this class needs a stopping condition that isn\'t "node is None" — since that never happens here.',
    'append needs to find the current last node (the one whose .next is head) before it can attach the new node and re-close the loop.',
    'to_list(limit) doesn\'t need to know the list\'s real length — just take exactly `limit` steps and stop, regardless of whether you\'ve wrapped around. length() needs to walk until it gets back to the starting node, not until .next is None.',
    'append: if head is None, the new node points to itself and becomes head; otherwise walk from head while `tail.next is not self.head` to find the real last node, then splice the new node in and point it back to head. to_list: start at head, append cur.val and advance exactly `limit` times. length: count = 1, walk from head.next while `cur is not self.head`, incrementing count each step.',
  ],
  visualization: {
    kind: 'linked_list',
    demoScript: [
      { op: 'append', args: [1] },
      { op: 'append', args: [2] },
      { op: 'append', args: [3] },
      { op: 'append', args: [4] },
    ],
  },
  spec: {
    mode: 'class',
    entryPoint: 'CircularLinkedList',
    tests: [
      {
        id: 'append-and-length',
        group: 'visible',
        comparator: 'deep',
        script: [
          { op: 'append', args: [1] },
          { op: 'append', args: [2] },
          { op: 'append', args: [3] },
          { op: 'to_list', args: [3], expect: [1, 2, 3] },
          { op: 'length', expect: 3 },
        ],
      },
      {
        id: 'wraps-around-single-node',
        group: 'visible',
        comparator: 'deep',
        script: [
          { op: 'append', args: [1] },
          { op: 'to_list', args: [4], expect: [1, 1, 1, 1] },
        ],
      },
      {
        id: 'wraps-around-past-tail',
        group: 'hidden',
        comparator: 'deep',
        label: 'to_list wraps around past the tail back to head',
        script: [
          { op: 'append', args: [1] },
          { op: 'append', args: [2] },
          { op: 'to_list', args: [5], expect: [1, 2, 1, 2, 1] },
        ],
      },
      {
        id: 'length-does-not-loop-forever',
        group: 'hidden',
        comparator: 'deep',
        label: 'length terminates on a longer circular list',
        script: [
          { op: 'append', args: [1] },
          { op: 'append', args: [2] },
          { op: 'append', args: [3] },
          { op: 'append', args: [4] },
          { op: 'length', expect: 4 },
        ],
      },
      {
        id: 'empty-list',
        group: 'edge',
        comparator: 'deep',
        label: 'empty list',
        script: [
          { op: 'to_list', args: [3], expect: [] },
          { op: 'length', expect: 0 },
        ],
      },
      {
        id: 'single-node-self-loop',
        group: 'edge',
        comparator: 'deep',
        label: 'single node points to itself',
        script: [
          { op: 'append', args: [5] },
          { op: 'length', expect: 1 },
          { op: 'to_list', args: [1], expect: [5] },
        ],
      },
    ],
  },
};
