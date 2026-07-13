import type { CodeQuestion } from '../../../../types';

export const step3Delete: CodeQuestion = {
  id: 'linked-list/guided-build/3-delete',
  kind: 'method_impl',
  moduleId: 'linked-list',
  skillIds: ['linked-list/delete'],
  title: 'Guided Build 3/4: delete',
  prompt: `## Guided Build 3 of 4: delete

\`append\` and \`prepend\` are done. Now implement \`delete(value)\`: remove
the **first** node holding \`value\`, if any. If the value isn't present,
leave the list unchanged.
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
        node = Node(value)
        node.next = self.head
        self.head = node

    def delete(self, value):
        # TODO: remove the first node whose .val == value, if any.
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

    def delete(self, value):
        if self.head is None:
            return
        if self.head.val == value:
            self.head = self.head.next
            return
        cur = self.head
        while cur.next is not None and cur.next.val != value:
            cur = cur.next
        if cur.next is not None:
            cur.next = cur.next.next

    def to_list(self):
        result = []
        cur = self.head
        while cur is not None:
            result.append(cur.val)
            cur = cur.next
        return result
`,
  hints: [
    'Deleting the head is different from deleting any other node — the head itself changes, not just some node\'s .next.',
    'To remove a node that isn\'t the head, you need a reference to the node *before* it, so you can splice past the target by relinking .next.',
    'if self.head is None: return. If self.head.val == value: self.head = self.head.next; return. Otherwise walk with `cur` while cur.next is not None and cur.next.val != value, then splice past cur.next if it matched.',
    'def delete(self, value): if self.head is None: return; if self.head.val == value: self.head = self.head.next; return; cur = self.head; while cur.next is not None and cur.next.val != value: cur = cur.next; if cur.next is not None: cur.next = cur.next.next.',
  ],
  visualization: {
    kind: 'linked_list',
    demoScript: [
      { op: 'append', args: [1] },
      { op: 'append', args: [2] },
      { op: 'append', args: [3] },
      { op: 'delete', args: [2] },
    ],
  },
  spec: {
    mode: 'class',
    entryPoint: 'LinkedList',
    tests: [
      {
        id: 'delete-middle',
        group: 'visible',
        comparator: 'deep',
        script: [
          { op: 'append', args: [1] },
          { op: 'append', args: [2] },
          { op: 'append', args: [3] },
          { op: 'delete', args: [2] },
          { op: 'to_list', expect: [1, 3] },
        ],
      },
      {
        id: 'delete-only-node',
        group: 'visible',
        comparator: 'deep',
        script: [
          { op: 'append', args: [1] },
          { op: 'delete', args: [1] },
          { op: 'to_list', expect: [] },
        ],
      },
      {
        id: 'delete-head-of-longer-list',
        group: 'hidden',
        comparator: 'deep',
        label: 'delete the head node of a longer list',
        script: [
          { op: 'append', args: [1] },
          { op: 'append', args: [2] },
          { op: 'delete', args: [1] },
          { op: 'to_list', expect: [2] },
        ],
      },
      {
        id: 'delete-duplicate-values',
        group: 'hidden',
        comparator: 'deep',
        label: 'duplicate values, only first occurrence removed',
        script: [
          { op: 'append', args: [1] },
          { op: 'append', args: [2] },
          { op: 'append', args: [2] },
          { op: 'delete', args: [2] },
          { op: 'to_list', expect: [1, 2] },
        ],
      },
      {
        id: 'delete-from-empty',
        group: 'edge',
        comparator: 'deep',
        label: 'delete from an empty list',
        script: [
          { op: 'delete', args: [5] },
          { op: 'to_list', expect: [] },
        ],
      },
      {
        id: 'delete-value-not-present',
        group: 'edge',
        comparator: 'deep',
        label: 'value not present',
        script: [
          { op: 'append', args: [1] },
          { op: 'delete', args: [9] },
          { op: 'to_list', expect: [1] },
        ],
      },
    ],
  },
};
