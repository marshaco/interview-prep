import type { CodeQuestion } from '../../../../types';

export const step4Search: CodeQuestion = {
  id: 'linked-list/guided-build/4-search',
  kind: 'method_impl',
  moduleId: 'linked-list',
  skillIds: ['linked-list/search'],
  title: 'search',
  prompt: `## Guided Build 4 of 4: search

Last method. Implement \`search(value)\`: return \`True\` if any node holds
\`value\`, \`False\` otherwise. Once this passes, your \`LinkedList\` class is
complete — the same shape as the Independent Build questions in the next
stage.
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

    def search(self, value):
        # TODO: return True if value is found anywhere in the list.

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

    def search(self, value):
        cur = self.head
        while cur is not None:
            if cur.val == value:
                return True
            cur = cur.next
        return False

    def to_list(self):
        result = []
        cur = self.head
        while cur is not None:
            result.append(cur.val)
            cur = cur.next
        return result
`,
  hints: [
    'Same walk as always — you\'re just checking a condition at each node instead of collecting values or splicing pointers.',
    'Stop as soon as you find a match; there\'s no need to keep walking after that.',
    'cur = self.head; while cur is not None: if cur.val == value: return True; cur = cur.next. Return False once the loop ends.',
    'def search(self, value): cur = self.head; while cur is not None: if cur.val == value: return True; cur = cur.next; return False.',
  ],
  spec: {
    mode: 'class',
    entryPoint: 'LinkedList',
    tests: [
      {
        id: 'search-found',
        group: 'visible',
        comparator: 'deep',
        script: [
          { op: 'append', args: [1] },
          { op: 'append', args: [2] },
          { op: 'append', args: [3] },
          { op: 'search', args: [2], expect: true },
        ],
      },
      {
        id: 'search-not-found',
        group: 'visible',
        comparator: 'deep',
        script: [
          { op: 'append', args: [1] },
          { op: 'search', args: [9], expect: false },
        ],
      },
      {
        id: 'search-after-deletion',
        group: 'hidden',
        comparator: 'deep',
        label: 'search after deletion',
        script: [
          { op: 'append', args: [1] },
          { op: 'append', args: [2] },
          { op: 'delete', args: [1] },
          { op: 'search', args: [1], expect: false },
        ],
      },
      {
        id: 'search-after-prepend',
        group: 'hidden',
        comparator: 'deep',
        label: 'search after prepend',
        script: [
          { op: 'prepend', args: [5] },
          { op: 'search', args: [5], expect: true },
        ],
      },
      {
        id: 'search-empty-list',
        group: 'edge',
        comparator: 'deep',
        label: 'search an empty list',
        script: [{ op: 'search', args: [1], expect: false }],
      },
      {
        id: 'search-duplicate-values',
        group: 'edge',
        comparator: 'deep',
        label: 'duplicate values',
        script: [
          { op: 'append', args: [1] },
          { op: 'append', args: [1] },
          { op: 'search', args: [1], expect: true },
        ],
      },
    ],
  },
  reviewable: false,
};
