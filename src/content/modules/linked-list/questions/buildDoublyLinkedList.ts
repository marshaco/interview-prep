import type { CodeQuestion } from '../../../types';

export const buildDoublyLinkedList: CodeQuestion = {
  id: 'linked-list/build-doubly-linked-list',
  kind: 'full_impl',
  moduleId: 'linked-list',
  skillIds: ['linked-list/full-build-doubly'],
  title: 'Build: DoublyLinkedList',
  prompt: `## Build a full DoublyLinkedList class

Implement a \`DoublyLinkedList\` class that tracks both \`head\` and \`tail\`,
and whose nodes have both \`.next\` and \`.prev\`:

- \`append(value)\` — add to the end in O(1) using the tracked tail
- \`prepend(value)\` — add to the front
- \`delete(value)\` — remove the first node holding \`value\`, fixing up
  \`head\`/\`tail\` if the removed node was either end
- \`to_list_forward()\` — contents head-to-tail
- \`to_list_backward()\` — contents tail-to-head, via \`.prev\`

The hard part isn't any single method — it's keeping \`head\`, \`tail\`, and
every node's \`.prev\`/\`.next\` consistent with each other after every
operation.
`,
  starterCode: `class DNode:
    def __init__(self, val):
        self.val = val
        self.prev = None
        self.next = None


class DoublyLinkedList:
    def __init__(self):
        self.head = None
        self.tail = None

    def append(self, value):
        # TODO
        pass

    def prepend(self, value):
        # TODO
        pass

    def delete(self, value):
        # TODO
        pass

    def to_list_forward(self):
        # TODO
        pass

    def to_list_backward(self):
        # TODO
        pass
`,
  solution: `class DNode:
    def __init__(self, val):
        self.val = val
        self.prev = None
        self.next = None


class DoublyLinkedList:
    def __init__(self):
        self.head = None
        self.tail = None

    def append(self, value):
        node = DNode(value)
        if self.tail is None:
            self.head = node
            self.tail = node
            return
        node.prev = self.tail
        self.tail.next = node
        self.tail = node

    def prepend(self, value):
        node = DNode(value)
        if self.head is None:
            self.head = node
            self.tail = node
            return
        node.next = self.head
        self.head.prev = node
        self.head = node

    def delete(self, value):
        cur = self.head
        while cur is not None and cur.val != value:
            cur = cur.next
        if cur is None:
            return
        if cur.prev is not None:
            cur.prev.next = cur.next
        else:
            self.head = cur.next
        if cur.next is not None:
            cur.next.prev = cur.prev
        else:
            self.tail = cur.prev

    def to_list_forward(self):
        result = []
        cur = self.head
        while cur is not None:
            result.append(cur.val)
            cur = cur.next
        return result

    def to_list_backward(self):
        result = []
        cur = self.tail
        while cur is not None:
            result.append(cur.val)
            cur = cur.prev
        return result
`,
  hints: [
    'append and prepend both have an empty-list special case where head and tail become the same node.',
    'delete is the one that bites: after finding the node, you must patch up to four pointers (the neighbor before, the neighbor after, and possibly head and/or tail) depending on whether the deleted node was in the middle, at the head, or at the tail.',
    'For delete: if cur.prev exists, cur.prev.next = cur.next, else self.head = cur.next (deleting head). Symmetrically, if cur.next exists, cur.next.prev = cur.prev, else self.tail = cur.prev (deleting tail). Both checks are independent — a single-node list needs both branches to fire.',
    'append: if tail is None, head=tail=new node; else link new node after tail and move tail. prepend is the mirror image using head. delete: walk to the matching node, then apply the four-pointer patch above. to_list_forward walks from head via .next; to_list_backward walks from tail via .prev.',
  ],
  spec: {
    mode: 'class',
    entryPoint: 'DoublyLinkedList',
    tests: [
      {
        id: 'append-both-directions',
        group: 'visible',
        comparator: 'deep',
        script: [
          { op: 'append', args: [1] },
          { op: 'append', args: [2] },
          { op: 'append', args: [3] },
          { op: 'to_list_forward', expect: [1, 2, 3] },
          { op: 'to_list_backward', expect: [3, 2, 1] },
        ],
      },
      {
        id: 'prepend-sequence',
        group: 'visible',
        comparator: 'deep',
        script: [
          { op: 'prepend', args: [1] },
          { op: 'prepend', args: [2] },
          { op: 'to_list_forward', expect: [2, 1] },
        ],
      },
      {
        id: 'delete-middle-keeps-both-directions-consistent',
        group: 'hidden',
        comparator: 'deep',
        label: 'delete a middle node and check both directions',
        script: [
          { op: 'append', args: [1] },
          { op: 'append', args: [2] },
          { op: 'append', args: [3] },
          { op: 'delete', args: [2] },
          { op: 'to_list_forward', expect: [1, 3] },
          { op: 'to_list_backward', expect: [3, 1] },
        ],
      },
      {
        id: 'delete-only-node-clears-head-and-tail',
        group: 'hidden',
        comparator: 'deep',
        label: 'delete the only node updates both head and tail',
        script: [
          { op: 'append', args: [1] },
          { op: 'delete', args: [1] },
          { op: 'to_list_forward', expect: [] },
          { op: 'to_list_backward', expect: [] },
        ],
      },
      {
        id: 'empty-list',
        group: 'edge',
        comparator: 'deep',
        label: 'empty list',
        script: [
          { op: 'to_list_forward', expect: [] },
          { op: 'to_list_backward', expect: [] },
        ],
      },
      {
        id: 'delete-head-keeps-tail-consistent',
        group: 'edge',
        comparator: 'deep',
        label: 'delete the head node keeps the tail correct',
        script: [
          { op: 'append', args: [1] },
          { op: 'append', args: [2] },
          { op: 'delete', args: [1] },
          { op: 'to_list_forward', expect: [2] },
          { op: 'to_list_backward', expect: [2] },
        ],
      },
    ],
  },
};
