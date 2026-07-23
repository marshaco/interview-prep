import type { CodeQuestion } from '../../../types';

export const prepend: CodeQuestion = {
  id: 'linked-list/prepend',
  kind: 'method_impl',
  moduleId: 'linked-list',
  skillIds: ['linked-list/prepend'],
  title: 'prepend',
  prompt: `## prepend

Given the head of a singly linked list and a value, add a new node holding
that value to the **front** of the list. Return the new head.

\`\`\`python
def prepend(head, value):
    ...
\`\`\`
`,
  starterCode: `class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next


def prepend(head, value):
    # TODO: attach a new node holding value to the front of the list.
`,
  solution: `class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next


def prepend(head, value):
    return ListNode(value, head)
`,
  hints: [
    'The new node needs to point at the old head — there is no walking involved here.',
    'A node\'s `next` can be set at construction time; you don\'t have to build it first and wire `.next` after.',
    'new_node = ListNode(value); new_node.next = head; return new_node.',
    'return ListNode(value, head) — the ListNode constructor already takes `next` as its second argument.',
  ],
  spec: {
    mode: 'function',
    entryPoint: 'prepend',
    argTypes: ['linked_list', 'value'],
    resultType: 'linked_list',
    tests: [
      { id: 'basic', group: 'visible', args: [[1, 2, 3], 0], expected: [0, 1, 2, 3], comparator: 'deep' },
      { id: 'to-empty', group: 'visible', args: [[], 9], expected: [9], comparator: 'deep' },
      { id: 'single-node', group: 'hidden', args: [[5], 1], expected: [1, 5], comparator: 'deep', label: 'single node list' },
      { id: 'longer-list', group: 'hidden', args: [[1, 2, 3, 4], 0], expected: [0, 1, 2, 3, 4], comparator: 'deep', label: 'longer list' },
      { id: 'empty-list', group: 'edge', args: [[], 0], expected: [0], comparator: 'deep', label: 'empty list' },
      { id: 'duplicate-values', group: 'edge', args: [[1, 1, 1], 1], expected: [1, 1, 1, 1], comparator: 'deep', label: 'duplicate values' },
    ],
  },
  reviewable: true,
  estimatedMinutes: 20,
};
