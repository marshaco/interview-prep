import type { CodeQuestion } from '../../../types';

export const buildSinglyLinkedList: CodeQuestion = {
  id: 'linked-list/build-singly-linked-list',
  kind: 'full_impl',
  moduleId: 'linked-list',
  skillIds: ['linked-list/full-build-singly'],
  title: 'Build: LinkedList',
  prompt: `## Build a full LinkedList class

Implement a \`LinkedList\` class from scratch, storing its own head:

- \`append(value)\` — add to the end
- \`prepend(value)\` — add to the front
- \`delete(value)\` — remove the first node holding \`value\`, if any
- \`search(value)\` — return \`True\`/\`False\`
- \`to_list()\` — return the contents as a plain Python list, head to tail

This is the same behavior as the method-drill questions, but now you own the
state (\`self.head\`) instead of receiving it as a parameter.

\`\`\`python
class LinkedList:
    def __init__(self):
        self.head = None

    def append(self, value):
        ...
\`\`\`
`,
  starterCode: `class Node:
    def __init__(self, val):
        self.val = val
        self.next = None


class LinkedList:
    def __init__(self):
        self.head = None

    def append(self, value):
        # TODO

    def prepend(self, value):
        # TODO

    def delete(self, value):
        # TODO

    def search(self, value):
        # TODO

    def to_list(self):
        # TODO
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
    'Think of the five methods in two groups: the ones that change the list (append, prepend, delete) and the ones that only read it (search, to_list).',
    'Every method needs to handle self.head being None — an empty list is the case that breaks a naive implementation first.',
    'This is exactly the method-drill logic you already practiced (append/prepend/delete/search), just storing the head on self instead of passing/returning it. to_list is the same walk as the harness’s own list-dumping helper.',
    'append/prepend/delete/search all walk with a `cur` pointer starting at self.head, handling the empty-list and head-match cases before falling through to the general walk-and-splice/compare logic; to_list collects cur.val while cur is not None.',
  ],
  visualization: {
    kind: 'linked_list',
    demoScript: [
      { op: 'append', args: [1] },
      { op: 'append', args: [2] },
      { op: 'append', args: [3] },
      { op: 'prepend', args: [0] },
      { op: 'delete', args: [2] },
    ],
  },
  spec: {
    mode: 'class',
    entryPoint: 'LinkedList',
    tests: [
      {
        id: 'append-sequence',
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
        id: 'prepend-sequence',
        group: 'visible',
        comparator: 'deep',
        script: [
          { op: 'prepend', args: [1] },
          { op: 'prepend', args: [2] },
          { op: 'to_list', expect: [2, 1] },
        ],
      },
      {
        id: 'delete-head-by-value',
        group: 'hidden',
        comparator: 'deep',
        label: 'delete the head node by value',
        script: [
          { op: 'append', args: [1] },
          { op: 'append', args: [2] },
          { op: 'delete', args: [1] },
          { op: 'to_list', expect: [2] },
        ],
      },
      {
        id: 'search-hit-and-miss',
        group: 'hidden',
        comparator: 'deep',
        label: 'search for a present and an absent value',
        script: [
          { op: 'append', args: [1] },
          { op: 'append', args: [2] },
          { op: 'append', args: [3] },
          { op: 'search', args: [2], expect: true },
          { op: 'search', args: [9], expect: false },
        ],
      },
      {
        id: 'empty-list',
        group: 'edge',
        comparator: 'deep',
        label: 'empty list',
        script: [{ op: 'to_list', expect: [] }],
      },
      {
        id: 'delete-only-node',
        group: 'edge',
        comparator: 'deep',
        label: 'delete the only node in the list',
        script: [
          { op: 'append', args: [5] },
          { op: 'delete', args: [5] },
          { op: 'to_list', expect: [] },
        ],
      },
    ],
  },
  reviewable: true,
  estimatedMinutes: 15,
};
